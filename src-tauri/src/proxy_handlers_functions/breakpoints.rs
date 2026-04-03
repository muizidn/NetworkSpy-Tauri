use std::collections::HashMap;
use std::sync::atomic::Ordering;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};

use crate::eval::matches_breakpoint;
use crate::traffic::db::TrafficDb;
use crate::{BreakpointData, BreakpointHit, BreakpointManager, PausedTask};

pub async fn handle_request_breakpoints(
    breakpoint_manager: &Arc<BreakpointManager>,
    traffic_db: &Arc<TrafficDb>,
    uri: &str,
    method: &str,
    app_handle: &AppHandle,
    traffic_id: &str,
    mut modified_request_data: Option<BreakpointData>,
    headers: &HashMap<String, String>,
    decompressed_body: &[u8],
) -> (Option<BreakpointData>, String) {
    let mut should_pause = false;
    let mut matched_rule_name = String::new();

    if breakpoint_manager.is_enabled.load(Ordering::SeqCst) {
        if let Ok(rules) = traffic_db.get_breakpoints() {
            for rule in rules {
                if rule.enabled && rule.request && matches_breakpoint(uri, method, &rule.matching_rule, &rule.method) {
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
        
        let current_bp_data = if let Some(ref m) = modified_request_data {
            m.clone()
        } else {
            BreakpointData {
                id: hit_id.clone(),
                headers: headers.clone(),
                body: decompressed_body.to_vec(),
                method: Some(method.to_string()),
                uri: Some(uri.to_string()),
                status_code: None,
            }
        };

        {
            let mut tasks = breakpoint_manager.paused_tasks.write().await;
            tasks.insert(hit_id.clone(), PausedTask {
                sender: tx,
                name: matched_rule_name.clone(),
                data: current_bp_data,
            });
        }
        
        let _ = app_handle.emit("breakpoint_hit", BreakpointHit { id: hit_id, name: matched_rule_name.clone() });
        
        if let Ok(Some(modified)) = rx.await {
            modified_request_data = Some(modified);
        }
    }

    (modified_request_data, matched_rule_name)
}

pub async fn handle_response_breakpoints(
    breakpoint_manager: &Arc<BreakpointManager>,
    traffic_db: &Arc<TrafficDb>,
    uri: &str,
    method: &str,
    app_handle: &AppHandle,
    traffic_id: &str,
    mut final_modified_data: Option<BreakpointData>,
    headers: &HashMap<String, String>,
    decompressed_body: &[u8],
    status_code: u16,
) -> (Option<BreakpointData>, String) {
    let mut should_pause = false;
    let mut matched_rule_name = String::new();

    if breakpoint_manager.is_enabled.load(Ordering::SeqCst) {
        if let Ok(rules) = traffic_db.get_breakpoints() {
            for rule in rules {
                if rule.enabled && rule.response && matches_breakpoint(uri, method, &rule.matching_rule, &rule.method) {
                    should_pause = true;
                    matched_rule_name = rule.name.clone();
                    break;
                }
            }
        }
    }

    if should_pause {
        let (tx, rx) = tokio::sync::oneshot::channel();
        let hit_id = format!("{}_res", traffic_id);
        
        let current_bp_data = if let Some(ref m) = final_modified_data {
            m.clone()
        } else {
            BreakpointData {
                id: hit_id.clone(),
                headers: headers.clone(),
                body: decompressed_body.to_vec(),
                method: Some(method.to_string()),
                uri: Some(uri.to_string()),
                status_code: Some(status_code),
            }
        };

        {
            let mut tasks = breakpoint_manager.paused_tasks.write().await;
            tasks.insert(hit_id.clone(), PausedTask {
                sender: tx,
                name: matched_rule_name.clone(),
                data: current_bp_data,
            });
        }
        
        let _ = app_handle.emit("breakpoint_hit", BreakpointHit { id: hit_id, name: matched_rule_name.clone() });
        
        if let Ok(Some(modified)) = rx.await {
            final_modified_data = Some(modified);
        }
    }

    (final_modified_data, matched_rule_name)
}
