use crate::map_local::MapLocalManager;
use crate::map_remote::MapRemoteManager;
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
    pub map_local_manager: Arc<MapLocalManager>,
    pub map_remote_manager: Arc<MapRemoteManager>,
    pub config_manager: Arc<crate::config::ConfigManager>,
}

#[async_trait]
impl TrafficListener for MyTrafficListener {
    async fn get_client_name(&self, client_addr: &str) -> String {
        let info = traffic::process_info::get_client_info(client_addr);
        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&info) {
            val["name"].as_str().unwrap_or("-").to_string()
        } else {
            "-".to_string()
        }
    }

    async fn request(&self, id: u64, mut request: Request<Bytes>, intercepted: bool, client_addr: String) -> Request<Bytes> {
        if let Some(toggle) = PROXY_TOGGLE.get() {
            if !toggle.is_on() {
                return request;
            }
        }

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
        } else if !uri.contains("://") {
            // Likely a CONNECT request or raw host:port
            if uri.ends_with(":443") {
                uri = uri[..uri.len() - 4].to_string();
            } else if uri.ends_with(":80") {
                uri = uri[..uri.len() - 3].to_string();
            }
        }
        
        let method = request.method().as_str().to_string();

        // 0. Handle Map Remote
        if self.map_remote_manager.is_enabled.load(Ordering::SeqCst) {
            for rule in self.config_manager.get_map_remote_rules() {
                if rule.enabled && crate::eval::matches_breakpoint(&uri, &method, &rule.matching_rule, &rule.method) {
                    if let Ok(target_uri) = rule.remote_url.parse::<hyper::Uri>() {
                        *request.uri_mut() = target_uri;
                        uri = request.uri().to_string();
                        break;
                    }
                }
            }
        }
 
        if intercepted && method.trim().to_uppercase() == "CONNECT" {
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
 
        let traffic_id = format!("{}_{}", id, self.session_id);
 
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
        
        // CHECK THE RUST SIDE WHEN TRAFFIC URI is -
        if intercepted && (uri == "-" || method == "-") {
            println!("Traffic URI is -: {} {}", uri, method);
        }

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
        let (script_modified_data, final_script_name) = crate::proxy_handlers_functions::scripting::handle_request_scripts(
            &self.script_manager,
            &self.config_manager,
            &uri,
            &method,
            &headers,
            &decompressed_body,
            &traffic_id,
        );

        let modified_request_data = script_modified_data;

        // 2. Handle Breakpoint for Request
        let (modified_request_data, matched_rule_name) = crate::proxy_handlers_functions::breakpoints::handle_request_breakpoints(
            &self.breakpoint_manager,
            &self.config_manager,
            &uri,
            &method,
            &self.app_handle,
            &traffic_id,
            modified_request_data,
            &headers,
            &decompressed_body,
        ).await;

        if let Some(modified) = modified_request_data {
            crate::proxy_handlers_functions::traffic_updater::apply_request_modifications(
                &mut request,
                modified,
                &uri,
                &method,
                &headers,
                &decompressed_body,
                &matched_rule_name,
                &final_script_name,
                &tags,
                &self.traffic_db,
                &self.app_handle,
                &traffic_id,
                &http_version,
                intercepted,
                &client_info,
            );
        }

        request
    }

    async fn response(&self, id: u64, mut response: Response<Bytes>, intercepted: bool, client_addr: String) -> Response<Bytes> {
        if let Some(toggle) = PROXY_TOGGLE.get() {
            if !toggle.is_on() {
                return response;
            }
        }
        
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
 
        let traffic_id = format!("{}_{}", id, self.session_id);
 
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
 
        // 0. Handle Map Local
        if self.map_local_manager.is_enabled.load(Ordering::SeqCst) {
            for rule in self.config_manager.get_map_local_rules() {
                if rule.enabled && crate::eval::matches_breakpoint(&uri, &method, &rule.matching_rule, &rule.method) {
                    if let Ok(content) = std::fs::read(&rule.local_path) {
                        println!("Map Local Hit: {} -> {}", uri, rule.local_path);
                        
                        // Replace response body
                        *response.body_mut() = Bytes::from(content.clone());
                        
                        // Set status to 200 OK
                        *response.status_mut() = hyper::StatusCode::OK;
                        
                        // Guess content type from extension if possible, or use default
                        let extension = std::path::Path::new(&rule.local_path)
                            .extension()
                            .and_then(|ext| ext.to_str())
                            .unwrap_or("");
                        
                        let content_type = match extension {
                            "json" => "application/json",
                            "html" => "text/html",
                            "js" => "application/javascript",
                            "css" => "text/css",
                            "png" => "image/png",
                            "jpg" | "jpeg" => "image/jpeg",
                            "gif" => "image/gif",
                            "svg" => "image/svg+xml",
                            "txt" => "text/plain",
                            _ => "application/octet-stream",
                        };
                        
                        response.headers_mut().insert(
                            hyper::header::CONTENT_TYPE,
                            hyper::header::HeaderValue::from_static(content_type)
                        );
                        
                        // Re-calculate body size and update DB
                        let updated_body_size = content.len();
                        self.traffic_db.insert_response(TrafficEvent::Response {
                            id: traffic_id.clone(),
                            headers: response.headers().iter().map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("").to_string())).collect(),
                            body: content,
                            content_type: Some(content_type.to_string()),
                            content_encoding: None,
                            status_code: 200,
                        });
                        
                        // Add tag to metadata
                        self.traffic_db.update_tags(traffic_id.clone(), vec![format!("MAP_LOCAL: {}", rule.name)]);
                        
                        // Re-emit traffic event to update UI
                        let _ = self.app_handle.emit(
                            "traffic_event",
                            Payload {
                                id: traffic_id.clone(),
                                is_request: false,
                                data: PayloadTraffic {
                                    uri: None,
                                    version: Some(http_version.clone()),
                                    method: None,
                                    headers: response.headers().iter().map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("").to_string())).collect(),
                                    body_size: updated_body_size,
                                    intercepted,
                                    status_code: Some(200),
                                    client: Some(client_info.clone()),
                                    tags: vec![format!("MAP_LOCAL: {}", rule.name)],
                                },
                            },
                        );
                        
                        return response;
                    }
                }
            }
        }

        let (modified_by_script, final_script_name) = crate::proxy_handlers_functions::scripting::handle_response_scripts(
            &self.script_manager,
            &self.config_manager,
            &uri,
            &method,
            &headers_with_perf,
            &decompressed_body,
            &traffic_id,
            status_code,
        );

        let (final_modified_data, matched_rule_name) = crate::proxy_handlers_functions::breakpoints::handle_response_breakpoints(
            &self.breakpoint_manager,
            &self.config_manager,
            &uri,
            &method,
            &self.app_handle,
            &traffic_id,
            modified_by_script,
            &headers_with_perf,
            &decompressed_body,
            status_code,
        ).await;

        if let Some(modified) = final_modified_data {
            crate::proxy_handlers_functions::traffic_updater::apply_response_modifications(
                &mut response,
                modified,
                &headers_with_perf,
                &decompressed_body,
                status_code,
                &matched_rule_name,
                &final_script_name,
                &self.traffic_db,
                &self.app_handle,
                &traffic_id,
                &http_version,
                intercepted,
                &client_info,
            );
        }

        response
    }
}
