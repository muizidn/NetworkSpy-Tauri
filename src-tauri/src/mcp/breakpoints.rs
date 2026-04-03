use serde_json::{json, Value};
use std::sync::Arc;
use tauri::{AppHandle, Manager};
use crate::traffic::db::{TrafficDb, BreakpointRule};
use uuid::Uuid;

pub async fn handle_save_breakpoint(app_handle: &AppHandle, args: &Value) -> Result<Value, Value> {
    let name = args["name"].as_str().ok_or(json!({ "message": "Missing name" }))?;
    let matching_rule = args["matching_rule"].as_str().ok_or(json!({ "message": "Missing matching_rule" }))?;
    let method = args["method"].as_str().unwrap_or("*");
    let enabled = args["enabled"].as_bool().unwrap_or(true);
    
    let db = app_handle.state::<Arc<TrafficDb>>();
    
    let rule = BreakpointRule {
        id: Uuid::new_v4().to_string(),
        name: name.to_string(),
        enabled,
        method: method.to_string(),
        matching_rule: matching_rule.to_string(),
        request: true,
        response: true,
    };
    
    match db.save_breakpoint(rule) {
        Ok(_) => Ok(json!({ "status": "success" })),
        Err(e) => Err(json!({ "code": -32000, "message": e.to_string() })),
    }
}
