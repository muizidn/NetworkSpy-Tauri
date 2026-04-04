pub mod traffic;
pub mod breakpoints;
pub mod scripting;
pub mod validator;

use axum::body::Body;
use axum::{
    extract::{State, Query},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use futures::StreamExt;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{convert::Infallible, sync::Arc, collections::HashMap, time::Duration};
use tokio::sync::{mpsc, Mutex};
use tokio_stream::wrappers::UnboundedReceiverStream;
use tauri::{AppHandle, Manager};
use uuid::Uuid;
use tower_http::cors::CorsLayer;
use axum::http::header;

// Static JSON Schemas for MCP
const CAPABILITIES_JSON: &str = include_str!("schema/capabilities.json");
const TOOLS_JSON: &str = include_str!("schema/tools.json");
const RESOURCES_JSON: &str = include_str!("schema/resources.json");

#[derive(Debug, Deserialize, Serialize, Clone)]
struct McpRequest {
    jsonrpc: String,
    method: String,
    #[serde(default)]
    params: Value,
    id: Option<Value>,
}

#[derive(Debug, Serialize, Clone)]
struct McpResponse {
    jsonrpc: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    result: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    id: Option<Value>,
}

impl McpResponse {
    fn success(id: Option<Value>, result: Value) -> Self {
        Self {
            jsonrpc: "2.0".to_string(),
            id,
            result: Some(result),
            error: None,
        }
    }

    fn error(id: Option<Value>, code: i32, message: &str) -> Self {
        Self {
            jsonrpc: "2.0".to_string(),
            id,
            result: None,
            error: Some(json!({ "code": code, "message": message })),
        }
    }
}

type StreamSender = mpsc::UnboundedSender<String>;

struct McpState {
    app_handle: AppHandle,
    sessions: Arc<Mutex<HashMap<String, StreamSender>>>,
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

            if mcp_enabled {
                let needs_restart = match &current_server {
                    Some((p, _)) => *p != port,
                    None => true,
                };

                if needs_restart {
                    if let Some((_, handle)) = current_server.take() {
                        handle.abort();
                        eprintln!("[MCP] Restarting server on port {}...", port);
                    }

                    let app = Router::new()
                        .route("/mcp", get(mcp_stream_handler)) // Custom Streaming (MCP+)
                        .route("/mcp", post(mcp_direct_handler)) // Standard Stateless POST
                        .route("/messages", post(mcp_session_post_handler)) // Sessioned POST
                        .layer(CorsLayer::permissive())
                        .with_state(http_state.clone());

                    let bind_addr = format!("0.0.0.0:{}", port);
                    match tokio::net::TcpListener::bind(&bind_addr).await {
                        Ok(listener) => {
                            eprintln!("[MCP] Server active at http://0.0.0.0:{}", port);
                            let server_task = tauri::async_runtime::spawn(async move {
                                let _ = axum::serve(listener, app).await;
                            });
                            current_server = Some((port, server_task));
                        }
                        Err(e) => eprintln!("[MCP] Error binding port {}: {}", port, e),
                    }
                }
            } else if let Some((_, handle)) = current_server.take() {
                handle.abort();
                eprintln!("[MCP] Server disabled.");
            }
            tokio::time::sleep(Duration::from_secs(2)).await;
        }
    });

    // 2. Stdio Transport
    let stdio_handle = app_handle.clone();
    tauri::async_runtime::spawn(async move {
        use tokio::io::{self, AsyncBufReadExt, AsyncWriteExt, BufReader};
        let stdin = BufReader::new(io::stdin());
        let mut lines = stdin.lines();
        let mut stdout = io::stdout();

        while let Ok(Some(line)) = lines.next_line().await {
            let settings = stdio_handle.state::<crate::settings::ManagedProxySettings>();
            if !settings.0.read().unwrap().mcp_stdio_enabled { continue; }

            let req: McpRequest = match serde_json::from_str(&line) {
                Ok(r) => r,
                Err(_) => {
                    let err = McpResponse::error(None, -32700, "Parse error");
                    let _ = stdout.write_all(format!("{}\n", serde_json::to_string(&err).unwrap()).as_bytes()).await;
                    continue;
                }
            };

            let resp = handle_mcp_request(&stdio_handle, req).await;
            let _ = stdout.write_all(format!("{}\n", serde_json::to_string(&resp).unwrap()).as_bytes()).await;
            let _ = stdout.flush().await;
        }
    });
}

// --- Axum Handlers ---

/// Standard Stateless JSON-RPC POST Endpoint
async fn mcp_direct_handler(
    State(state): State<Arc<McpState>>,
    Json(req): Json<McpRequest>,
) -> impl IntoResponse {
    Json(handle_mcp_request(&state.app_handle, req).await)
}

/// Custom NDJSON Streaming Endpoint (MCP+)
async fn mcp_stream_handler(State(state): State<Arc<McpState>>) -> impl IntoResponse {
    let session_id = Uuid::new_v4().to_string();
    let (tx, rx) = mpsc::unbounded_channel();
    
    // Auto-cleanup on disconnect
    let sessions_root = state.sessions.clone();
    let sid = session_id.clone();
    
    let stream = UnboundedReceiverStream::new(rx)
        .map(Ok::<_, Infallible>)
        .chain(futures::stream::once(async move {
            let mut s = sessions_root.lock().await;
            s.remove(&sid);
            eprintln!("[MCP] Session {} disconnected and cleaned.", sid);
            Ok::<_, Infallible>("".to_string())
        }));

    {
        let mut s = state.sessions.lock().await;
        s.insert(session_id.clone(), tx.clone());
    }

    // Handshake: Send session endpoint
    let _ = tx.send(format!("{}\n", json!({"type": "endpoint", "uri": format!("/messages?session_id={}", session_id)})));

    (
        [
            (header::CONTENT_TYPE, "application/x-ndjson"),
            (header::CACHE_CONTROL, "no-cache"),
            (header::CONNECTION, "keep-alive"),
        ],
        Body::from_stream(stream),
    )
}

#[derive(Deserialize)]
struct SessionParams { session_id: String }

/// Session-bound POST for Streaming
async fn mcp_session_post_handler(
    State(state): State<Arc<McpState>>,
    Query(params): Query<SessionParams>,
    Json(req): Json<McpRequest>,
) -> impl IntoResponse {
    let response = handle_mcp_request(&state.app_handle, req).await;
    let mut sessions = state.sessions.lock().await;
    if let Some(tx) = sessions.get(&params.session_id) {
        if tx.send(format!("{}\n", serde_json::to_string(&response).unwrap_or_default())).is_err() {
            sessions.remove(&params.session_id);
        }
    }
    axum::http::StatusCode::ACCEPTED.into_response()
}

// --- Core MCP Handler ---

async fn handle_mcp_request(app_handle: &AppHandle, req: McpRequest) -> McpResponse {
    let id = req.id.clone();
    let start = std::time::Instant::now();
    
    let resp = match req.method.as_str() {
        "initialize" => {
            let caps: Value = serde_json::from_str(CAPABILITIES_JSON).unwrap_or(json!({}));
            McpResponse::success(id, json!({
                "protocolVersion": "2024-11-05",
                "capabilities": caps,
                "serverInfo": {
                    "name": "Network Spy MCP Server",
                    "version": "1.2.0"
                }
            }))
        },
        "initialized" => {
            // Notification: No response required
            return McpResponse::success(None, json!(null));
        },
        "tools/list" => {
            let tools: Value = serde_json::from_str(TOOLS_JSON).unwrap_or(json!({ "tools": [] }));
            McpResponse::success(id, tools)
        },
        "resources/list" => {
            let res: Value = serde_json::from_str(RESOURCES_JSON).unwrap_or(json!({ "resources": [] }));
            McpResponse::success(id, res)
        },
        "resources/read" => {
            let uri = req.params["uri"].as_str().unwrap_or("");
            if uri == "traffic://latest" {
                let data = traffic::get_latest_traffic_resource(app_handle).await;
                McpResponse::success(id, json!({
                    "contents": [{
                        "uri": uri,
                        "mimeType": "application/json",
                        "text": data
                    }]
                }))
            } else {
                McpResponse::error(id, -32602, "Invalid resource URI")
            }
        },
        "tools/call" => {
            let name = req.params["name"].as_str().unwrap_or("");
            let args = &req.params["arguments"];

            let result = match name {
                "get_traffic_list" => traffic::handle_get_traffic_list(app_handle, args).await,
                "get_traffic_details" => traffic::handle_get_traffic_details(app_handle, args).await,
                "list_filter_presets" => traffic::handle_list_filter_presets(app_handle).await,
                "get_filter_preset_template" => traffic::handle_get_filter_preset_template().await,
                "save_filter_preset" => traffic::handle_save_filter_preset(app_handle, args).await,
                "delete_filter_preset" => traffic::handle_delete_filter_preset(app_handle, args).await,
                "list_scripts" => scripting::handle_list_scripts(app_handle).await,
                "save_script" => scripting::handle_save_script(app_handle, args).await,
                "delete_script" => scripting::handle_delete_script(app_handle, args).await,
                "list_breakpoints" => breakpoints::handle_list_breakpoints(app_handle).await,
                "save_breakpoint" => breakpoints::handle_save_breakpoint(app_handle, args).await,
                "delete_breakpoint" => breakpoints::handle_delete_breakpoint(app_handle, args).await,
                _ => Err(json!({ "code": -32601, "message": "Tool not found" })),
            };

            match result {
                Ok(val) => {
                    // Optimized content response (avoid double encoding)
                    let text_resp = if val.is_string() {
                         val.as_str().unwrap().to_string()
                    } else {
                         serde_json::to_string_pretty(&val).unwrap_or_default()
                    };

                    McpResponse::success(id, json!({
                        "content": [{
                            "type": "text",
                            "text": text_resp
                        }]
                    }))
                },
                Err(err) => McpResponse::error(id, err["code"].as_i64().unwrap_or(-32000) as i32, err["message"].as_str().unwrap_or("Unknown error")),
            }
        }
        _ => McpResponse::error(id, -32601, &format!("Method '{}' not found", req.method)),
    };

    let duration = start.elapsed();
    if duration.as_millis() > 100 {
        eprintln!("[MCP] Slow request: {} took {:?}", req.method, duration);
    }
    
    resp
}
