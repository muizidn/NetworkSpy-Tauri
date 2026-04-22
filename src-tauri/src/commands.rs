use crate::*;
use tauri::{AppHandle, Manager, Emitter};
use std::sync::Arc;
use std::collections::HashMap;
use crate::traffic::db::{TrafficDb, TrafficEvent};
use crate::traffic::har_util::{create_har_log, HarLog};
use base64::{Engine as _, engine::general_purpose};
use std::fs;
use rusqlite::params;
use std::sync::atomic::Ordering;

#[tauri::command]
pub async fn get_proxy_settings(state: tauri::State<'_, ManagedProxySettings>) -> Result<ProxySettings, String> {
    let settings = state.0.read().map_err(|e| e.to_string())?;
    Ok(settings.clone())
}

#[tauri::command]
pub async fn update_proxy_settings(
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
pub async fn update_intercept_allow_list(
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
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
pub async fn set_breakpoint_enabled(state: tauri::State<'_, Arc<BreakpointManager>>, enabled: bool) -> Result<(), String> {
    state.is_enabled.store(enabled, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
pub async fn get_breakpoint_enabled(state: tauri::State<'_, Arc<BreakpointManager>>) -> Result<bool, String> {
    Ok(state.is_enabled.load(Ordering::SeqCst))
}

#[tauri::command]
pub async fn set_script_enabled(state: tauri::State<'_, Arc<ScriptManager>>, enabled: bool) -> Result<(), String> {
    state.is_enabled.store(enabled, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
pub async fn get_script_enabled(state: tauri::State<'_, Arc<ScriptManager>>) -> Result<bool, String> {
    Ok(state.is_enabled.load(Ordering::SeqCst))
}

#[tauri::command]
pub async fn resume_breakpoint(
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
pub async fn get_paused_data(
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
pub async fn get_paused_breakpoints(state: tauri::State<'_, Arc<BreakpointManager>>) -> Result<Vec<BreakpointHit>, String> {
    let tasks = state.paused_tasks.read().await;
    Ok(tasks.iter().map(|(id, task)| BreakpointHit { 
        id: id.clone(), 
        name: task.name.clone() 
    }).collect())
}

#[tauri::command]
pub fn get_breakpoints(db: tauri::State<'_, Arc<TrafficDb>>) -> Result<Vec<traffic::db::BreakpointRule>, String> {
    db.get_breakpoints().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_breakpoint(rule: traffic::db::BreakpointRule, db: tauri::State<'_, Arc<TrafficDb>>) -> Result<(), String> {
    db.save_breakpoint(rule).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_breakpoint(id: String, db: tauri::State<'_, Arc<TrafficDb>>) -> Result<(), String> {
    db.delete_breakpoint(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_scripts(db: tauri::State<'_, Arc<TrafficDb>>) -> Result<Vec<traffic::db::ScriptRule>, String> {
    db.get_scripts().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_script(rule: traffic::db::ScriptRule, db: tauri::State<'_, Arc<TrafficDb>>) -> Result<(), String> {
    db.save_script(rule).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_script(id: String, db: tauri::State<'_, Arc<TrafficDb>>) -> Result<(), String> {
    db.delete_script(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_proxy_rules(db: tauri::State<'_, Arc<TrafficDb>>) -> Result<Vec<traffic::db::ProxyRule>, String> {
    db.get_proxy_rules().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_proxy_rule(
    rule: traffic::db::ProxyRule, 
    db: tauri::State<'_, Arc<TrafficDb>>,
    state: tauri::State<'_, InterceptAllowList>
) -> Result<(), String> {
    db.save_proxy_rule(rule).map_err(|e| e.to_string())?;
    refresh_active_allow_list(&state, &db).await?;
    Ok(())
}

#[tauri::command]
pub async fn delete_proxy_rule(
    id: String, 
    db: tauri::State<'_, Arc<TrafficDb>>,
    state: tauri::State<'_, InterceptAllowList>
) -> Result<(), String> {
    db.delete_proxy_rule(id).map_err(|e| e.to_string())?;
    refresh_active_allow_list(&state, &db).await?;
    Ok(())
}

async fn refresh_active_allow_list(
    state: &InterceptAllowList,
    db: &TrafficDb,
) -> Result<(), String> {
    let rules = db.get_proxy_rules().map_err(|e| e.to_string())?;
    let mut new_list = Vec::new();
    for rule in rules {
        if rule.enabled && rule.action == "INTERCEPT" {
            new_list.push(rule.pattern);
        }
    }
    let mut list = state.0.write().await;
    *list = new_list;
    Ok(())
}

pub static PROXY_TOGGLE: OnceCell<ProxyToggle> = OnceCell::new();
pub static CERTIFICATE_INSTALLER: OnceCell<CertificateInstaller> = OnceCell::new();

#[tauri::command]
pub fn turn_on_proxy() -> u16 {
    let port = ACTUAL_PORT.load(Ordering::SeqCst);
    PROXY_TOGGLE.get().unwrap().turn_on(port as u64);
    port
}

#[tauri::command]
pub fn turn_off_proxy() {
    PROXY_TOGGLE.get().unwrap().turn_off();
}

#[tauri::command]
pub fn change_proxy_port(port: u16) -> u16 {
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
pub fn get_app_data_dir() -> std::path::PathBuf {
    use std::env;
    let home = env::var("HOME").or_else(|_| env::var("USERPROFILE")).unwrap_or_else(|_| ".".to_string());
    std::path::PathBuf::from(home).join(".network-spy")
}

#[tauri::command]
pub fn install_certificate(app: tauri::AppHandle, state: tauri::State<'_, ManagedProxySettings>, cert_path: String) -> Result<String, String> {
    println!("INSTALL CERTIFICATE");
    let stream_logs = state.0.read()
        .map(|s| s.stream_certificate_logs)
        .unwrap_or(false);
    CERTIFICATE_INSTALLER.get().unwrap().install(Some(app), stream_logs, cert_path)
}

#[tauri::command]
pub fn auto_install_certificate(app: tauri::AppHandle, state: tauri::State<'_, ManagedProxySettings>) -> Result<String, String> {
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
pub fn uninstall_certificate(app: tauri::AppHandle, state: tauri::State<'_, ManagedProxySettings>) -> Result<String, String> {
    let stream_logs = state.0.read()
        .map(|s| s.stream_certificate_logs)
        .unwrap_or(false);
    CERTIFICATE_INSTALLER.get().unwrap().uninstall(Some(app), stream_logs)
}

pub fn open_new_window_internal(app_handle: &tauri::AppHandle, context: String, title: String) {
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
pub fn open_new_window(app_handle: tauri::AppHandle, context: String, title: String) {
    open_new_window_internal(&app_handle, context, title);
}

#[tauri::command]
pub fn get_recent_traffic(
    db: tauri::State<'_, Arc<TrafficDb>>,
    limit: usize,
) -> Vec<traffic::db::TrafficMetadata> {
    db.get_recent_traffic(limit)
}

#[tauri::command]
pub fn get_all_metadata(
    db: tauri::State<'_, Arc<TrafficDb>>,
    limit: Option<usize>,
) -> Vec<traffic::db::TrafficMetadata> {
    db.get_all_metadata(limit.unwrap_or(10)).unwrap_or_default()
}

#[tauri::command]
pub fn get_filter_presets(db: tauri::State<'_, Arc<TrafficDb>>) -> Result<Vec<traffic::db::FilterPreset>, String> {
    db.get_filter_presets().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_filter_preset(preset: traffic::db::FilterPreset, db: tauri::State<'_, Arc<TrafficDb>>) -> Result<(), String> {
    db.add_filter_preset(preset).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_filter_preset(
    id: String, 
    name: Option<String>, 
    description: Option<String>, 
    filters: Option<String>, 
    db: tauri::State<'_, Arc<TrafficDb>>
) -> Result<(), String> {
    db.update_filter_preset(id, name, description, filters).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_filter_preset(id: String, db: tauri::State<'_, Arc<TrafficDb>>) -> Result<(), String> {
    db.delete_filter_preset(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_session(path: String, db: tauri::State<'_, Arc<TrafficDb>>) -> Result<(), String> {
    let data = db.get_all_traffic_with_bodies().map_err(|e: rusqlite::Error| e.to_string())?;
    let har = create_har_log(data);
    let json = serde_json::to_string_pretty(&har).map_err(|e: serde_json::Error| e.to_string())?;
    fs::write(path, json).map_err(|e: std::io::Error| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn export_selected_to_har(path: String, ids: Vec<String>, db: tauri::State<'_, Arc<TrafficDb>>) -> Result<(), String> {
    let data = db.get_traffic_with_bodies_by_ids(ids).map_err(|e: rusqlite::Error| e.to_string())?;
    let har = create_har_log(data);
    let json = serde_json::to_string_pretty(&har).map_err(|e: serde_json::Error| e.to_string())?;
    fs::write(path, json).map_err(|e: std::io::Error| e.to_string())?;
    Ok(())
}

pub fn handle_tray_menu_event(app: &AppHandle, event: tauri::menu::MenuEvent) {
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
pub async fn export_selected_to_csv(path: String, ids: Vec<String>, db: tauri::State<'_, Arc<TrafficDb>>) -> Result<(), String> {
    let data = db.get_traffic_with_bodies_by_ids(ids).map_err(|e: rusqlite::Error| e.to_string())?;
    let mut csv_content = String::from("ID,Timestamp,Method,URI,Status,Client,RequestBody,ResponseBody\n");
    
    for (meta, req_body, res_body, req_ct, _, res_ct, _) in data {
        let uri = meta.uri.unwrap_or_default().replace('\"', "\"\"");
        let client = meta.client.unwrap_or_default().replace('\"', "\"\"");
        let req_s = body_to_string(&req_body, &req_ct).replace('\"', "\"\"");
        let res_s = body_to_string(&res_body, &res_ct).replace('\"', "\"\"");
        
        let line = format!(
            "{},\"{}\",{},\"{}\",{},\"{}\",\"{}\",\"{}\"\n",
            meta.id,
            meta.timestamp,
            meta.method.unwrap_or_default(),
            uri,
            meta.status_code.unwrap_or(0),
            client,
            req_s,
            res_s
        );
        csv_content.push_str(&line);
    }
    
    fs::write(path, csv_content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn export_selected_to_sqlite(path: String, ids: Vec<String>, db: tauri::State<'_, Arc<TrafficDb>>) -> Result<(), String> {
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
pub async fn load_session(path: String, db: tauri::State<'_, Arc<TrafficDb>>, app_handle: AppHandle) -> Result<(), String> {
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

#[tauri::command]
pub fn validate_filter_preset_command(preset: serde_json::Value) -> Result<(), String> {
    crate::mcp::validator::validate_filter_preset(&preset)
}
