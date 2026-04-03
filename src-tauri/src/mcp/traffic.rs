use serde_json::{json, Value};
use std::sync::Arc;
use tauri::{AppHandle, Manager};
use crate::traffic::db::TrafficDb;

pub async fn handle_get_traffic_list(app_handle: &AppHandle, args: &Value) -> Result<Value, Value> {
    let limit = args["limit"].as_i64().unwrap_or(20) as usize;
    let db = app_handle.state::<Arc<TrafficDb>>();
    
    let traffic = db.get_recent_traffic(limit);
    Ok(json!(traffic))
}

pub async fn get_latest_traffic_resource(app_handle: &AppHandle) -> Value {
    let db = app_handle.state::<Arc<TrafficDb>>();
    let traffic = db.get_recent_traffic(50);
    serde_json::to_string(&traffic).unwrap_or_default().into()
}
