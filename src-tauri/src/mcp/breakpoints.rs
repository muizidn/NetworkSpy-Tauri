use serde_json::{json, Value};
use std::sync::Arc;
use tauri::{AppHandle, Manager};
use crate::config::ConfigManager;
use uuid::Uuid;

pub async fn handle_list_breakpoints(app_handle: &AppHandle) -> Result<Value, Value> {
    let config = app_handle.state::<Arc<ConfigManager>>();
    Ok(json!(config.get_breakpoints()))
}

pub async fn handle_delete_breakpoint(app_handle: &AppHandle, args: &Value) -> Result<Value, Value> {
    let id = args["id"].as_str().ok_or(json!({ "message": "Missing id" }))?;
    let config = app_handle.state::<Arc<ConfigManager>>();
    config.delete_breakpoint(id.to_string()).map_err(|e| json!({ "code": -32000, "message": e.to_string() }))?;
    Ok(json!({ "status": "success" }))
}

pub async fn handle_save_breakpoint(app_handle: &AppHandle, args: &Value) -> Result<Value, Value> {
    let id = args["id"].as_str().map(|s| s.to_string()).unwrap_or_else(|| Uuid::new_v4().to_string());
    let name = args["name"].as_str().ok_or(json!({ "message": "Missing name" }))?;
    let matching_rule = args["matching_rule"].as_str().ok_or(json!({ "message": "Missing matching_rule" }))?;
    let method = args["method"].as_str().unwrap_or("*");
    let enabled = args["enabled"].as_bool().unwrap_or(true);
    let request = args["request"].as_bool().unwrap_or(true);
    let response = args["response"].as_bool().unwrap_or(true);
    
    let config = app_handle.state::<Arc<ConfigManager>>();
    
    let rule = crate::traffic::db::BreakpointRule {
        id,
        name: name.to_string(),
        enabled,
        method: method.to_string(),
        matching_rule: matching_rule.to_string(),
        request,
        response,
    };
    
    config.save_breakpoint(rule).map_err(|e| json!({ "code": -32000, "message": e.to_string() }))?;
    Ok(json!({ "status": "success" }))
}
