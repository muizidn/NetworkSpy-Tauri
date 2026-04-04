pub mod traffic;
pub mod breakpoints;
pub mod scripting;

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
    sessions: Arc<Mutex<HashMap<String, SseSender>>>,
}

pub fn spawn_mcp_server(app_handle: AppHandle) {
    let state = Arc::new(McpState {
        app_handle: app_handle.clone(),
        sessions: Arc::new(Mutex::new(HashMap::new())),
    });

    // 1. Dynamic HTTP Server Task (Supervisor)
    let http_handle = app_handle.clone();
    let http_state = state.clone();
    tauri::async_runtime::spawn(async move {
        let mut current_server: Option<(u16, tauri::async_runtime::JoinHandle<()>)> = None;

        loop {
            let (mcp_enabled, port) = {
                let settings = http_handle.state::<crate::settings::ManagedProxySettings>();
                let s = settings.0.read().unwrap();
                (s.mcp_http_enabled, s.mcp_http_port)
            };

            // Case A: Enabled but either not running or running on wrong port
            if mcp_enabled {
                let needs_restart = match &current_server {
                    Some((p, _)) => *p != port,
                    None => true,
                };

                if needs_restart {
                    if let Some((_, handle)) = current_server.take() {
                        handle.abort();
                        eprintln!("MCP HTTP Server stopping for restart...");
                    }

                    let app = Router::new()
                        .route("/sse", get(sse_handler))
                        .route("/messages", post(post_handler))
                        .layer(CorsLayer::permissive())
                        .with_state(http_state.clone());

                    let bind_addr = format!("0.0.0.0:{}", port);
                    match tokio::net::TcpListener::bind(&bind_addr).await {
                        Ok(listener) => {
                            eprintln!("MCP HTTP Server starting on http://localhost:{}/sse", port);
                            let server_task = tauri::async_runtime::spawn(async move {
                                let _ = axum::serve(listener, app).await;
                            });
                            current_server = Some((port, server_task));
                        }
                        Err(e) => {
                            eprintln!("Failed to bind MCP HTTP Server to {}: {}", bind_addr, e);
                        }
                    }
                }
            } else if let Some((_, handle)) = current_server.take() {
                // Case B: Disabled but running
                handle.abort();
                eprintln!("MCP HTTP Server stopped by settings.");
            }

            tokio::time::sleep(Duration::from_secs(2)).await;
        }
    });

    // 2. Start Stdio Loop (Dynamic check inside the loop)
    let stdio_handle = app_handle.clone();
    tauri::async_runtime::spawn(async move {
        use tokio::io::{self, AsyncBufReadExt, AsyncWriteExt, BufReader};
        let stdin = BufReader::new(io::stdin());
        let mut lines = stdin.lines();
        let mut stdout = io::stdout();

        while let Ok(Some(line)) = lines.next_line().await {
            let settings = stdio_handle.state::<crate::settings::ManagedProxySettings>();
            let mcp_enabled = {
                let s = settings.0.read().unwrap();
                s.mcp_stdio_enabled
            };

            if !mcp_enabled {
                continue;
            }

            let request: McpRequest = match serde_json::from_str(&line) {
                Ok(req) => req,
                Err(_) => continue,
            };

            let response = handle_mcp_request(&stdio_handle, request).await;
            let response_json = serde_json::to_string(&response).unwrap_or_default();
            let _ = stdout.write_all(format!("{}\n", response_json).as_bytes()).await;
            let _ = stdout.flush().await;
        }
    });
}

async fn sse_handler(
    State(state): State<Arc<McpState>>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let session_id = Uuid::new_v4().to_string();
    let (tx, rx) = mpsc::unbounded_channel();
    
    let mut sessions = state.sessions.lock().await;
    sessions.insert(session_id.clone(), tx.clone());
    
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
    let settings = state.app_handle.state::<crate::settings::ManagedProxySettings>();
    let mcp_enabled = {
        let s = settings.0.read().unwrap();
        s.mcp_http_enabled
    };

    if !mcp_enabled {
        return axum::http::StatusCode::FORBIDDEN.into_response();
    }

    let response = handle_mcp_request(&state.app_handle, req).await;
    
    let sessions = state.sessions.lock().await;
    if let Some(tx) = sessions.get(&params.session_id) {
        let _ = tx.send(Ok(Event::default().event("message").data(serde_json::to_string(&response).unwrap_or_default())));
    }
    
    axum::http::StatusCode::ACCEPTED.into_response()
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
                McpResponse {
                    jsonrpc: "2.0".to_string(),
                    id,
                    result: Some(json!({
                        "contents": [{
                            "uri": uri,
                            "mimeType": "application/json",
                            "text": traffic::get_latest_traffic_resource(app_handle).await
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
                "get_traffic_list" => traffic::handle_get_traffic_list(app_handle, arguments).await,
                "save_script" => scripting::handle_save_script(app_handle, arguments).await,
                "save_breakpoint" => breakpoints::handle_save_breakpoint(app_handle, arguments).await,
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
