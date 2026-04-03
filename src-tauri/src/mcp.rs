use axum::{
    extract::{State, Query},
    response::{sse::{Event, Sse}, IntoResponse},
    routing::{get, post},
    Json, Router,
};
use futures::stream::Stream;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{convert::Infallible, sync::Arc, collections::HashMap, time::Duration};
use tokio::sync::{mpsc, Mutex};
use tokio_stream::wrappers::UnboundedReceiverStream;
use tauri::{AppHandle, Manager};
use crate::traffic::db::{TrafficDb, BreakpointRule, ScriptRule};
use uuid::Uuid;
use tower_http::cors::CorsLayer;

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

type SseSender = mpsc::UnboundedSender<Result<Event, Infallible>>;

struct McpState {
    app_handle: AppHandle,
    // Map of session ID to sender for SSE
    sessions: Arc<Mutex<HashMap<String, SseSender>>>,
}

pub fn spawn_mcp_server(app_handle: AppHandle) {
    let state = Arc::new(McpState {
        app_handle,
        sessions: Arc::new(Mutex::new(HashMap::new())),
    });

    let app = Router::new()
        .route("/sse", get(sse_handler))
        .route("/messages", post(post_handler))
        .layer(CorsLayer::permissive())
        .with_state(state);

    tauri::async_runtime::spawn(async move {
        let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await.unwrap();
        eprintln!("MCP HTTP Server starting on http://localhost:3001/sse");
        axum::serve(listener, app).await.unwrap();
    });
}

async fn sse_handler(
    State(state): State<Arc<McpState>>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let session_id = Uuid::new_v4().to_string();
    let (tx, rx) = mpsc::unbounded_channel();
    
    let mut sessions = state.sessions.lock().await;
    sessions.insert(session_id.clone(), tx.clone());
    
    // According to MCP SSE spec, we must send the POST endpoint as the first message
    let _ = tx.send(Ok(Event::default().event("endpoint").data(format!("/messages?session_id={}", session_id))));

    let stream = UnboundedReceiverStream::new(rx);
    
    Sse::new(stream).keep_alive(axum::response::sse::KeepAlive::new())
}

#[derive(Deserialize)]
struct PostParams {
    session_id: String,
}

async fn post_handler(
    State(state): State<Arc<McpState>>,
    Query(params): Query<PostParams>,
    Json(req): Json<McpRequest>,
) -> impl IntoResponse {
    let response = handle_mcp_request(&state.app_handle, req).await;
    
    let sessions = state.sessions.lock().await;
    if let Some(tx) = sessions.get(&params.session_id) {
        let _ = tx.send(Ok(Event::default().event("message").data(serde_json::to_string(&response).unwrap_or_default())));
    }
    
    axum::http::StatusCode::ACCEPTED
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
                        "tools": {},
                        "resources": {}
                    },
                    "serverInfo": {
                        "name": "network-spy-mcp",
                        "version": "0.1.0"
                    }
                })),
                error: None,
            }
        },
        "tools/list" => {
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
