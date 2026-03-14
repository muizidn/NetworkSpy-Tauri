// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod certificate_installer;
pub mod proxy_toggle;
// pub mod submenu;
pub mod traffic;

use bytes::Bytes;
use certificate_installer::CertificateInstaller;
use hyper::{Request, Response, Version};
use network_spy_proxy::{proxy::Proxy, traffic::TrafficListener};
use once_cell::sync::OnceCell;
use proxy_toggle::ProxyToggle;
use serde::Serialize;
use std::collections::HashMap;
use std::fs;
use std::sync::Arc;
use std::env;
use tauri::{AppHandle, Manager, Emitter};
use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tokio::sync::RwLock;
use traffic::db::{TrafficDb, TrafficEvent};
use traffic::{request_pair::get_request_pair_data, response_pair::get_response_pair_data};
use traffic::har_util::{create_har_log, HarLog};
use traffic::tags::{TagManager, TagRule, get_tags_from_db, add_tag_to_db, update_tag_in_db, delete_tag_from_db, toggle_tag_in_db, move_tag_to_folder, get_tag_folders, add_tag_folder, rename_tag_folder, delete_tag_folder_from_db};
use flate2::read::{GzDecoder, ZlibDecoder};
use std::io::Read;
use base64::{Engine as _, engine::general_purpose};
use std::sync::atomic::{AtomicU16, Ordering};
use tokio::sync::mpsc;
use rusqlite::params;

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

fn is_text_content_type(content_type: &Option<String>) -> bool {
    match content_type {
        Some(ct) => {
            let ct = ct.to_lowercase();
            ct.contains("text") || 
            ct.contains("json") || 
            ct.contains("javascript") || 
            ct.contains("xml") || 
            ct.contains("html") ||
            ct.contains("urlencoded") ||
            ct.contains("graphql")
        }
        None => {
            // If No content type, we can't be sure, but let's assume binary unless specified
            false
        }
    }
}

fn body_to_string(body: &Option<Vec<u8>>, content_type: &Option<String>) -> String {
    if let Some(bytes) = body {
        if bytes.is_empty() { return String::new(); }
        // Attempt utf8 anyway if it looks like common text types
        if is_text_content_type(content_type) {
            String::from_utf8_lossy(bytes).into_owned()
        } else {
            format!("<Binary Data: {} bytes>", bytes.len())
        }
    } else {
        String::new()
    }
}

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
fn install_certificate(cert_path: String) -> Result<String, String> {
    print!("INSTALL CERTIFICATE");
    CERTIFICATE_INSTALLER.get().unwrap().install(cert_path)
}

#[tauri::command]
fn auto_install_certificate() -> Result<String, String> {
    let ca_cert = include_str!("ca/network-spy.cer");
    CERTIFICATE_INSTALLER.get().unwrap().install_from_content(ca_cert)
}

#[tauri::command]
fn open_new_window(app_handle: tauri::AppHandle, context: String, title: String) {
    tauri::WebviewWindowBuilder::new(
        &app_handle,
        context.clone(),
        tauri::WebviewUrl::App(std::path::PathBuf::from(format!("/{}", context))),
    )
    .title(title)
    .inner_size(1500.0, 700.0)
    .max_inner_size(1500.0, 700.0)
    .resizable(false)
    .build()
    .unwrap();
}

#[tauri::command]
fn get_recent_traffic(
    db: tauri::State<'_, Arc<TrafficDb>>,
    limit: usize,
) -> Vec<traffic::db::TrafficMetadata> {
    db.get_recent_traffic(limit)
}

#[tauri::command]
async fn save_session(path: String, db: tauri::State<'_, Arc<TrafficDb>>) -> Result<(), String> {
    let data = db.get_all_traffic_with_bodies().map_err(|e| e.to_string())?;
    let har = create_har_log(data);
    let json = serde_json::to_string_pretty(&har).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn export_selected_session(path: String, ids: Vec<String>, db: tauri::State<'_, Arc<TrafficDb>>) -> Result<(), String> {
    let data = db.get_traffic_with_bodies_by_ids(ids).map_err(|e| e.to_string())?;
    let har = create_har_log(data);
    let json = serde_json::to_string_pretty(&har).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn export_selected_to_csv(path: String, ids: Vec<String>, db: tauri::State<'_, Arc<TrafficDb>>) -> Result<(), String> {
    let data = db.get_traffic_with_bodies_by_ids(ids).map_err(|e| e.to_string())?;
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
    let data = db.get_traffic_with_bodies_by_ids(ids).map_err(|e| e.to_string())?;
    
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

    db.clear_all().map_err(|e| e.to_string())?;
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
    request_times: Mutex<HashMap<u64, (Instant, String, String)>>, // Stores start time, uri, and method
}

impl TrafficListener for MyTrafficListener {
    fn request(&self, id: u64, request: Request<Bytes>, intercepted: bool, client_addr: String) {
        let uri = request.uri().to_string();
        let method = request.method().as_str().to_string();
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

        let client_name = traffic::process_info::get_app_name(&client_addr);
        let client_info = format!("{} ({})", client_name, client_addr);

        let tags = self.tag_manager.sync_tagging(&uri, &method, &headers);

        self.traffic_db.insert_request(TrafficEvent::Request {
            id: id.to_string(),
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
        self.tag_manager.async_tagging(id.to_string(), uri.clone(), method.clone(), headers.clone(), decompressed_body.clone(), self.app_handle.clone());

        let _result = self.app_handle.emit(
            "traffic_event",
            Payload {
                id: id.to_string(),
                is_request: true,
                data: PayloadTraffic {
                    uri: Some(uri),
                    version: Some(http_version),
                    method: Some(method),
                    headers,
                    body_size,
                    intercepted,
                    status_code: None,
                    client: Some(client_info),
                    tags,
                },
            },
        );
    }

    fn response(&self, id: u64, response: Response<Bytes>, intercepted: bool, client_addr: String) {
        let (start_time, uri, method) = self.request_times.lock().unwrap().remove(&id).unwrap_or((Instant::now(), "".to_string(), "".to_string()));
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

        self.traffic_db.insert_response(TrafficEvent::Response {
            id: id.to_string(),
            headers: headers.clone(),
            body: decompressed_body.clone(),
            content_type,
            content_encoding,
            status_code,
        });

        let client_name = traffic::process_info::get_app_name(&client_addr);
        let client_info = format!("{} ({})", client_name, client_addr);

        let mut headers_with_perf = headers.clone();
        headers_with_perf.insert("x-latency-ms".to_string(), duration.to_string());

        // Async tagging for response body
        self.tag_manager.async_tagging(id.to_string(), uri, method, headers, decompressed_body, self.app_handle.clone());

        let _result = self.app_handle.emit(
            "traffic_event",
            Payload {
                id: id.to_string(),
                is_request: false,
                data: PayloadTraffic {
                    uri: None,
                    version: Some(http_version),
                    method: None,
                    headers: headers_with_perf,
                    body_size,
                    intercepted,
                    status_code: Some(status_code),
                    client: Some(client_info),
                    tags: Vec::new(), // Tags will be updated via tags_updated event if async rules match
                },
            },
        );
    }
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.iter().any(|arg| arg == "--install-cert") {
        let ca_cert = include_str!("ca/network-spy.cer");
        let installer = CertificateInstaller {};
        match installer.install_from_content(ca_cert) {
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

    let key_pair = include_str!("ca/network-spy.key");
    let ca_cert = include_str!("ca/network-spy.cer");

    let proxy_toggle = ProxyToggle {};
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
            let cert_installer_item = MenuItemBuilder::with_id("cert-installer", "Certificate Installer").build(app)?;
            let tag_item = MenuItemBuilder::with_id("tools-tag", "Tag").build(app)?;
            let quit_item = MenuItemBuilder::with_id("quit-app", "Quit netwok-spy").accelerator("Cmd+Q").build(app)?;

            let tools_submenu = SubmenuBuilder::new(app, "Tools")
                .item(&cert_installer_item)
                .separator()
                .item(&tag_item)
                .build()?;

            let menu = MenuBuilder::new(app)
                .item(&SubmenuBuilder::new(app, "netwok-spy")
                    .about(None)
                    .separator()
                    .services()
                    .separator()
                    .hide()
                    .hide_others()
                    .show_all()
                    .separator()
                    .item(&quit_item)
                    .build()?)
                .item(&tools_submenu)
                .build()?;

            app.set_menu(menu)?;

            app.on_menu_event(move |app_handle, event| {
                if event.id() == "cert-installer" {
                    open_new_window(app_handle.clone(), "certificate-installer".into(), "Certificate Installer".into());
                } else if event.id() == "tools-tag" {
                    open_new_window(app_handle.clone(), "tag".into(), "Tag Tools".into());
                } else if event.id() == "quit-app" {
                    if let Some(toggle) = PROXY_TOGGLE.get() {
                        toggle.turn_off();
                        println!("Proxy turned off (Menu Quit)");
                    }
                    app_handle.exit(0);
                }
            });

            let app_handle = app.app_handle();

            let app_data_dir = app_handle.path().app_data_dir().unwrap_or_else(|_| {
                let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
                std::path::PathBuf::from(home).join(".network-spy")
            });

            if !app_data_dir.exists() {
                fs::create_dir_all(&app_data_dir).expect("Failed to create app data directory");
            }

            let db_path = app_data_dir.join("traffic.db");
            
            
            let traffic_db = Arc::new(TrafficDb::new(db_path).expect("Failed to initialize database"));
            app_handle.manage(Arc::clone(&traffic_db));

            let tag_manager = Arc::new(TagManager::new(Arc::clone(&traffic_db)));
            app_handle.manage(Arc::clone(&tag_manager));

            let mut list = traffic_db.get_allow_list().expect("Failed to get allow list from DB");
            if list.is_empty() {
                list = vec![
                    "google.com".to_string(),
                    "facebook.com".to_string(),
                    "openai.com".to_string(),
                    "anthropic.com".to_string(),
                ];
                for domain in &list {
                     let _ = traffic_db.add_to_allow_list(domain.clone());
                }
            }
            let allow_list = Arc::new(RwLock::new(list));
            app_handle.manage(InterceptAllowList(Arc::clone(&allow_list)));

            let actual_port = (9090..65535)
                .find(|port| std::net::TcpListener::bind(("127.0.0.1", *port)).is_ok())
                .unwrap_or(9090);
            
            ACTUAL_PORT.store(actual_port, Ordering::SeqCst);
            println!("Proxy starting on port: {}", actual_port);

            let (tx, mut rx) = mpsc::unbounded_channel::<u16>();
            RESTART_TX.set(tx).expect("Failed to set RESTART_TX");

            let app_handle_outer = app_handle.clone();
            let traffic_db_outer = Arc::clone(&traffic_db);
            let allow_list_outer = Arc::clone(&allow_list);

            tauri::async_runtime::spawn(async move {
                let mut current_port = actual_port;
                loop {
                    let app_handle_inner = app_handle_outer.clone();
                    let traffic_db_inner = Arc::clone(&traffic_db_outer);
                    let allow_list_inner = Arc::clone(&allow_list_outer);

                    let mut proxy = Proxy::new(key_pair, ca_cert, current_port.into());
                    let listener = Arc::new(MyTrafficListener {
                        app_handle: app_handle_inner,
                        traffic_db: traffic_db_inner,
                        tag_manager: Arc::clone(&tag_manager),
                        request_times: Mutex::new(HashMap::new()),
                    });

                    println!("Proxy server listening on port: {}", current_port);
                    
                    // We need a way to stop run_proxy. Since we don't have a shutdown handle,
                    // we'll run it and listen for port changes.
                    // NOTE: This assumes run_proxy can be "shadowed" or we just hope 
                    // the previous one doesn't conflict too much or we'd ideally kill it.
                    // For now, this provides the "best effort" transition.
                    
                    let listener_task = tauri::async_runtime::spawn(async move {
                        proxy.run_proxy(listener, allow_list_inner).await;
                    });

                    // Wait for a restart signal
                    if let Some(new_port) = rx.recv().await {
                        println!("Restarting proxy on new port: {}", new_port);
                        listener_task.abort(); // Kill old listener
                        current_port = new_port;
                        
                        // Also update system proxy if it was on
                        // We can't easily knows if it was ON here, but we can just turn it on/off via toggle
                    } else {
                        break;
                    }
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
            open_new_window,
            get_request_pair_data,
            get_response_pair_data,
            update_intercept_allow_list,
            get_recent_traffic,
            save_session,
            load_session,
            export_selected_session,
            export_selected_to_csv,
            export_selected_to_sqlite,
            change_proxy_port,
            get_tags_from_db,
            add_tag_to_db,
            update_tag_in_db,
            delete_tag_from_db,
            toggle_tag_in_db,
            move_tag_to_folder,
            get_tag_folders,
            add_tag_folder,
            rename_tag_folder,
            delete_tag_folder_from_db,
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
