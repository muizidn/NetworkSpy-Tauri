// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod ca_manager;
mod certificate_installer;
pub mod proxy_toggle;
// pub mod submenu;
pub mod traffic;

use bytes::Bytes;
use certificate_installer::CertificateInstaller;
use hyper::{Request, Response, Version};
use network_spy_proxy::{proxy::Proxy, traffic::TrafficListener};
use tauri::menu::{Menu, MenuItem, MenuEvent, MenuBuilder, MenuItemBuilder, SubmenuBuilder, Submenu};
use async_trait::async_trait;
use once_cell::sync::OnceCell;
use proxy_toggle::ProxyToggle;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::fs;
use std::sync::Arc;
use std::sync::atomic::AtomicBool;
use std::env;
use tauri::{AppHandle, Manager, Emitter};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tokio::sync::RwLock;
use traffic::db::{TrafficDb, TrafficEvent};
use traffic::{request_pair::get_request_pair_data, response_pair::get_response_pair_data};
use traffic::har_util::{create_har_log, HarLog};
use traffic::tags::{TagManager, get_tags_from_db, add_tag_to_db, update_tag_in_db, delete_tag_from_db, toggle_tag_in_db, toggle_folder_in_db, move_tag_to_folder, get_tag_folders, add_tag_folder, rename_tag_folder, delete_tag_folder_from_db};
use traffic::sessions::{SessionManager, get_saved_sessions, get_session_folders, create_session_folder, delete_session_folder, rename_session_folder, move_session_to_folder, delete_saved_session, save_current_capture, save_capture_to_folder, get_session_traffic, import_session_from_har, import_session_to_folder, export_session_data, get_session_request_data, get_session_response_data};
use traffic::viewers::{ViewerManager, get_custom_viewers, get_viewer_folders, create_viewer_folder, delete_viewer_folder, rename_viewer_folder, move_viewer_to_folder, delete_custom_viewer, save_custom_viewer};
use traffic::bottom_pane::{BottomPaneManager, get_custom_checkers, save_custom_checker, delete_custom_checker};
use flate2::read::{GzDecoder, ZlibDecoder};
use std::io::Read;
use base64::{Engine as _, engine::general_purpose};
use std::sync::atomic::{AtomicU16, AtomicU64, AtomicUsize, Ordering};
use tokio::sync::mpsc;
use rusqlite::params;

struct TrayStats {
    total_requests: AtomicUsize,
    tx_bytes: AtomicU64,
    rx_bytes: AtomicU64,
}

impl TrayStats {
    fn new() -> Self {
        Self {
            total_requests: AtomicUsize::new(0),
            tx_bytes: AtomicU64::new(0),
            rx_bytes: AtomicU64::new(0),
        }
    }
}

static TRAY_STATS: OnceCell<Arc<TrayStats>> = OnceCell::new();
fn format_bytes(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;

    if bytes >= GB {
        format!("{:.2} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.2} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.2} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} B", bytes)
    }
}

static ACTUAL_PORT: AtomicU16 = AtomicU16::new(9090);
static RESTART_TX: OnceCell<mpsc::UnboundedSender<u16>> = OnceCell::new();

fn decompress_body(headers: &HashMap<String, String>, body: Vec<u8>) -> Vec<u8> {
    let encoding = headers.get("content-encoding").or_else(|| headers.get("Content-Encoding"));
    
    match encoding.map(|s| s.to_lowercase()).as_deref() {
        Some("gzip") => {
            let mut decoder = GzDecoder::new(&body[..]);
            let mut decoded = Vec::new();
            if decoder.read_to_end(&mut decoded).is_ok() {
                return decoded;
            }
        }
        Some("deflate") => {
            let mut decoder = ZlibDecoder::new(&body[..]);
            let mut decoded = Vec::new();
            if decoder.read_to_end(&mut decoded).is_ok() {
                return decoded;
            }
        }
        Some("br") => {
            let mut decoded = Vec::new();
            let mut reader = brotli::Decompressor::new(&body[..], 4096);
            if reader.read_to_end(&mut decoded).is_ok() {
                return decoded;
            }
        }
        _ => {}
    }
    body
}

use crate::traffic::db::{is_text_content_type, body_to_string};

#[derive(Clone, Serialize)]
struct PayloadTraffic {
    uri: Option<String>,
    method: Option<String>,
    version: Option<String>,
    body_size: usize,
    headers: HashMap<String, String>,
    intercepted: bool,
    status_code: Option<u16>,
    client: Option<String>,
    tags: Vec<String>,
}

#[derive(Clone, Serialize)]
struct Payload {
    id: String,
    is_request: bool,
    data: PayloadTraffic,
}

struct InterceptAllowList(Arc<RwLock<Vec<String>>>);

#[derive(Clone, Serialize, serde::Deserialize, Default)]
struct ProxySettings {
    show_connect_method: bool,
    stream_certificate_logs: bool,
}

struct ManagedProxySettings(Arc<std::sync::RwLock<ProxySettings>>);

#[derive(Debug, Serialize, Deserialize, Clone)]
struct BreakpointData {
    id: String,
    headers: HashMap<String, String>,
    body: Vec<u8>,
    method: Option<String>,
    uri: Option<String>,
    status_code: Option<u16>,
}

struct PausedTask {
    sender: tokio::sync::oneshot::Sender<Option<BreakpointData>>,
    name: String,
    data: BreakpointData,
}

struct BreakpointManager {
    is_enabled: Arc<AtomicBool>,
    paused_tasks: Arc<RwLock<HashMap<String, PausedTask>>>,
}

#[derive(Clone, Serialize)]
struct BreakpointHit {
    id: String,
    name: String,
}

impl BreakpointManager {
    fn new() -> Self {
        Self {
            is_enabled: Arc::new(AtomicBool::new(false)),
            paused_tasks: Arc::new(RwLock::new(HashMap::new())),
        }
    }
}

#[tauri::command]
async fn get_proxy_settings(state: tauri::State<'_, ManagedProxySettings>) -> Result<ProxySettings, String> {
    let settings = state.0.read().map_err(|e| e.to_string())?;
    Ok(settings.clone())
}

#[tauri::command]
async fn update_proxy_settings(
    state: tauri::State<'_, ManagedProxySettings>,
    db: tauri::State<'_, Arc<TrafficDb>>,
    new_settings: ProxySettings,
) -> Result<(), String> {
    let mut settings = state.0.write().map_err(|e| e.to_string())?;
    *settings = new_settings.clone();
    
    let val = serde_json::to_string(&new_settings).map_err(|e| e.to_string())?;
    let _ = db.set_setting("proxy_settings", &val);
    Ok(())
}

#[tauri::command]
async fn update_intercept_allow_list(
    state: tauri::State<'_, InterceptAllowList>,
    db: tauri::State<'_, Arc<TrafficDb>>,
    new_list: Vec<String>,
) -> Result<(), String> {
    let mut list = state.0.write().await;
    *list = new_list.clone();
    
    for domain in new_list {
        if let Err(e) = db.add_to_allow_list(domain) {
            return Err(e.to_string());
        }
    }
    Ok(())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn set_breakpoint_enabled(state: tauri::State<'_, Arc<BreakpointManager>>, enabled: bool) -> Result<(), String> {
    state.is_enabled.store(enabled, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
async fn get_breakpoint_enabled(state: tauri::State<'_, Arc<BreakpointManager>>) -> Result<bool, String> {
    Ok(state.is_enabled.load(Ordering::SeqCst))
}

#[tauri::command]
async fn resume_breakpoint(
    app: tauri::AppHandle,
    state: tauri::State<'_, Arc<BreakpointManager>>, 
    traffic_id: String,
    modified_data: Option<BreakpointData>
) -> Result<(), String> {
    let mut tasks = state.paused_tasks.write().await;
    if let Some(task) = tasks.remove(&traffic_id) {
        let _ = task.sender.send(modified_data);
        let _ = app.emit("breakpoint_resumed", traffic_id);
    }
    Ok(())
}

#[tauri::command]
async fn get_paused_data(
    state: tauri::State<'_, Arc<BreakpointManager>>,
    id: String
) -> Result<BreakpointData, String> {
    let tasks = state.paused_tasks.read().await;
    if let Some(task) = tasks.get(&id) {
        Ok(task.data.clone())
    } else {
        Err("Breakpoint data not found or already resumed".to_string())
    }
}

#[tauri::command]
async fn get_paused_breakpoints(state: tauri::State<'_, Arc<BreakpointManager>>) -> Result<Vec<BreakpointHit>, String> {
    let tasks = state.paused_tasks.read().await;
    Ok(tasks.iter().map(|(id, task)| BreakpointHit { 
        id: id.clone(), 
        name: task.name.clone() 
    }).collect())
}

#[tauri::command]
fn get_breakpoints(db: tauri::State<'_, Arc<TrafficDb>>) -> Result<Vec<traffic::db::BreakpointRule>, String> {
    db.get_breakpoints().map_err(|e| e.to_string())
}

#[tauri::command]
fn save_breakpoint(rule: traffic::db::BreakpointRule, db: tauri::State<'_, Arc<TrafficDb>>) -> Result<(), String> {
    db.save_breakpoint(rule).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_breakpoint(id: String, db: tauri::State<'_, Arc<TrafficDb>>) -> Result<(), String> {
    db.delete_breakpoint(id).map_err(|e| e.to_string())
}

static PROXY_TOGGLE: OnceCell<ProxyToggle> = OnceCell::new();
static CERTIFICATE_INSTALLER: OnceCell<CertificateInstaller> = OnceCell::new();

#[tauri::command]
fn turn_on_proxy() -> u16 {
    let port = ACTUAL_PORT.load(Ordering::SeqCst);
    PROXY_TOGGLE.get().unwrap().turn_on(port as u64);
    port
}

#[tauri::command]
fn turn_off_proxy() {
    PROXY_TOGGLE.get().unwrap().turn_off();
}

#[tauri::command]
fn change_proxy_port(port: u16) -> u16 {
    let actual_port = (port..65535)
        .find(|p| std::net::TcpListener::bind(("127.0.0.1", *p)).is_ok())
        .unwrap_or(port);

    ACTUAL_PORT.store(actual_port, Ordering::SeqCst);
    
    // Signal restart if tx is initialized
    if let Some(tx) = RESTART_TX.get() {
        let _ = tx.send(actual_port);
    }

    actual_port
}

#[tauri::command]
fn get_app_data_dir() -> std::path::PathBuf {
    use std::env;
    let home = env::var("HOME").or_else(|_| env::var("USERPROFILE")).unwrap_or_else(|_| ".".to_string());
    std::path::PathBuf::from(home).join(".network-spy")
}

#[tauri::command]
fn install_certificate(app: tauri::AppHandle, state: tauri::State<'_, ManagedProxySettings>, cert_path: String) -> Result<String, String> {
    print!("INSTALL CERTIFICATE");
    let stream_logs = state.0.read()
        .map(|s| s.stream_certificate_logs)
        .unwrap_or(false);
    CERTIFICATE_INSTALLER.get().unwrap().install(Some(app), stream_logs, cert_path)
}

#[tauri::command]
fn auto_install_certificate(app: tauri::AppHandle, state: tauri::State<'_, ManagedProxySettings>) -> Result<String, String> {
    let app_data_dir = get_app_data_dir();
    let cert_path = app_data_dir.join("ca").join("network-spy.crt");
    
    if !cert_path.exists() {
        return Err(format!("Certificate file not found at: {}. Please restart the application.", cert_path.display()));
    }

    let cert_content = std::fs::read_to_string(cert_path).map_err(|e| e.to_string())?;
    let stream_logs = state.0.read()
        .map(|s| s.stream_certificate_logs)
        .unwrap_or(false);
    CERTIFICATE_INSTALLER.get().unwrap().install_from_content(Some(app), stream_logs, &cert_content)
}

#[tauri::command]
fn uninstall_certificate(app: tauri::AppHandle, state: tauri::State<'_, ManagedProxySettings>) -> Result<String, String> {
    let stream_logs = state.0.read()
        .map(|s| s.stream_certificate_logs)
        .unwrap_or(false);
    CERTIFICATE_INSTALLER.get().unwrap().uninstall(Some(app), stream_logs)
}

fn open_new_window_internal(app_handle: &tauri::AppHandle, context: String, title: String) {
    let _ = tauri::WebviewWindowBuilder::new(
        app_handle,
        context.clone(),
        tauri::WebviewUrl::App(std::path::PathBuf::from(format!("/{}", context))),
    )
    .title(title)
    .inner_size(1500.0, 700.0)
    .max_inner_size(1500.0, 700.0)
    .resizable(false)
    .build();
}

#[tauri::command]
fn open_new_window(app_handle: tauri::AppHandle, context: String, title: String) {
    open_new_window_internal(&app_handle, context, title);
}

#[tauri::command]
fn get_recent_traffic(
    db: tauri::State<'_, Arc<TrafficDb>>,
    limit: usize,
) -> Vec<traffic::db::TrafficMetadata> {
    db.get_recent_traffic(limit)
}

#[tauri::command]
fn get_all_metadata(
    db: tauri::State<'_, Arc<TrafficDb>>,
    limit: Option<usize>,
) -> Vec<traffic::db::TrafficMetadata> {
    db.get_all_metadata(limit.unwrap_or(10)).unwrap_or_default()
}

#[tauri::command]
fn get_filter_presets(db: tauri::State<'_, Arc<TrafficDb>>) -> Result<Vec<traffic::db::FilterPreset>, String> {
    db.get_filter_presets().map_err(|e| e.to_string())
}

#[tauri::command]
fn add_filter_preset(preset: traffic::db::FilterPreset, db: tauri::State<'_, Arc<TrafficDb>>) -> Result<(), String> {
    db.add_filter_preset(preset).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_filter_preset(
    id: String, 
    name: Option<String>, 
    description: Option<String>, 
    filters: Option<String>, 
    db: tauri::State<'_, Arc<TrafficDb>>
) -> Result<(), String> {
    db.update_filter_preset(id, name, description, filters).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_filter_preset(id: String, db: tauri::State<'_, Arc<TrafficDb>>) -> Result<(), String> {
    db.delete_filter_preset(id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn save_session(path: String, db: tauri::State<'_, Arc<TrafficDb>>) -> Result<(), String> {
    let data = db.get_all_traffic_with_bodies().map_err(|e: rusqlite::Error| e.to_string())?;
    let har = create_har_log(data);
    let json = serde_json::to_string_pretty(&har).map_err(|e: serde_json::Error| e.to_string())?;
    fs::write(path, json).map_err(|e: std::io::Error| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn export_selected_to_har(path: String, ids: Vec<String>, db: tauri::State<'_, Arc<TrafficDb>>) -> Result<(), String> {
    let data = db.get_traffic_with_bodies_by_ids(ids).map_err(|e: rusqlite::Error| e.to_string())?;
    let har = create_har_log(data);
    let json = serde_json::to_string_pretty(&har).map_err(|e: serde_json::Error| e.to_string())?;
    fs::write(path, json).map_err(|e: std::io::Error| e.to_string())?;
    Ok(())
}

fn handle_tray_menu_event(app: &AppHandle, event: MenuEvent) {
    match event.id.as_ref() {
        "quit" => {
            if let Some(toggle) = PROXY_TOGGLE.get() {
                toggle.turn_off();
            }
            app.exit(0);
        }
        "show" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        "reset_proxy" => {
            if let Some(toggle) = PROXY_TOGGLE.get() {
                toggle.turn_off();
                println!("Emergency Proxy Reset from Tray");
            }
        }
        _ => {}
    }
}

#[tauri::command]
async fn export_selected_to_csv(path: String, ids: Vec<String>, db: tauri::State<'_, Arc<TrafficDb>>) -> Result<(), String> {
    let data = db.get_traffic_with_bodies_by_ids(ids).map_err(|e: rusqlite::Error| e.to_string())?;
    let mut csv_content = String::from("ID,Timestamp,Method,URI,Status,Client,RequestBody,ResponseBody\n");
    
    for (meta, req_body, res_body, req_ct, _, res_ct, _) in data {
        let line = format!(
            "{},\"{}\",{},\"{}\",{},\"{}\",\"{}\",\"{}\"\n",
            meta.id,
            meta.timestamp,
            meta.method.unwrap_or_default(),
            meta.uri.unwrap_or_default().replace('\"', "\"\""),
            meta.status_code.unwrap_or(0),
            meta.client.unwrap_or_default().replace('\"', "\"\""),
            body_to_string(&req_body, &req_ct).replace('\"', "\"\""),
            body_to_string(&res_body, &res_ct).replace('\"', "\"\"")
        );
        csv_content.push_str(&line);
    }
    
    fs::write(path, csv_content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn export_selected_to_sqlite(path: String, ids: Vec<String>, db: tauri::State<'_, Arc<TrafficDb>>) -> Result<(), String> {
    let data = db.get_traffic_with_bodies_by_ids(ids).map_err(|e: rusqlite::Error| e.to_string())?;
    
    let conn = rusqlite::Connection::open(&path).map_err(|e| e.to_string())?;
    
    conn.execute_batch(
        "CREATE TABLE traffic (
            id TEXT PRIMARY KEY,
            uri TEXT,
            method TEXT,
            version TEXT,
            client TEXT,
            req_headers TEXT,
            res_headers TEXT,
            status_code INTEGER,
            intercepted INTEGER,
            timestamp DATETIME
        );
        CREATE TABLE body (
            traffic_id TEXT PRIMARY KEY,
            req_body BLOB,
            res_body BLOB,
            req_body_text TEXT,
            res_body_text TEXT,
            req_content_type TEXT,
            res_content_type TEXT
        );"
    ).map_err(|e| e.to_string())?;
    
    {
        let mut ins_traffic = conn.prepare("INSERT INTO traffic (id, uri, method, version, client, req_headers, res_headers, status_code, intercepted, timestamp) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)").map_err(|e| e.to_string())?;
        let mut ins_body = conn.prepare("INSERT INTO body (traffic_id, req_body, res_body, req_body_text, res_body_text, req_content_type, res_content_type) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)").map_err(|e| e.to_string())?;
        
        for (meta, req_body, res_body, req_ct, _, res_ct, _) in data {
            ins_traffic.execute(params![
                meta.id, meta.uri, meta.method, meta.version, meta.client, meta.req_headers, meta.res_headers, meta.status_code, if meta.intercepted { 1 } else { 0 }, meta.timestamp
            ]).map_err(|e| e.to_string())?;
            
            let req_text = if is_text_content_type(&req_ct) { Some(body_to_string(&req_body, &req_ct)) } else { None };
            let res_text = if is_text_content_type(&res_ct) { Some(body_to_string(&res_body, &res_ct)) } else { None };

            ins_body.execute(params![
                meta.id, req_body, res_body, req_text, res_text, req_ct, res_ct
            ]).map_err(|e| e.to_string())?;
        }
    }
    
    Ok(())
}

#[tauri::command]
async fn load_session(path: String, db: tauri::State<'_, Arc<TrafficDb>>, app_handle: AppHandle) -> Result<(), String> {
    let json = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let har: HarLog = serde_json::from_str(&json).map_err(|e| e.to_string())?;

    db.clear_all().map_err(|e: rusqlite::Error| e.to_string())?;
    app_handle.emit("traffic_cleared", ()).map_err(|e| e.to_string())?;
    std::thread::sleep(std::time::Duration::from_millis(100));
    
    let entries_count = har.log.entries.len();
    println!("Importing {} entries from HAR", entries_count);

    for (i, entry) in har.log.entries.into_iter().enumerate() {
        if i % 10 == 0 {
            std::thread::sleep(std::time::Duration::from_millis(1));
        }
        let timestamp = entry.started_date_time.clone();
        let id = format!("har_{}_{}", timestamp, i);
        
        // Request
        let mut req_headers = HashMap::new();
        for h in entry.request.headers {
            req_headers.insert(h.name.clone(), h.value);
        }

        let method = entry.request.method.clone();
        let url = entry.request.url.clone();
        let version = entry.request.http_version.clone();
        let body_size = entry.request.body_size as usize;

        let req_body = if let Some(post) = entry.request.post_data {
            post.text.into_bytes()
        } else {
            vec![]
        };

        let content_type = req_headers.get("content-type").or_else(|| req_headers.get("Content-Type")).cloned();
        let content_encoding = req_headers.get("content-encoding").or_else(|| req_headers.get("Content-Encoding")).cloned();

        db.insert_request(TrafficEvent::Request {
            id: id.clone(),
            uri: url.clone(),
            method: method.clone(),
            version: version.clone(),
            headers: req_headers.clone(),
            body: req_body,
            content_type,
            content_encoding,
            intercepted: true,
            client: "HAR Import".to_string(),
            tags: vec![],
        });

        let _ = app_handle.emit("traffic_event", Payload {
            id: id.clone(),
            is_request: true,
            data: PayloadTraffic {
                uri: Some(url),
                version: Some(version.clone()),
                method: Some(method),
                headers: req_headers,
                body_size,
                intercepted: true,
                status_code: None,
                client: Some("HAR Import".to_string()),
                tags: vec![],
            }
        });

        // Response
        let mut res_headers = HashMap::new();
        for h in entry.response.headers {
            res_headers.insert(h.name.clone(), h.value);
        }

        let res_body = if let Some(text) = entry.response.content.text {
            if entry.response.content.encoding.as_deref() == Some("base64") {
                general_purpose::STANDARD.decode(text).unwrap_or_default()
            } else {
                text.into_bytes()
            }
        } else {
            vec![]
        };

        let status_code = entry.response.status;
        let res_body_size = entry.response.content.size;

        let content_type = res_headers.get("content-type").or_else(|| res_headers.get("Content-Type")).cloned();
        let content_encoding = res_headers.get("content-encoding").or_else(|| res_headers.get("Content-Encoding")).cloned();

        db.insert_response(TrafficEvent::Response {
            id: id.clone(),
            headers: res_headers.clone(),
            body: res_body,
            content_type,
            content_encoding,
            status_code,
        });

        let _ = app_handle.emit("traffic_event", Payload {
            id: id.clone(),
            is_request: false,
            data: PayloadTraffic {
                uri: None,
                version: Some(entry.response.http_version.clone()),
                method: None,
                headers: res_headers,
                body_size: res_body_size,
                intercepted: true,
                status_code: Some(status_code),
                client: Some("HAR Import".to_string()),
                tags: vec![],
            }
        });
    }
    
    Ok(())
}

use std::sync::Mutex;
use std::time::Instant;

struct MyTrafficListener {
    app_handle: AppHandle,
    traffic_db: Arc<TrafficDb>,
    tag_manager: Arc<TagManager>,
    proxy_settings: Arc<std::sync::RwLock<ProxySettings>>,
    request_times: Mutex<HashMap<u64, (Instant, String, String)>>, // Stores start time, uri, and method
    tray_stats: Arc<TrayStats>,
    session_id: String,
    breakpoint_manager: Arc<BreakpointManager>,
}

#[async_trait]
impl TrafficListener for MyTrafficListener {
    async fn request(&self, id: u64, mut request: Request<Bytes>, intercepted: bool, client_addr: String) -> Request<Bytes> {
        self.tray_stats.total_requests.fetch_add(1, Ordering::Relaxed);
        self.tray_stats.tx_bytes.fetch_add(request.body().len() as u64, Ordering::Relaxed);
        
        let mut uri = request.uri().to_string();
        
        // Clean up redundant default ports from the URI
        if uri.starts_with("https://") {
            uri = uri.replace(":443/", "/");
            if uri.ends_with(":443") {
                uri = uri[..uri.len() - 4].to_string();
            }
        } else if uri.starts_with("http://") {
            uri = uri.replace(":80/", "/");
            if uri.ends_with(":80") {
                uri = uri[..uri.len() - 3].to_string();
            }
        }
        
        let method = request.method().as_str().to_string();
 
        let show_connect = if let Ok(settings) = self.proxy_settings.read() {
            settings.show_connect_method
        } else {
            false
        };
 
        if !show_connect && method.trim().to_uppercase() == "CONNECT" {
            return request;
        }
 
        self.request_times.lock().unwrap().insert(id, (Instant::now(), uri.clone(), method.clone()));
        
        let http_version = match request.version() {
            Version::HTTP_10 => "HTTP/1.0".to_string(),
            Version::HTTP_11 => "HTTP/1.1".to_string(),
            Version::HTTP_2 => "HTTP/2".to_string(),
            Version::HTTP_3 => "HTTP/3".to_string(),
            _ => "Unknown".to_string(),
        };
 
        let headers = request
            .headers()
            .iter()
            .map(|(key, value)| {
                (key.to_string(), value.to_str().unwrap_or("").to_string())
            })
            .collect::<HashMap<_, _>>();
 
        let body_bytes = request.body();
        let body_vec = body_bytes.to_vec();
        let decompressed_body = decompress_body(&headers, body_vec);
        let body_size = decompressed_body.len();
 
        let content_type = headers.get("content-type").or_else(|| headers.get("Content-Type")).cloned();
        let content_encoding = headers.get("content-encoding").or_else(|| headers.get("Content-Encoding")).cloned();
 
        let client_info = traffic::process_info::get_client_info(&client_addr);
 
        let tags = self.tag_manager.sync_tagging(&uri, &method, &headers);
 
        let traffic_id = format!("{}_{}", self.session_id, id);
 
        self.traffic_db.insert_request(TrafficEvent::Request {
            id: traffic_id.clone(),
            uri: uri.clone(),
            method: method.clone(),
            version: http_version.clone(),
            headers: headers.clone(),
            body: decompressed_body.clone(),
            content_type,
            content_encoding,
            intercepted,
            client: client_info.clone(),
            tags: tags.clone(),
        });
        
        // Async tagging for request body if needed
        self.tag_manager.async_tagging(traffic_id.clone(), uri.clone(), method.clone(), headers.clone(), decompressed_body.clone(), self.app_handle.clone());
 
        let _result = self.app_handle.emit(
            "traffic_event",
            Payload {
                id: traffic_id.clone(),
                is_request: true,
                data: PayloadTraffic {
                    uri: Some(uri.clone()),
                    version: Some(http_version.clone()),
                    method: Some(method.clone()),
                    headers: headers.clone(),
                    body_size,
                    intercepted,
                    status_code: None,
                    client: Some(client_info.clone()),
                    tags: tags.clone(),
                },
            },
        );
 
        // Handle Breakpoint for Request
        let mut should_pause = false;
        let mut matched_rule_name = String::new();
 
        if self.breakpoint_manager.is_enabled.load(Ordering::SeqCst) {
            if let Ok(rules) = self.traffic_db.get_breakpoints() {
                for rule in rules {
                    if rule.enabled && rule.request && matches_breakpoint(&uri, &method, &rule.matching_rule, &rule.method) {
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
            {
                let mut tasks = self.breakpoint_manager.paused_tasks.write().await;
                tasks.insert(hit_id.clone(), PausedTask {
                    sender: tx,
                    name: matched_rule_name.clone(),
                    data: BreakpointData {
                        id: hit_id.clone(),
                        headers: headers.clone(),
                        body: decompressed_body.clone(),
                        method: Some(method.clone()),
                        uri: Some(uri.clone()),
                        status_code: None,
                    }
                });
            }
            
            let _ = self.app_handle.emit("breakpoint_hit", BreakpointHit { id: hit_id, name: matched_rule_name.clone() });
            
            // Wait for resume with optional modified data
            if let Ok(Some(modified)) = rx.await {
                // Apply modifications
                let body_mut = request.body_mut();
                *body_mut = Bytes::from(modified.body.clone());
 
                let header_mut = request.headers_mut();
                header_mut.clear();
                let mut updated_headers = HashMap::new();
                for (k, v) in modified.headers {
                    // Skip content-encoding and content-length when body is modified as we send it as identity/raw
                    let k_lower = k.to_lowercase();
                    if k_lower == "content-encoding" || k_lower == "content-length" {
                        continue;
                    }

                    if let (Ok(key), Ok(val)) = (hyper::header::HeaderName::from_bytes(k.as_bytes()), hyper::header::HeaderValue::from_str(&v)) {
                        header_mut.insert(key.clone(), val);
                        updated_headers.insert(k.clone(), v.clone());
                    }
                }
                
                // Update method/uri if provided
                let mut updated_uri = uri.clone();
                let mut updated_method = method.clone();
                if let Some(m) = modified.method {
                    if let Ok(method_val) = hyper::Method::from_bytes(m.as_bytes()) {
                        *request.method_mut() = method_val;
                        updated_method = m;
                    }
                }
                if let Some(u) = modified.uri {
                    if let Ok(uri_val) = hyper::Uri::try_from(&u) {
                        *request.uri_mut() = uri_val;
                        updated_uri = u;
                    }
                }

                // Detect changes and add tags
                let mut modification_tags = tags.clone();
                modification_tags.push(format!("BREAKPOINT: {}", matched_rule_name));

                if modified.body != decompressed_body {
                    modification_tags.push("BREAKPOINT_REQ_BODY_CHANGED".to_string());
                }

                if updated_headers != headers {
                    modification_tags.push("BREAKPOINT_REQ_HEADERS_CHANGED".to_string());
                }

                if updated_uri != uri {
                    modification_tags.push("BREAKPOINT_REQ_URI_CHANGED".to_string());
                }

                if updated_method != method {
                    modification_tags.push("BREAKPOINT_REQ_METHOD_CHANGED".to_string());
                }

                // Update DB and re-emit to reflect changes in viewer
                let updated_body_size = modified.body.len();
                self.traffic_db.insert_request(TrafficEvent::Request {
                    id: traffic_id.clone(),
                    uri: updated_uri.clone(),
                    method: updated_method.clone(),
                    version: http_version.clone(),
                    headers: updated_headers.clone(),
                    body: modified.body.clone(),
                    content_type: updated_headers.get("content-type").or_else(|| updated_headers.get("Content-Type")).cloned(),
                    content_encoding: None, // We stripped it for modification
                    intercepted,
                    client: client_info.clone(),
                    tags: modification_tags.clone(),
                });

                let _ = self.app_handle.emit(
                    "traffic_event",
                    Payload {
                        id: traffic_id.clone(),
                        is_request: true,
                        data: PayloadTraffic {
                            uri: Some(updated_uri),
                            version: Some(http_version),
                            method: Some(updated_method),
                            headers: updated_headers,
                            body_size: updated_body_size,
                            intercepted,
                            status_code: None,
                            client: Some(client_info),
                            tags: modification_tags,
                        },
                    },
                );
            }
        }

        request
    }

    async fn response(&self, id: u64, mut response: Response<Bytes>, intercepted: bool, client_addr: String) -> Response<Bytes> {
        self.tray_stats.rx_bytes.fetch_add(response.body().len() as u64, Ordering::Relaxed);
        
        let (start_time, uri, method) = match self.request_times.lock().unwrap().remove(&id) {
            Some(data) => data,
            None => return response, // If request was filtered, we ignore the response too but still return it
        };
        let duration = start_time.elapsed().as_millis();
        
        let status_code = response.status().as_u16();
        let http_version = match response.version() {
            Version::HTTP_10 => "HTTP/1.0".to_string(),
            Version::HTTP_11 => "HTTP/1.1".to_string(),
            Version::HTTP_2 => "HTTP/2".to_string(),
            Version::HTTP_3 => "HTTP/3".to_string(),
            _ => "Unknown".to_string(),
        };
 
        let headers = response
            .headers()
            .iter()
            .map(|(key, value)| {
                (key.to_string(), value.to_str().unwrap_or("").to_string())
            })
            .collect::<HashMap<_, _>>();
 
        let body_bytes = response.body();
        let body_vec = body_bytes.to_vec();
        let decompressed_body = decompress_body(&headers, body_vec);
        let body_size = decompressed_body.len();
 
        let content_type = headers.get("content-type").or_else(|| headers.get("Content-Type")).cloned();
        let content_encoding = headers.get("content-encoding").or_else(|| headers.get("Content-Encoding")).cloned();
 
        let traffic_id = format!("{}_{}", self.session_id, id);
 
        self.traffic_db.insert_response(TrafficEvent::Response {
            id: traffic_id.clone(),
            headers: headers.clone(),
            body: decompressed_body.clone(),
            content_type,
            content_encoding,
            status_code,
        });
 
        let client_info = traffic::process_info::get_client_info(&client_addr);
 
        let mut headers_with_perf = headers.clone();
        headers_with_perf.insert("x-latency-ms".to_string(), duration.to_string());
 
        // Async tagging for response body
        self.tag_manager.async_tagging(traffic_id.clone(), uri.clone(), method.clone(), headers.clone(), decompressed_body.clone(), self.app_handle.clone());
 
        let _result = self.app_handle.emit(
            "traffic_event",
            Payload {
                id: traffic_id.clone(),
                is_request: false,
                data: PayloadTraffic {
                    uri: None,
                    version: Some(http_version.clone()),
                    method: None,
                    headers: headers_with_perf.clone(),
                    body_size,
                    intercepted,
                    status_code: Some(status_code),
                    client: Some(client_info.clone()),
                    tags: Vec::new(), // Tags will be updated via tags_updated event if async rules match
                },
            },
        );
 
        // Handle Breakpoint for Response
        let mut should_pause = false;
        let mut matched_rule_name = String::new();
 
        if self.breakpoint_manager.is_enabled.load(Ordering::SeqCst) {
            if let Ok(rules) = self.traffic_db.get_breakpoints() {
                for rule in rules {
                    if rule.enabled && rule.response && matches_breakpoint(&uri, &method, &rule.matching_rule, &rule.method) {
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
            {
                let mut tasks = self.breakpoint_manager.paused_tasks.write().await;
                tasks.insert(hit_id.clone(), PausedTask {
                    sender: tx,
                    name: matched_rule_name.clone(),
                    data: BreakpointData {
                        id: hit_id.clone(),
                        headers: headers_with_perf.clone(),
                        body: decompressed_body.clone(),
                        method: Some(method.clone()),
                        uri: Some(uri.clone()),
                        status_code: Some(status_code),
                    }
                });
            }
            
            let _ = self.app_handle.emit("breakpoint_hit", BreakpointHit { id: hit_id, name: matched_rule_name.clone() });
            
            // Wait for resume
            if let Ok(Some(modified)) = rx.await {
                // Apply modifications
                let body_mut = response.body_mut();
                *body_mut = Bytes::from(modified.body.clone());
 
                let header_mut = response.headers_mut();
                header_mut.clear();
                let mut updated_headers = HashMap::new();
                for (k, v) in modified.headers {
                    // Skip content-encoding and content-length when body is modified as we send it as identity/raw
                    let k_lower = k.to_lowercase();
                    if k_lower == "content-encoding" || k_lower == "content-length" {
                        continue;
                    }

                    if let (Ok(key), Ok(val)) = (hyper::header::HeaderName::from_bytes(k.as_bytes()), hyper::header::HeaderValue::from_str(&v)) {
                        header_mut.insert(key.clone(), val);
                        updated_headers.insert(k.clone(), v.clone());
                    }
                }
 
                let mut updated_status = status_code;
                if let Some(sc) = modified.status_code {
                    if let Ok(status) = hyper::StatusCode::from_u16(sc) {
                        *response.status_mut() = status;
                        updated_status = sc;
                    }
                }

                // Detect changes and add tags
                let mut modification_tags = Vec::new(); // Response doesn't have initial tags like request might from sync rules
                modification_tags.push(format!("BREAKPOINT: {}", matched_rule_name));

                if modified.body != decompressed_body {
                    modification_tags.push("BREAKPOINT_RES_BODY_CHANGED".to_string());
                }

                if updated_headers != headers {
                    modification_tags.push("BREAKPOINT_RES_HEADERS_CHANGED".to_string());
                }

                if updated_status != status_code {
                    modification_tags.push("BREAKPOINT_RES_STATUS_CHANGED".to_string());
                }

                // Update DB and re-emit to reflect changes in viewer
                let updated_body_size = modified.body.len();
                self.traffic_db.insert_response(TrafficEvent::Response {
                    id: traffic_id.clone(),
                    headers: updated_headers.clone(),
                    body: modified.body.clone(),
                    content_type: updated_headers.get("content-type").or_else(|| updated_headers.get("Content-Type")).cloned(),
                    content_encoding: None, // Stripped for modification
                    status_code: updated_status,
                });
                
                // Add tags to traffic metadata
                self.traffic_db.update_tags(traffic_id.clone(), modification_tags.clone());

                let _ = self.app_handle.emit(
                    "traffic_event",
                    Payload {
                        id: traffic_id.clone(),
                        is_request: false,
                        data: PayloadTraffic {
                            uri: None,
                            version: Some(http_version.clone()),
                            method: None,
                            headers: updated_headers,
                            body_size: updated_body_size,
                            intercepted,
                            status_code: Some(updated_status),
                            client: Some(client_info.clone()),
                            tags: modification_tags,
                        },
                    },
                );
            }
        }

        response
    }
}

fn matches_breakpoint(uri: &str, method: &str, rule_pattern: &str, rule_method: &str) -> bool {
    // Check method
    if rule_method != "ALL" && !rule_method.is_empty() && rule_method.to_uppercase() != method.to_uppercase() {
        return false;
    }

    // Check URI pattern (simple glob-like matching)
    if rule_pattern == "*" || rule_pattern.is_empty() {
        return true;
    }

    use globset::{Glob, GlobSetBuilder};
    if let Ok(glob) = Glob::new(rule_pattern) {
        let mut builder = GlobSetBuilder::new();
        builder.add(glob);
        if let Ok(set) = builder.build() {
            if set.is_match(uri) {
                return true;
            }
        }
    }

    uri.contains(rule_pattern)
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let app_data_dir = get_app_data_dir();
    
    if args.iter().any(|arg| arg == "--install-cert") {
        let ca_keys = ca_manager::load_or_generate_ca(app_data_dir.clone())
            .expect("Failed to load or generate CA");
        let installer = CertificateInstaller {};
        match installer.install_from_content(None, false, &ca_keys.cert) {
            Ok(output) => {
                println!("Certificate installation successful:\n{}", output);
                std::process::exit(0);
            }
            Err(err) => {
                eprintln!("Certificate installation failed:\n{}", err);
                std::process::exit(1);
            }
        }
    }

    // Load CA cert for normal run
    let ca_keys = ca_manager::load_or_generate_ca(app_data_dir.clone())
        .expect("Failed to load or generate CA");

    // Leak the strings to satisfy the &'static str requirement of the proxy crate
    let key_pair: &'static str = Box::leak(ca_keys.key.into_boxed_str());
    let ca_cert: &'static str = Box::leak(ca_keys.cert.into_boxed_str());

    let proxy_toggle = ProxyToggle::new();
    PROXY_TOGGLE
        .set(proxy_toggle)
        .expect("Failed to set proxy_toggle instance");
    CERTIFICATE_INSTALLER
        .set(CertificateInstaller {})
        .expect("Failed to set certificate_installer instance");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .setup(move |app| {
            let _cert_installer_item = MenuItemBuilder::with_id("cert-installer", "Certificate Installer").build(app)?;
            let _tag_item = MenuItemBuilder::with_id("tools-tag", "Tag").build(app)?;
            let _saved_sessions_item = MenuItemBuilder::with_id("saved-sessions", "Saved Sessions").build(app)?;
            let _traffic_filters_item = MenuItemBuilder::with_id("traffic-filters", "Traffic Filters").build(app)?;
            let quit_item = MenuItemBuilder::with_id("quit-app", "Quit network-spy").accelerator("Cmd+Q").build(app)?;

            let tools_submenu = create_tools_submenu(app)?;
            
            let menu = MenuBuilder::new(app)
                .item(&SubmenuBuilder::new(app, "network-spy")
                    .about(None)
                    .separator()
                    .services()
                    .separator()
                    .hide()
                    .hide_others()
                    .show_all()
                    .separator()
                    .item(&MenuItemBuilder::with_id("quit", "Quit network-spy").accelerator("Cmd+Q").build(app)?)
                    .build()?)
                .item(&tools_submenu)
                .build()?;

            app.set_menu(menu)?;

            // Event handling is unified below in the global handler

            let app_handle = app.app_handle();
            let app_data_dir = get_app_data_dir();

            if !app_data_dir.exists() {
                fs::create_dir_all(&app_data_dir).expect("Failed to create app data directory");
            }

            let db_path = app_data_dir.join("traffic.db");
            
            #[cfg(debug_assertions)]
            println!("DB Path: {}", db_path.display());
            
            let traffic_db = Arc::new(TrafficDb::new(db_path).expect("Failed to initialize database"));
            app_handle.manage(Arc::clone(&traffic_db));

            let tag_manager = Arc::new(TagManager::new(Arc::clone(&traffic_db)));
            app_handle.manage(Arc::clone(&tag_manager));

            let session_manager = Arc::new(SessionManager::new(app_data_dir.clone()));
            app_handle.manage(Arc::clone(&session_manager));

            let viewer_manager = Arc::new(ViewerManager::new(app_data_dir.clone()));
            app_handle.manage(Arc::clone(&viewer_manager));

            let bottom_pane_manager = Arc::new(BottomPaneManager::new(app_data_dir.clone()));
            app_handle.manage(Arc::clone(&bottom_pane_manager));

            let breakpoint_manager = Arc::new(BreakpointManager::new());
            app_handle.manage(Arc::clone(&breakpoint_manager));

            let mut list = traffic_db.get_allow_list().expect("Failed to get allow list from DB");
            if list.is_empty() {
                list = vec![
                    "google.com".to_string(),
                    "facebook.com".to_string(),
                    "openai.com".to_string(),
                    "anthropic.com".to_string(),
                ];
                for domain in &list {
                     let _ = traffic_db.add_to_allow_list(domain.to_string());
                }
            }
            let allow_list = Arc::new(RwLock::new(list));
            app_handle.manage(InterceptAllowList(Arc::clone(&allow_list)));

            // Load settings from DB
            let proxy_settings_data = if let Ok(Some(val)) = traffic_db.get_setting("proxy_settings") {
                serde_json::from_str::<ProxySettings>(&val).unwrap_or_default()
            } else {
                ProxySettings::default()
            };
            let proxy_settings = Arc::new(std::sync::RwLock::new(proxy_settings_data));
            app_handle.manage(ManagedProxySettings(Arc::clone(&proxy_settings)));

            let actual_port = (9090..65535)
                .find(|port| std::net::TcpListener::bind(("127.0.0.1", *port)).is_ok())
                .unwrap_or(9090);
            
            ACTUAL_PORT.store(actual_port, Ordering::SeqCst);
            println!("Proxy starting on port: {}", actual_port);

            let (tx, mut rx) = mpsc::unbounded_channel::<u16>();
            RESTART_TX.set(tx).expect("Failed to set RESTART_TX");

            let tray_stats = Arc::new(TrayStats::new());
            let _ = TRAY_STATS.set(tray_stats.clone());
            let tray_stats_for_task = tray_stats.clone();

            let app_handle_outer_task = app_handle.clone();
            let traffic_db_outer = Arc::clone(&traffic_db);
            let allow_list_outer = Arc::clone(&allow_list);
            let proxy_settings_outer = Arc::clone(&proxy_settings);
            let tag_manager_outer = Arc::clone(&tag_manager);
            let tray_stats_for_proxy = tray_stats.clone();
            let breakpoint_manager_outer = Arc::clone(&breakpoint_manager);

            tauri::async_runtime::spawn(async move {
                let mut current_port = actual_port;
                loop {
                    let app_handle_inner = app_handle_outer_task.clone();
                    let traffic_db_inner = Arc::clone(&traffic_db_outer);
                    let allow_list_inner = Arc::clone(&allow_list_outer);
                    let proxy_settings_inner = Arc::clone(&proxy_settings_outer);
                    let tag_manager_inner = Arc::clone(&tag_manager_outer);
                    let tray_stats_deep = tray_stats_for_proxy.clone();

                    let mut proxy = Proxy::new(key_pair, ca_cert, current_port.into());
                    let listener = Arc::new(MyTrafficListener {
                        app_handle: app_handle_inner,
                        traffic_db: traffic_db_inner,
                        tag_manager: tag_manager_inner,
                        proxy_settings: proxy_settings_inner,
                        request_times: Mutex::new(HashMap::new()),
                        tray_stats: tray_stats_deep,
                        session_id: uuid::Uuid::new_v4().to_string(),
                        breakpoint_manager: breakpoint_manager_outer.clone(),
                    });

                    println!("Proxy server listening on port: {}", current_port);
                    
                    let listener_task = tauri::async_runtime::spawn(async move {
                        proxy.run_proxy(listener, allow_list_inner).await;
                    });

                    // Wait for a restart signal
                    if let Some(new_port) = rx.recv().await {
                        println!("Restarting proxy on new port: {}", new_port);
                        listener_task.abort(); // Kill old listener
                        current_port = new_port;
                    } else {
                        break;
                    }
                }
            });

            // Tray Menu Setup
            let reqs_item = MenuItem::with_id(app_handle, "tray_reqs", "Requests: 0", false, None::<&str>)?;
            let data_item = MenuItem::with_id(app_handle, "tray_data", "Total: 0 B", false, None::<&str>)?;
            let split_item = MenuItem::with_id(app_handle, "tray_split", "0 B ↑ | 0 B ↓", false, None::<&str>)?;
            let status_capture_item = MenuItem::with_id(app_handle, "tray_status_capture", "Capture: Active", false, None::<&str>)?;

            let port_info = format!("Proxy Port: {}", actual_port);
            let status_item = MenuItem::with_id(app_handle, "status", &port_info, false, None::<&str>)?;
            let show_item = MenuItem::with_id(app_handle, "show", "Show Network Spy", true, None::<&str>)?;
            let reset_item = MenuItem::with_id(app_handle, "reset_proxy", "⚠️ Emergency Proxy Reset", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app_handle, "quit", "Quit", true, None::<&str>)?;
            
            // Background task to update tray labels
            let reqs_item_c = reqs_item.clone();
            let data_item_c = data_item.clone();
            let split_item_c = split_item.clone();
            let status_capture_item_c = status_capture_item.clone();
            let stats_updater = tray_stats_for_task.clone();

            tauri::async_runtime::spawn(async move {
                loop {
                    tokio::time::sleep(std::time::Duration::from_millis(800)).await;
                    
                    let reqs = stats_updater.total_requests.load(Ordering::Relaxed);
                    let tx = stats_updater.tx_bytes.load(Ordering::Relaxed);
                    let rx = stats_updater.rx_bytes.load(Ordering::Relaxed);
                    
                    let is_active = if let Some(toggle) = PROXY_TOGGLE.get() {
                        toggle.is_on()
                    } else {
                        false
                    };

                    let _ = reqs_item_c.set_text(format!("Requests: {}", reqs));
                    let _ = data_item_c.set_text(format!("Total Data: {}", format_bytes(tx + rx)));
                    let _ = split_item_c.set_text(format!("{} ↑ | {} ↓", format_bytes(tx), format_bytes(rx)));
                    let _ = status_capture_item_c.set_text(if is_active { "Capture: ⚡ Active" } else { "Capture: ⏸ Paused" });
                }
            });

            let tray_menu = Menu::with_items(app_handle, &[
                &status_item, 
                &status_capture_item,
                &tauri::menu::PredefinedMenuItem::separator(app_handle)?,
                &reqs_item,
                &data_item,
                &split_item,
                &tauri::menu::PredefinedMenuItem::separator(app_handle)?,
                &show_item, 
                &reset_item, 
                &quit_item
            ])?;

            let app_handle_tray = app_handle.clone();
            let _tray = TrayIconBuilder::with_id("main_tray")
                .menu(&tray_menu)
                .icon(app_handle.default_window_icon().unwrap().clone())
                .on_menu_event(handle_tray_menu_event)
                .on_tray_icon_event(move |_tray, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        if let Some(window) = app_handle_tray.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app_handle)?;

            // Window Menu Setup (Linux/Windows top menu bar)
            let tools_submenu = create_tools_submenu(app_handle)?;

            let app_menu = MenuBuilder::new(app_handle)
                .item(&SubmenuBuilder::new(app_handle, "network-spy")
                    .item(&MenuItemBuilder::with_id("show", "Show").build(app_handle)?)
                    .item(&tauri::menu::PredefinedMenuItem::separator(app_handle)?)
                    .item(&MenuItemBuilder::with_id("quit", "Quit").build(app_handle)?)
                    .build()?)
                .item(&tools_submenu)
                .build()?;

            // Set the menu ONLY on the main window
            if let Some(main_window) = app_handle.get_webview_window("main") {
                let _ = main_window.set_menu(app_menu);
            }

            // Global Menu Event Handler for both Tray and Window Menu
            let app_handle_menu = app_handle.clone();
            app_handle.on_menu_event(move |_app, event| {
                match event.id.as_ref() {
                    "install_cert" | "cert-installer" => {
                        let _ = open_new_window_internal(&app_handle_menu, "certificate-installer".to_string(), "Certificate Installer".to_string());
                    }
                    "saved-sessions" | "saved_sessions" => {
                        let _ = open_new_window_internal(&app_handle_menu, "sessions".to_string(), "Saved Sessions".to_string());
                    }
                    "traffic-filters" | "traffic_filters" => {
                        let _ = open_new_window_internal(&app_handle_menu, "filters".to_string(), "Traffic Filters".to_string());
                    }
                    "tools-tag" | "tools_tag" => {
                        let _ = open_new_window_internal(&app_handle_menu, "tag".to_string(), "Tag Tools".to_string());
                    }
                    "breakpoints" => {
                        let _ = open_new_window_internal(&app_handle_menu, "breakpoint".to_string(), "Traffic Breakpoints".to_string());
                    }
                    "quit" | "quit-app" => {
                        if let Some(toggle) = PROXY_TOGGLE.get() {
                            toggle.turn_off();
                        }
                        _app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = _app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "reset_proxy" => {
                        if let Some(toggle) = PROXY_TOGGLE.get() {
                            toggle.turn_off();
                        }
                    }
                    _ => {}
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            turn_on_proxy,
            turn_off_proxy,
            install_certificate,
            auto_install_certificate,
            uninstall_certificate,
            open_new_window,
            get_request_pair_data,
            get_response_pair_data,
            update_intercept_allow_list,
            get_recent_traffic,
            get_all_metadata,
            get_proxy_settings,
            update_proxy_settings,
            save_session,
            load_session,
            get_filter_presets,
            add_filter_preset,
            update_filter_preset,
            delete_filter_preset,
            export_selected_to_har,
            export_selected_to_csv,
            export_selected_to_sqlite,
            change_proxy_port,
            get_tags_from_db,
            add_tag_to_db,
            update_tag_in_db,
            delete_tag_from_db,
            toggle_tag_in_db,
            toggle_folder_in_db,
            move_tag_to_folder,
            get_tag_folders,
            add_tag_folder,
            rename_tag_folder,
            delete_tag_folder_from_db,
            get_saved_sessions,
            get_session_folders,
            create_session_folder,
            delete_session_folder,
            rename_session_folder,
            move_session_to_folder,
            delete_saved_session,
            save_current_capture,
            save_capture_to_folder,
            get_session_traffic,
            import_session_from_har,
            import_session_to_folder,
            export_session_data,
            get_session_request_data,
            get_session_response_data,
            get_custom_viewers,
            get_viewer_folders,
            create_viewer_folder,
            delete_viewer_folder,
            rename_viewer_folder,
            move_viewer_to_folder,
            delete_custom_viewer,
            save_custom_viewer,
            get_custom_checkers,
            save_custom_checker,
            delete_custom_checker,
            set_breakpoint_enabled,
            get_breakpoint_enabled,
            resume_breakpoint,
            get_paused_breakpoints,
            get_breakpoints,
            save_breakpoint,
            delete_breakpoint,
            get_paused_data,
            get_app_data_dir,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, event| match event {
            tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit => {
                if let Some(toggle) = PROXY_TOGGLE.get() {
                    toggle.turn_off();
                    println!("Proxy turned off (Application Exit)");
                }
            }
            _ => {}
        });
}
fn create_tools_submenu<R: tauri::Runtime>(manager: &impl tauri::Manager<R>) -> tauri::Result<Submenu<R>> {
    SubmenuBuilder::new(manager, "Tools")
        .item(&MenuItemBuilder::with_id("install_cert", "Install Root Certificate").build(manager)?)
        .separator()
        .item(&MenuItemBuilder::with_id("tools_tag", "Tagging Rules").build(manager)?)
        .separator()
        .item(&MenuItemBuilder::with_id("saved_sessions", "Saved Sessions").build(manager)?)
        .item(&MenuItemBuilder::with_id("traffic_filters", "Traffic Filters").build(manager)?)
        .separator()
        .item(&MenuItemBuilder::with_id("breakpoints", "Traffic Breakpoints").build(manager)?)
        .build()
}
