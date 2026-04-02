// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod ca_manager;
mod certificate_installer;
pub mod eval;
pub mod proxy_toggle;
pub mod commands;
pub mod proxy_handler;
pub mod breakpoints;
pub mod scripting;
pub mod settings;
// pub mod submenu;
pub mod traffic;

pub use breakpoints::*;
pub use scripting::*;
pub use settings::*;


use bytes::Bytes;
use boa_engine::{Context, Source};
use certificate_installer::CertificateInstaller;
use eval::{matches_breakpoint, run_script};
use hyper::{Request, Response, Version};
use network_spy_proxy::{proxy::Proxy, traffic::TrafficListener};
use tauri::menu::{Menu, MenuItem, MenuEvent, MenuBuilder, MenuItemBuilder, SubmenuBuilder, Submenu};
use async_trait::async_trait;
use once_cell::sync::OnceCell;
use proxy_toggle::ProxyToggle;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::fs;
use std::sync::{Arc, Mutex};
use std::sync::atomic::AtomicBool;
use proxy_handler::MyTrafficListener;
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


use commands::*;

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
            let _quit_item = MenuItemBuilder::with_id("quit-app", "Quit network-spy").accelerator("Cmd+Q").build(app)?;

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

            let script_manager = Arc::new(ScriptManager::new());
            app_handle.manage(Arc::clone(&script_manager));

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
            let script_manager_outer = Arc::clone(&script_manager);

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
                            script_manager: script_manager_outer.clone(),
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
                    "scripting" => {
                        let _ = open_new_window_internal(&app_handle_menu, "scripting".to_string(), "Custom Scripting".to_string());
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
            commands::greet,
            commands::turn_on_proxy,
            commands::turn_off_proxy,
            commands::install_certificate,
            commands::auto_install_certificate,
            commands::uninstall_certificate,
            commands::open_new_window,
            get_request_pair_data,
            get_response_pair_data,
            commands::update_intercept_allow_list,
            commands::get_recent_traffic,
            commands::get_all_metadata,
            commands::get_proxy_settings,
            commands::update_proxy_settings,
            commands::save_session,
            commands::load_session,
            commands::get_filter_presets,
            commands::add_filter_preset,
            commands::update_filter_preset,
            commands::delete_filter_preset,
            commands::export_selected_to_har,
            commands::export_selected_to_csv,
            commands::export_selected_to_sqlite,
            commands::change_proxy_port,
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
            commands::set_breakpoint_enabled,
            commands::get_breakpoint_enabled,
            commands::resume_breakpoint,
            commands::get_paused_breakpoints,
            commands::get_breakpoints,
            commands::save_breakpoint,
            commands::delete_breakpoint,
            commands::get_paused_data,
            commands::get_app_data_dir,
            commands::get_scripts,
            commands::save_script,
            commands::delete_script,
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
        .item(&MenuItemBuilder::with_id("scripting", "Custom Scripting").build(manager)?)
        .build()
}
