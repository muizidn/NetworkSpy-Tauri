use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::Arc;
use tokio::io::{self, AsyncBufReadExt, AsyncWriteExt, BufReader};
use tauri::{AppHandle, Manager};
use crate::traffic::db::{TrafficDb, BreakpointRule, ScriptRule};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct McpRequest {
    jsonrpc: String,
    method: String,
    #[serde(default)]
    params: Value,
    id: Option<Value>,
}

#[derive(Debug, Serialize)]
struct McpResponse {
    jsonrpc: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    result: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    id: Option<Value>,
}

pub fn spawn_mcp_server(app_handle: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let stdin = BufReader::new(io::stdin());
        let mut lines = stdin.lines();
        let mut stdout = io::stdout();

        while let Ok(Some(line)) = lines.next_line().await {
            let request: McpRequest = match serde_json::from_str(&line) {
                Ok(req) => req,
                Err(_) => continue,
            };

            let response = handle_mcp_request(&app_handle, request).await;
            let response_json = serde_json::to_string(&response).unwrap_or_default();
            let _ = stdout.write_all(format!("{}\n", response_json).as_bytes()).await;
            let _ = stdout.flush().await;
        }
    });
}

async fn handle_mcp_request(app_handle: &AppHandle, req: McpRequest) -> McpResponse {
    let id = req.id.clone();
    
    match req.method.as_str() {
        "initialize" => {
            McpResponse {
                jsonrpc: "2.0".to_string(),
                id,
                result: Some(json!({
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {}
                    },
                    "serverInfo": {
                        "name": "network-spy-mcp",
                        "version": "0.1.0"
                    }
                })),
                error: None,
            }
        },
        "listTools" => {
            McpResponse {
                jsonrpc: "2.0".to_string(),
                id,
                result: Some(json!({
                    "tools": [
                        {
                            "name": "get_traffic_list",
                            "description": "Get a list of intercepted HTTP traffic",
                            "inputSchema": {
                                "type": "object",
                                "properties": {
                                    "limit": { "type": "integer", "default": 20 }
                                }
                            }
                        },
                        {
                            "name": "save_script",
                            "description": "Create or update a scripting rule for modifying traffic",
                            "inputSchema": {
                                "type": "object",
                                "properties": {
                                    "name": { "type": "string" },
                                    "script": { "type": "string", "description": "JavaScript code to modify request/response" },
                                    "matching_rule": { "type": "string", "description": "Glob or regex for URLs" },
                                    "method": { "type": "string", "default": "*" },
                                    "enabled": { "type": "boolean", "default": true }
                                },
                                "required": ["name", "script", "matching_rule"]
                            }
                        },
                        {
                            "name": "save_breakpoint",
                            "description": "Create or update a traffic breakpoint (interception rule)",
                            "inputSchema": {
                                "type": "object",
                                "properties": {
                                    "name": { "type": "string" },
                                    "matching_rule": { "type": "string", "description": "Glob or regex for URLs" },
                                    "method": { "type": "string", "default": "*" },
                                    "enabled": { "type": "boolean", "default": true }
                                },
                                "required": ["name", "matching_rule"]
                            }
                        }
                    ]
                })),
                error: None,
            }
        },
        "resources/list" => {
            McpResponse {
                jsonrpc: "2.0".to_string(),
                id,
                result: Some(json!({
                    "resources": [
                        {
                            "uri": "traffic://latest",
                            "name": "Latest Traffic",
                            "description": "The 50 most recent HTTP requests intercepted",
                            "mimeType": "application/json"
                        }
                    ]
                })),
                error: None,
            }
        },
        "resources/read" => {
            let uri = req.params["uri"].as_str().unwrap_or("");
            if uri == "traffic://latest" {
                let db = app_handle.state::<Arc<TrafficDb>>();
                let traffic = db.get_recent_traffic(50);
                McpResponse {
                    jsonrpc: "2.0".to_string(),
                    id,
                    result: Some(json!({
                        "contents": [{
                            "uri": uri,
                            "mimeType": "application/json",
                            "text": serde_json::to_string(&traffic).unwrap_or_default()
                        }]
                    })),
                    error: None,
                }
            } else {
                McpResponse {
                    jsonrpc: "2.0".to_string(),
                    id,
                    result: None,
                    error: Some(json!({ "code": -32602, "message": "Invalid resource URI" })),
                }
            }
        },
        "tools/call" => {
            let tool_name = req.params["name"].as_str().unwrap_or("");
            let arguments = &req.params["arguments"];

            let result = match tool_name {
                "get_traffic_list" => handle_get_traffic_list(app_handle, arguments).await,
                "save_script" => handle_save_script(app_handle, arguments).await,
                "save_breakpoint" => handle_save_breakpoint(app_handle, arguments).await,
                _ => Err(json!({ "code": -32601, "message": "Method not found" })),
            };

            match result {
                Ok(val) => McpResponse {
                    jsonrpc: "2.0".to_string(),
                    id,
                    result: Some(json!({ "content": [{ "type": "text", "text": serde_json::to_string(&val).unwrap_or_default() }] })),
                    error: None,
                },
                Err(err) => McpResponse {
                    jsonrpc: "2.0".to_string(),
                    id,
                    result: None,
                    error: Some(err),
                }
            }
        }
        _ => McpResponse {
            jsonrpc: "2.0".to_string(),
            id,
            result: None,
            error: Some(json!({ "code": -32601, "message": "Method not found" })),
        }
    }
}

async fn handle_get_traffic_list(app_handle: &AppHandle, args: &Value) -> Result<Value, Value> {
    let limit = args["limit"].as_i64().unwrap_or(20) as usize;
    let db = app_handle.state::<Arc<TrafficDb>>();
    
    let traffic = db.get_recent_traffic(limit);
    Ok(json!(traffic))
}

async fn handle_save_script(app_handle: &AppHandle, args: &Value) -> Result<Value, Value> {
    let name = args["name"].as_str().ok_or(json!({ "message": "Missing name" }))?;
    let script = args["script"].as_str().ok_or(json!({ "message": "Missing script" }))?;
    let matching_rule = args["matching_rule"].as_str().ok_or(json!({ "message": "Missing matching_rule" }))?;
    let method = args["method"].as_str().unwrap_or("*");
    let enabled = args["enabled"].as_bool().unwrap_or(true);
    
    let db = app_handle.state::<Arc<TrafficDb>>();
    
    let rule = ScriptRule {
        id: Uuid::new_v4().to_string(),
        name: name.to_string(),
        enabled,
        method: method.to_string(),
        matching_rule: matching_rule.to_string(),
        script: script.to_string(),
        request: true,
        response: true,
        error: None,
    };
    
    match db.save_script(rule) {
        Ok(_) => Ok(json!({ "status": "success" })),
        Err(e) => Err(json!({ "code": -32000, "message": e.to_string() })),
    }
}

async fn handle_save_breakpoint(app_handle: &AppHandle, args: &Value) -> Result<Value, Value> {
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
