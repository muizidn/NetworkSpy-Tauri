use std::collections::HashMap;
use std::sync::Arc;
use bytes::Bytes;
use hyper::{Request, Response};
use tauri::{AppHandle, Emitter};

use crate::{BreakpointData, Payload, PayloadTraffic};
use crate::traffic::db::{TrafficDb, TrafficEvent};

pub fn apply_request_modifications(
    request: &mut Request<Bytes>,
    modified: BreakpointData,
    uri: &str,
    method: &str,
    headers: &HashMap<String, String>,
    decompressed_body: &[u8],
    matched_rule_name: &str,
    final_script_name: &str,
    tags: &[String],
    traffic_db: &Arc<TrafficDb>,
    app_handle: &AppHandle,
    traffic_id: &str,
    http_version: &str,
    intercepted: bool,
    client_info: &str,
) {
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
    
    let mut updated_uri = uri.to_string();
    let mut updated_method = method.to_string();
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
    let mut modification_tags = tags.to_vec();
    if !matched_rule_name.is_empty() {
        modification_tags.push(format!("BREAKPOINT: {}", matched_rule_name));
    }
    if !final_script_name.is_empty() {
        modification_tags.push(format!("SCRIPT: {}", final_script_name));
    }

    if modified.body != decompressed_body {
        modification_tags.push("MODIFIED_BODY".to_string());
    }
    if updated_headers != *headers {
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
    traffic_db.insert_request(TrafficEvent::Request {
        id: traffic_id.to_string(),
        uri: updated_uri.clone(),
        method: updated_method.clone(),
        version: http_version.to_string(),
        headers: updated_headers.clone(),
        body: modified.body.clone(),
        content_type: updated_headers.get("content-type").or_else(|| updated_headers.get("Content-Type")).cloned(),
        content_encoding: None,
        intercepted,
        client: client_info.to_string(),
        tags: modification_tags.clone(),
    });

    let _ = app_handle.emit(
        "traffic_event",
        Payload {
            id: traffic_id.to_string(),
            is_request: true,
            data: PayloadTraffic {
                uri: Some(updated_uri),
                version: Some(http_version.to_string()),
                method: Some(updated_method),
                headers: updated_headers,
                body_size: updated_body_size,
                intercepted,
                status_code: None,
                client: Some(client_info.to_string()),
                tags: modification_tags,
            },
        },
    );
}

pub fn apply_response_modifications(
    response: &mut Response<Bytes>,
    modified: BreakpointData,
    headers: &HashMap<String, String>,
    decompressed_body: &[u8],
    status_code: u16,
    matched_rule_name: &str,
    final_script_name: &str,
    traffic_db: &Arc<TrafficDb>,
    app_handle: &AppHandle,
    traffic_id: &str,
    http_version: &str,
    intercepted: bool,
    client_info: &str,
) {
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
    if !final_script_name.is_empty() {
            modification_tags.push(format!("SCRIPT: {}", final_script_name));
    }

    if modified.body != decompressed_body {
        modification_tags.push("MODIFIED_BODY".to_string());
    }
    if updated_headers != *headers {
        modification_tags.push("MODIFIED_HEADERS".to_string());
    }
    if updated_status != status_code {
        modification_tags.push("MODIFIED_STATUS".to_string());
    }

    // Update DB and re-emit to reflect changes in viewer
    let updated_body_size = modified.body.len();
    traffic_db.insert_response(TrafficEvent::Response {
        id: traffic_id.to_string(),
        headers: updated_headers.clone(),
        body: modified.body.clone(),
        content_type: updated_headers.get("content-type").or_else(|| updated_headers.get("Content-Type")).cloned(),
        content_encoding: None, // Stripped for modification
        status_code: updated_status,
    });
    
    // Add tags to traffic metadata
    traffic_db.update_tags(traffic_id.to_string(), modification_tags.clone());

    let _ = app_handle.emit(
        "traffic_event",
        Payload {
            id: traffic_id.to_string(),
            is_request: false,
            data: PayloadTraffic {
                uri: None,
                version: Some(http_version.to_string()),
                method: None,
                headers: updated_headers,
                body_size: updated_body_size,
                intercepted,
                status_code: Some(updated_status),
                client: Some(client_info.to_string()),
                tags: modification_tags,
            },
        },
    );
}
