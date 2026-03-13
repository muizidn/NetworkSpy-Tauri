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
use flate2::read::{GzDecoder, ZlibDecoder};
use std::io::Read;
use base64::{Engine as _, engine::general_purpose};

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
fn turn_on_proxy(port: u64) {
    PROXY_TOGGLE.get().unwrap().turn_on(port);
}

#[tauri::command]
fn turn_off_proxy() {
    PROXY_TOGGLE.get().unwrap().turn_off();
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
            }
        });
    }
    
    Ok(())
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
        .setup(|app| {
            let cert_installer_item = MenuItemBuilder::with_id("cert-installer", "Certificate Installer").build(app)?;
            let tag_item = MenuItemBuilder::with_id("tools-tag", "Tag").build(app)?;

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
                    .quit()
                    .build()?)
                .item(&tools_submenu)
                .build()?;

            app.set_menu(menu)?;

            app.on_menu_event(move |app_handle, event| {
                if event.id() == "cert-installer" {
                    open_new_window(app_handle.clone(), "certificate-installer".into(), "Certificate Installer".into());
                } else if event.id() == "tools-tag" {
                    open_new_window(app_handle.clone(), "tag".into(), "Tag Tools".into());
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
            
            #[cfg(debug_assertions)]
            println!("DB PATH: {}", db_path.display());
            
            let traffic_db = Arc::new(TrafficDb::new(db_path).expect("Failed to initialize database"));
            app_handle.manage(Arc::clone(&traffic_db));

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

            let mut proxy = Proxy::new(key_pair, ca_cert, 9090);

            use std::sync::Mutex;
            use std::time::Instant;
            
            struct MyTrafficListener {
                app_handle: AppHandle,
                traffic_db: Arc<TrafficDb>,
                request_times: Mutex<HashMap<u64, Instant>>,
            }

            impl TrafficListener for MyTrafficListener {
                fn request(&self, id: u64, request: Request<Bytes>, intercepted: bool, client_addr: String) {
                    self.request_times.lock().unwrap().insert(id, Instant::now());
                    
                    let uri = request.uri().to_string();
                    let http_version = match request.version() {
                        Version::HTTP_10 => "HTTP/1.0".to_string(),
                        Version::HTTP_11 => "HTTP/1.1".to_string(),
                        Version::HTTP_2 => "HTTP/2".to_string(),
                        Version::HTTP_3 => "HTTP/3".to_string(),
                        _ => "Unknown".to_string(),
                    };

                    let method = request.method().as_str().to_string();

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

                    self.traffic_db.insert_request(TrafficEvent::Request {
                        id: id.to_string(),
                        uri: uri.clone(),
                        method: method.clone(),
                        version: http_version.clone(),
                        headers: headers.clone(),
                        body: decompressed_body,
                        content_type,
                        content_encoding,
                        intercepted,
                        client: client_info.clone(),
                    });

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
                            },
                        },
                    );
                }

                fn response(&self, id: u64, response: Response<Bytes>, intercepted: bool, client_addr: String) {
                    let start_time = self.request_times.lock().unwrap().remove(&id);
                    let duration = start_time.map(|t| t.elapsed().as_millis()).unwrap_or(0);
                    
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
                        body: decompressed_body,
                        content_type,
                        content_encoding,
                        status_code,
                    });

                    let client_name = traffic::process_info::get_app_name(&client_addr);
                    let client_info = format!("{} ({})", client_name, client_addr);

                    let mut headers_with_perf = headers;
                    headers_with_perf.insert("x-latency-ms".to_string(), duration.to_string());

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
                            },
                        },
                    );
                }
            }

            let listener = Arc::new(MyTrafficListener {
                app_handle: app_handle.clone(),
                traffic_db: Arc::clone(&traffic_db),
                request_times: Mutex::new(HashMap::new()),
            });

            tauri::async_runtime::spawn(async move {
                proxy.run_proxy(listener, allow_list).await;
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
