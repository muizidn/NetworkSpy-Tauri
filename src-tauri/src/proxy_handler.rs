use crate::*;
use std::sync::Mutex;
use std::time::Instant;

pub struct MyTrafficListener {
    pub app_handle: AppHandle,
    pub traffic_db: Arc<TrafficDb>,
    pub tag_manager: Arc<TagManager>,
    pub proxy_settings: Arc<std::sync::RwLock<ProxySettings>>,
    pub request_times: Mutex<HashMap<u64, (Instant, String, String)>>, // Stores start time, uri, and method
    pub tray_stats: Arc<TrayStats>,
    pub session_id: String,
    pub breakpoint_manager: Arc<BreakpointManager>,
    pub script_manager: Arc<ScriptManager>,
}

#[async_trait]
impl TrafficListener for MyTrafficListener {
    async fn request(&self, id: u64, mut request: Request<Bytes>, intercepted: bool, client_addr: String) -> Request<Bytes> {
        self.tray_stats.total_requests.fetch_add(1, Ordering::Relaxed);
        self.tray_stats.tx_bytes.fetch_add(request.body().len() as u64, Ordering::Relaxed);
        
        let mut uri = request.uri().to_string();
        
        // Clean up redundant default ports from the URI
        if uri.starts_with("https://") {
            uri = uri.replace(":443/", "/");
            if uri.ends_with(":443") {
                uri = uri[..uri.len() - 4].to_string();
            }
        } else if uri.starts_with("http://") {
            uri = uri.replace(":80/", "/");
            if uri.ends_with(":80") {
                uri = uri[..uri.len() - 3].to_string();
            }
        }
        
        let method = request.method().as_str().to_string();
 
        let show_connect = if let Ok(settings) = self.proxy_settings.read() {
            settings.show_connect_method
        } else {
            false
        };
 
        if !show_connect && method.trim().to_uppercase() == "CONNECT" {
            return request;
        }
 
        self.request_times.lock().unwrap().insert(id, (Instant::now(), uri.clone(), method.clone()));
        
        let http_version = match request.version() {
            Version::HTTP_10 => "HTTP/1.0".to_string(),
            Version::HTTP_11 => "HTTP/1.1".to_string(),
            Version::HTTP_2 => "HTTP/2".to_string(),
            Version::HTTP_3 => "HTTP/3".to_string(),
            _ => "Unknown".to_string(),
        };
 
        let headers = request
            .headers()
            .iter()
            .map(|(key, value)| {
                (key.to_string(), value.to_str().unwrap_or("").to_string())
            })
            .collect::<HashMap<_, _>>();
 
        let body_bytes = request.body();
        let body_vec = body_bytes.to_vec();
        let decompressed_body = decompress_body(&headers, body_vec);
        let body_size = decompressed_body.len();
 
        let content_type = headers.get("content-type").or_else(|| headers.get("Content-Type")).cloned();
        let content_encoding = headers.get("content-encoding").or_else(|| headers.get("Content-Encoding")).cloned();
 
        let client_info = traffic::process_info::get_client_info(&client_addr);
 
        let tags = self.tag_manager.sync_tagging(&uri, &method, &headers);
 
        let traffic_id = format!("{}_{}", self.session_id, id);
 
        self.traffic_db.insert_request(TrafficEvent::Request {
            id: traffic_id.clone(),
            uri: uri.clone(),
            method: method.clone(),
            version: http_version.clone(),
            headers: headers.clone(),
            body: decompressed_body.clone(),
            content_type,
            content_encoding,
            intercepted,
            client: client_info.clone(),
            tags: tags.clone(),
        });
        
        // Async tagging for request body if needed
        self.tag_manager.async_tagging(traffic_id.clone(), uri.clone(), method.clone(), headers.clone(), decompressed_body.clone(), self.app_handle.clone());
 
        let _result = self.app_handle.emit(
            "traffic_event",
            Payload {
                id: traffic_id.clone(),
                is_request: true,
                data: PayloadTraffic {
                    uri: Some(uri.clone()),
                    version: Some(http_version.clone()),
                    method: Some(method.clone()),
                    headers: headers.clone(),
                    body_size,
                    intercepted,
                    status_code: None,
                    client: Some(client_info.clone()),
                    tags: tags.clone(),
                },
            },
        );
 
        // 1. Handle Automated Scripts
        let mut script_modified_data = None;
        let mut final_script_name = String::new();
        if self.script_manager.is_enabled.load(Ordering::SeqCst) {
            if let Ok(scripts) = self.traffic_db.get_scripts() {
                for script_rule in scripts {
                    if script_rule.enabled && script_rule.request && matches_breakpoint(&uri, &method, &script_rule.matching_rule, &script_rule.method) {
                        let script_data = BreakpointData {
                            id: format!("{}_req_script", traffic_id),
                            headers: headers.clone(),
                            body: decompressed_body.clone(),
                            method: Some(method.clone()),
                            uri: Some(uri.clone()),
                            status_code: None,
                        };
                        
                        match run_script(&script_rule.script, script_data) {
                            Ok(modified) => {
                                final_script_name = script_rule.name.clone();
                                script_modified_data = Some(modified);
                            }
                            Err(e) => println!("Script error in rule '{}': {}", script_rule.name, e),
                        }
                    }
                }
            }
        }

        // Apply script modifications immediately (partially) so breakpoint sees them
        let mut modified_request_data = script_modified_data;

        // 2. Handle Breakpoint for Request
        let mut should_pause = false;
        let mut matched_rule_name = String::new();

        if self.breakpoint_manager.is_enabled.load(Ordering::SeqCst) {
            if let Ok(rules) = self.traffic_db.get_breakpoints() {
                for rule in rules {
                    if rule.enabled && rule.request && matches_breakpoint(&uri, &method, &rule.matching_rule, &rule.method) {
                        should_pause = true;
                        matched_rule_name = rule.name.clone();
                        break;
                    }
                }
            }
        }

        if should_pause {
            let (tx, rx) = tokio::sync::oneshot::channel();
            let hit_id = format!("{}_req", traffic_id);
            
            // If modified by script, use that as the starting point for the breakpoint
            let current_bp_data = if let Some(ref m) = modified_request_data {
                m.clone()
            } else {
                BreakpointData {
                    id: hit_id.clone(),
                    headers: headers.clone(),
                    body: decompressed_body.clone(),
                    method: Some(method.clone()),
                    uri: Some(uri.clone()),
                    status_code: None,
                }
            };

            {
                let mut tasks = self.breakpoint_manager.paused_tasks.write().await;
                tasks.insert(hit_id.clone(), PausedTask {
                    sender: tx,
                    name: matched_rule_name.clone(),
                    data: current_bp_data,
                });
            }
            
            let _ = self.app_handle.emit("breakpoint_hit", BreakpointHit { id: hit_id, name: matched_rule_name.clone() });
            
            // Wait for resume with optional modified data
            if let Ok(Some(modified)) = rx.await {
                modified_request_data = Some(modified);
            }
        }

        // 3. Final modification application and DB Update
        if let Some(modified) = modified_request_data {
            // Apply modifications to the live request
            let body_mut = request.body_mut();
            *body_mut = Bytes::from(modified.body.clone());

            let header_mut = request.headers_mut();
            header_mut.clear();
            let mut updated_headers = HashMap::new();
            for (k, v) in modified.headers.clone() {
                let k_lower = k.to_lowercase();
                if k_lower == "content-encoding" || k_lower == "content-length" {
                    continue;
                }
                if let (Ok(key), Ok(val)) = (hyper::header::HeaderName::from_bytes(k.as_bytes()), hyper::header::HeaderValue::from_str(&v)) {
                    header_mut.insert(key.clone(), val);
                    updated_headers.insert(k.clone(), v.clone());
                }
            }
            
            let mut updated_uri = uri.clone();
            let mut updated_method = method.clone();
            if let Some(m) = modified.method.clone() {
                if let Ok(method_val) = hyper::Method::from_bytes(m.as_bytes()) {
                    *request.method_mut() = method_val;
                    updated_method = m;
                }
            }
            if let Some(u) = modified.uri.clone() {
                if let Ok(uri_val) = hyper::Uri::try_from(&u) {
                    *request.uri_mut() = uri_val;
                    updated_uri = u;
                }
            }

            // Detect changes and add tags
            let mut modification_tags = tags.clone();
            if !matched_rule_name.is_empty() {
                modification_tags.push(format!("BREAKPOINT: {}", matched_rule_name));
            }
            if !final_script_name.is_empty() {
                modification_tags.push(format!("SCRIPT: {}", final_script_name));
            }

            if modified.body != decompressed_body {
                modification_tags.push("MODIFIED_BODY".to_string());
            }
            if updated_headers != headers {
                modification_tags.push("MODIFIED_HEADERS".to_string());
            }
            if updated_uri != uri {
                modification_tags.push("MODIFIED_URI".to_string());
            }
            if updated_method != method {
                modification_tags.push("MODIFIED_METHOD".to_string());
            }

            // Update DB and re-emit to reflect changes in viewer
            let updated_body_size = modified.body.len();
            self.traffic_db.insert_request(TrafficEvent::Request {
                id: traffic_id.clone(),
                uri: updated_uri.clone(),
                method: updated_method.clone(),
                version: http_version.clone(),
                headers: updated_headers.clone(),
                body: modified.body.clone(),
                content_type: updated_headers.get("content-type").or_else(|| updated_headers.get("Content-Type")).cloned(),
                content_encoding: None,
                intercepted,
                client: client_info.clone(),
                tags: modification_tags.clone(),
            });

            let _ = self.app_handle.emit(
                "traffic_event",
                Payload {
                    id: traffic_id.clone(),
                    is_request: true,
                    data: PayloadTraffic {
                        uri: Some(updated_uri),
                        version: Some(http_version),
                        method: Some(updated_method),
                        headers: updated_headers,
                        body_size: updated_body_size,
                        intercepted,
                        status_code: None,
                        client: Some(client_info),
                        tags: modification_tags,
                    },
                },
            );
        }

        request
    }

    async fn response(&self, id: u64, mut response: Response<Bytes>, intercepted: bool, client_addr: String) -> Response<Bytes> {
        self.tray_stats.rx_bytes.fetch_add(response.body().len() as u64, Ordering::Relaxed);
        
        let (start_time, uri, method) = match self.request_times.lock().unwrap().remove(&id) {
            Some(data) => data,
            None => return response, // If request was filtered, we ignore the response too but still return it
        };
        let duration = start_time.elapsed().as_millis();
        
        let status_code = response.status().as_u16();
        let http_version = match response.version() {
            Version::HTTP_10 => "HTTP/1.0".to_string(),
            Version::HTTP_11 => "HTTP/1.1".to_string(),
            Version::HTTP_2 => "HTTP/2".to_string(),
            Version::HTTP_3 => "HTTP/3".to_string(),
            _ => "Unknown".to_string(),
        };
 
        let headers = response
            .headers()
            .iter()
            .map(|(key, value)| {
                (key.to_string(), value.to_str().unwrap_or("").to_string())
            })
            .collect::<HashMap<_, _>>();
 
        let body_bytes = response.body();
        let body_vec = body_bytes.to_vec();
        let decompressed_body = decompress_body(&headers, body_vec);
        let body_size = decompressed_body.len();
 
        let content_type = headers.get("content-type").or_else(|| headers.get("Content-Type")).cloned();
        let content_encoding = headers.get("content-encoding").or_else(|| headers.get("Content-Encoding")).cloned();
 
        let traffic_id = format!("{}_{}", self.session_id, id);
 
        self.traffic_db.insert_response(TrafficEvent::Response {
            id: traffic_id.clone(),
            headers: headers.clone(),
            body: decompressed_body.clone(),
            content_type,
            content_encoding,
            status_code,
        });
 
        let client_info = traffic::process_info::get_client_info(&client_addr);
 
        let mut headers_with_perf = headers.clone();
        headers_with_perf.insert("x-latency-ms".to_string(), duration.to_string());
 
        // Async tagging for response body
        self.tag_manager.async_tagging(traffic_id.clone(), uri.clone(), method.clone(), headers.clone(), decompressed_body.clone(), self.app_handle.clone());
 
        let _result = self.app_handle.emit(
            "traffic_event",
            Payload {
                id: traffic_id.clone(),
                is_request: false,
                data: PayloadTraffic {
                    uri: None,
                    version: Some(http_version.clone()),
                    method: None,
                    headers: headers_with_perf.clone(),
                    body_size,
                    intercepted,
                    status_code: Some(status_code),
                    client: Some(client_info.clone()),
                    tags: Vec::new(), // Tags will be updated via tags_updated event if async rules match
                },
            },
        );
 
        // Handle Breakpoint for Response
        let mut should_pause = false;
        let mut matched_rule_name = String::new();
 
        if self.breakpoint_manager.is_enabled.load(Ordering::SeqCst) {
            if let Ok(rules) = self.traffic_db.get_breakpoints() {
                for rule in rules {
                    if rule.enabled && rule.response && matches_breakpoint(&uri, &method, &rule.matching_rule, &rule.method) {
                        should_pause = true;
                        matched_rule_name = rule.name.clone();
                        break;
                    }
                }
            }
        }
 
        // Handle scripts for response
        let mut modified_by_script = None;
        let mut script_name = String::new();
        if self.script_manager.is_enabled.load(Ordering::SeqCst) {
            if let Ok(scripts) = self.traffic_db.get_scripts() {
                for script_rule in scripts {
                    if script_rule.enabled && script_rule.response && matches_breakpoint(&uri, &method, &script_rule.matching_rule, &script_rule.method) {
                        let script_data = BreakpointData {
                            id: format!("{}_res_script", traffic_id),
                            headers: headers_with_perf.clone(),
                            body: decompressed_body.clone(),
                            method: Some(method.clone()),
                            uri: Some(uri.clone()),
                            status_code: Some(status_code),
                        };

                        match run_script(&script_rule.script, script_data) {
                            Ok(modified) => {
                                script_name = script_rule.name.clone();
                                modified_by_script = Some(modified);
                            }
                            Err(e) => println!("Script error in rule '{}': {}", script_rule.name, e),
                        }
                    }
                }
            }
        }

        let mut final_modified_data = modified_by_script;

        if should_pause {
            let (tx, rx) = tokio::sync::oneshot::channel();
            let hit_id = format!("{}_res", traffic_id);
            
            let current_bp_data = if let Some(ref m) = final_modified_data {
                m.clone()
            } else {
                BreakpointData {
                    id: hit_id.clone(),
                    headers: headers_with_perf.clone(),
                    body: decompressed_body.clone(),
                    method: Some(method.clone()),
                    uri: Some(uri.clone()),
                    status_code: Some(status_code),
                }
            };

            {
                let mut tasks = self.breakpoint_manager.paused_tasks.write().await;
                tasks.insert(hit_id.clone(), PausedTask {
                    sender: tx,
                    name: matched_rule_name.clone(),
                    data: current_bp_data,
                });
            }
            
            let _ = self.app_handle.emit("breakpoint_hit", BreakpointHit { id: hit_id, name: matched_rule_name.clone() });
            
            // Wait for resume
            if let Ok(Some(modified)) = rx.await {
                final_modified_data = Some(modified);
            }
        }

        if let Some(modified) = final_modified_data {
                // Apply modifications
                let body_mut = response.body_mut();
                *body_mut = Bytes::from(modified.body.clone());
 
                let header_mut = response.headers_mut();
                header_mut.clear();
                let mut updated_headers = HashMap::new();
                for (k, v) in modified.headers.clone() {
                    let k_lower = k.to_lowercase();
                    if k_lower == "content-encoding" || k_lower == "content-length" {
                        continue;
                    }
 
                    if let (Ok(key), Ok(val)) = (hyper::header::HeaderName::from_bytes(k.as_bytes()), hyper::header::HeaderValue::from_str(&v)) {
                        header_mut.insert(key.clone(), val);
                        updated_headers.insert(k.clone(), v.clone());
                    }
                }
 
                let mut updated_status = status_code;
                if let Some(sc) = modified.status_code {
                    if let Ok(status) = hyper::StatusCode::from_u16(sc) {
                        *response.status_mut() = status;
                        updated_status = sc;
                    }
                }
 
                // Detect changes and add tags
                let mut modification_tags = Vec::new();
                if !matched_rule_name.is_empty() {
                    modification_tags.push(format!("BREAKPOINT: {}", matched_rule_name));
                }
                if !script_name.is_empty() {
                     modification_tags.push(format!("SCRIPT: {}", script_name));
                }

                if modified.body != decompressed_body {
                    modification_tags.push("MODIFIED_BODY".to_string());
                }
                if updated_headers != headers {
                    modification_tags.push("MODIFIED_HEADERS".to_string());
                }
                if updated_status != status_code {
                    modification_tags.push("MODIFIED_STATUS".to_string());
                }
 
                // Update DB and re-emit to reflect changes in viewer
                let updated_body_size = modified.body.len();
                self.traffic_db.insert_response(TrafficEvent::Response {
                    id: traffic_id.clone(),
                    headers: updated_headers.clone(),
                    body: modified.body.clone(),
                    content_type: updated_headers.get("content-type").or_else(|| updated_headers.get("Content-Type")).cloned(),
                    content_encoding: None, // Stripped for modification
                    status_code: updated_status,
                });
                
                // Add tags to traffic metadata
                self.traffic_db.update_tags(traffic_id.clone(), modification_tags.clone());
 
                let _ = self.app_handle.emit(
                    "traffic_event",
                    Payload {
                        id: traffic_id.clone(),
                        is_request: false,
                        data: PayloadTraffic {
                            uri: None,
                            version: Some(http_version.clone()),
                            method: None,
                            headers: updated_headers,
                            body_size: updated_body_size,
                            intercepted,
                            status_code: Some(updated_status),
                            client: Some(client_info.clone()),
                            tags: modification_tags,
                        },
                    },
                );
        }

        response
    }
}
