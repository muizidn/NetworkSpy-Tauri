use serde_json::{json, Value};
use std::sync::Arc;
use tauri::{AppHandle, Manager};
use crate::traffic::db::{TrafficDb, FilterPreset};
use uuid::Uuid;

pub async fn handle_get_traffic_list(app_handle: &AppHandle, args: &Value) -> Result<Value, Value> {
    let limit = args["limit"].as_u64().unwrap_or(20) as usize;
    let offset = args["offset"].as_u64().unwrap_or(0) as usize;
    let sort_by = args["sort_by"].as_str().map(|s| s.to_string());
    let sort_order = args["sort_order"].as_str().map(|s| s.to_string());
    
    // Filters
    let method = args["method"].as_str().map(|s| s.to_string());
    let uri_contains = args["uri_contains"].as_str().map(|s| s.to_string());
    let status_code = args["status_code"].as_i64().map(|n| n as i32);
    
    let db = app_handle.state::<Arc<TrafficDb>>();
    
    match db.get_filtered_traffic(limit, offset, sort_by, sort_order, method, uri_contains, status_code) {
        Ok(traffic) => Ok(json!(traffic)),
        Err(e) => Err(json!({ "code": -32000, "message": e.to_string() })),
    }
}

pub async fn handle_get_traffic_details(app_handle: &AppHandle, args: &Value) -> Result<Value, Value> {
    let id = args["id"].as_str().ok_or(json!({ "message": "Missing traffic id" }))?;
    let db = app_handle.state::<Arc<TrafficDb>>();
    
    let metadata = db.get_traffic_metadata(id.to_string()).ok().flatten()
        .ok_or(json!({ "message": "Traffic not found" }))?;
        
    let request_data = db.get_request_data(id).unwrap_or_default();
    let response_data = db.get_response_data(id).unwrap_or_default();
    
    Ok(json!({
        "metadata": metadata,
        "request": {
            "headers": request_data.headers,
            "body": String::from_utf8_lossy(&request_data.body).to_string(),
            "content_type": request_data.content_type,
            "content_encoding": request_data.content_encoding
        },
        "response": {
            "headers": response_data.headers,
            "body": String::from_utf8_lossy(&response_data.body).to_string(),
            "status_code": response_data.status_code,
            "content_type": response_data.content_type,
            "content_encoding": response_data.content_encoding
        }
    }))
}

pub async fn handle_list_filter_presets(app_handle: &AppHandle) -> Result<Value, Value> {
    let db = app_handle.state::<Arc<TrafficDb>>();
    match db.get_filter_presets() {
        Ok(presets) => Ok(json!(presets)),
        Err(e) => Err(json!({ "code": -32000, "message": e.to_string() })),
    }
}

pub async fn handle_save_filter_preset(app_handle: &AppHandle, args: &Value) -> Result<Value, Value> {
    let db = app_handle.state::<Arc<TrafficDb>>();
    let id = args["id"].as_str().map(|s| s.to_string());
    let name = args["name"].as_str();
    let description = args["description"].as_str().map(|s| s.to_string());
    let filters = args["filters"].as_str();

    match id {
        Some(existing_id) => {
            match db.update_filter_preset(
                existing_id, 
                name.map(|s| s.to_string()), 
                description, 
                filters.map(|s| s.to_string())
            ) {
                Ok(_) => Ok(json!({ "status": "success", "message": "Updated existing preset" })),
                Err(e) => Err(json!({ "code": -32000, "message": e.to_string() })),
            }
        },
        None => {
            let new_preset = FilterPreset {
                id: Uuid::new_v4().to_string(),
                name: name.ok_or(json!({ "message": "Missing name for new preset" }))?.to_string(),
                description,
                filters: filters.ok_or(json!({ "message": "Missing filters for new preset" }))?.to_string(),
            };
            match db.add_filter_preset(new_preset) {
                Ok(_) => Ok(json!({ "status": "success", "message": "Created new preset" })),
                Err(e) => Err(json!({ "code": -32000, "message": e.to_string() })),
            }
        }
    }
}

pub async fn handle_delete_filter_preset(app_handle: &AppHandle, args: &Value) -> Result<Value, Value> {
    let id = args["id"].as_str().ok_or(json!({ "message": "Missing id" }))?;
    let db = app_handle.state::<Arc<TrafficDb>>();
    match db.delete_filter_preset(id.to_string()) {
        Ok(_) => Ok(json!({ "status": "success" })),
        Err(e) => Err(json!({ "code": -32000, "message": e.to_string() })),
    }
}

pub async fn get_latest_traffic_resource(app_handle: &AppHandle) -> Value {
    let db = app_handle.state::<Arc<TrafficDb>>();
    let traffic = db.get_recent_traffic(50);
    serde_json::to_string(&traffic).unwrap_or_default().into()
}
