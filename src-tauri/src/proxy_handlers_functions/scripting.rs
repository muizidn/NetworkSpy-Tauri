use std::collections::HashMap;
use std::sync::atomic::Ordering;
use std::sync::Arc;

use crate::eval::{matches_breakpoint, run_script};
use crate::traffic::db::TrafficDb;
use crate::{BreakpointData, ScriptManager};

pub fn handle_request_scripts(
    script_manager: &Arc<ScriptManager>,
    traffic_db: &Arc<TrafficDb>,
    uri: &str,
    method: &str,
    headers: &HashMap<String, String>,
    decompressed_body: &[u8],
    traffic_id: &str,
) -> (Option<BreakpointData>, String) {
    let mut script_modified_data = None;
    let mut final_script_name = String::new();
    if script_manager.is_enabled.load(Ordering::SeqCst) {
        if let Ok(scripts) = traffic_db.get_scripts() {
            for script_rule in scripts {
                if script_rule.enabled && script_rule.request && matches_breakpoint(uri, method, &script_rule.matching_rule, &script_rule.method) {
                    let script_data = BreakpointData {
                        id: format!("{}_req_script", traffic_id),
                        headers: headers.clone(),
                        body: decompressed_body.to_vec(),
                        method: Some(method.to_string()),
                        uri: Some(uri.to_string()),
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
    (script_modified_data, final_script_name)
}

pub fn handle_response_scripts(
    script_manager: &Arc<ScriptManager>,
    traffic_db: &Arc<TrafficDb>,
    uri: &str,
    method: &str,
    headers: &HashMap<String, String>,
    decompressed_body: &[u8],
    traffic_id: &str,
    status_code: u16,
) -> (Option<BreakpointData>, String) {
    let mut modified_by_script = None;
    let mut script_name = String::new();
    if script_manager.is_enabled.load(Ordering::SeqCst) {
        if let Ok(scripts) = traffic_db.get_scripts() {
            for script_rule in scripts {
                if script_rule.enabled && script_rule.response && matches_breakpoint(uri, method, &script_rule.matching_rule, &script_rule.method) {
                    let script_data = BreakpointData {
                        id: format!("{}_res_script", traffic_id),
                        headers: headers.clone(),
                        body: decompressed_body.to_vec(),
                        method: Some(method.to_string()),
                        uri: Some(uri.to_string()),
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
    (modified_by_script, script_name)
}
