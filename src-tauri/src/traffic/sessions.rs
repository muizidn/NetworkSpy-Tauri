use tauri::Manager;
use rusqlite::{params, Connection};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use serde::{Serialize, Deserialize};
use std::fs;
use uuid::Uuid;
use chrono::Local;

#[derive(Serialize, Deserialize, Clone)]
pub struct Session {
    pub id: String,
    pub name: String,
    pub folder_id: Option<String>,
    pub created_at: String,
    pub db_file: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct SessionFolder {
    pub id: String,
    pub name: String,
}

pub struct SessionManager {
    db: Arc<Mutex<Connection>>,
    sessions_dir: PathBuf,
}

impl SessionManager {
    pub fn new(app_data_dir: PathBuf) -> Self {
        let sessions_dir = app_data_dir.join("sessions");
        if !sessions_dir.exists() {
            fs::create_dir_all(&sessions_dir).expect("Failed to create sessions directory");
        }

        let db_path = app_data_dir.join("sessions_meta.db");
        let conn = Connection::open(db_path).expect("Failed to open sessions metadata DB");

        conn.execute(
            "CREATE TABLE IF NOT EXISTS session_folders (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE
            )",
            [],
        ).unwrap();

        conn.execute(
            "CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                folder_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                db_file TEXT NOT NULL,
                FOREIGN KEY(folder_id) REFERENCES session_folders(id) ON DELETE SET NULL
            )",
            [],
        ).unwrap();

        Self {
            db: Arc::new(Mutex::new(conn)),
            sessions_dir,
        }
    }

    pub fn get_sessions(&self) -> rusqlite::Result<Vec<Session>> {
        let conn = self.db.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, name, folder_id, created_at, db_file FROM sessions ORDER BY created_at DESC")?;
        let rows = stmt.query_map([], |row| {
            Ok(Session {
                id: row.get(0)?,
                name: row.get(1)?,
                folder_id: row.get(2)?,
                created_at: row.get(3)?,
                db_file: row.get(4)?,
            })
        })?;

        let mut sessions = Vec::new();
        for row in rows {
            sessions.push(row?);
        }
        Ok(sessions)
    }

    pub fn get_folders(&self) -> rusqlite::Result<Vec<SessionFolder>> {
        let conn = self.db.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, name FROM session_folders ORDER BY name ASC")?;
        let rows = stmt.query_map([], |row| {
            Ok(SessionFolder {
                id: row.get(0)?,
                name: row.get(1)?,
            })
        })?;

        let mut folders = Vec::new();
        for row in rows {
            folders.push(row?);
        }
        Ok(folders)
    }

    pub fn save_capture(&self, name: String, live_db_path: PathBuf) -> rusqlite::Result<Session> {
        let id = Uuid::new_v4().to_string();
        let db_file_name = format!("{}.db", id);
        let dest_path = self.sessions_dir.join(&db_file_name);
        
        // Copy the live DB file
        fs::copy(&live_db_path, &dest_path).map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;

        let created_at = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        let conn = self.db.lock().unwrap();
        conn.execute(
            "INSERT INTO sessions (id, name, created_at, db_file) VALUES (?1, ?2, ?3, ?4)",
            params![id, name, created_at, db_file_name],
        )?;

        Ok(Session {
            id,
            name,
            folder_id: None,
            created_at,
            db_file: db_file_name,
        })
    }

    pub fn import_har(&self, name: String, har_path: PathBuf) -> Result<Session, String> {
        let id = Uuid::new_v4().to_string();
        let db_file_name = format!("{}.db", id);
        let dest_path = self.sessions_dir.join(&db_file_name);

        // Create a new empty TrafficDb
        let db = crate::traffic::db::TrafficDb::new(dest_path).map_err(|e| e.to_string())?;
        
        // Read and parse HAR
        let json = fs::read_to_string(har_path).map_err(|e| e.to_string())?;
        let har: crate::traffic::har_util::HarLog = serde_json::from_str(&json).map_err(|e| e.to_string())?;

        use crate::traffic::db::TrafficEvent;
        use std::collections::HashMap;
        use base64::{Engine as _, engine::general_purpose};

        for (i, entry) in har.log.entries.into_iter().enumerate() {
            let timestamp = entry.started_date_time.clone();
            let entry_id = format!("har_{}_{}", timestamp, i);
            
            // Request
            let mut req_headers = HashMap::new();
            for h in entry.request.headers {
                req_headers.insert(h.name.clone(), h.value);
            }

            let req_body = if let Some(post) = entry.request.post_data {
                post.text.into_bytes()
            } else {
                vec![]
            };

            db.insert_request(TrafficEvent::Request {
                id: entry_id.clone(),
                uri: entry.request.url.clone(),
                method: entry.request.method.clone(),
                version: entry.request.http_version.clone(),
                headers: req_headers.clone(),
                body: req_body,
                content_type: req_headers.get("content-type").or_else(|| req_headers.get("Content-Type")).cloned(),
                content_encoding: req_headers.get("content-encoding").or_else(|| req_headers.get("Content-Encoding")).cloned(),
                intercepted: true,
                client: "HAR Import".to_string(),
                tags: vec![],
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

            db.insert_response(TrafficEvent::Response {
                id: entry_id,
                headers: res_headers.clone(),
                body: res_body,
                content_type: res_headers.get("content-type").or_else(|| res_headers.get("Content-Type")).cloned(),
                content_encoding: res_headers.get("content-encoding").or_else(|| res_headers.get("Content-Encoding")).cloned(),
                status_code: entry.response.status,
            });
        }

        // Wait a bit for background writer to flush
        std::thread::sleep(std::time::Duration::from_millis(500));
        db.shutdown();

        let created_at = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        let conn = self.db.lock().unwrap();
        conn.execute(
            "INSERT INTO sessions (id, name, created_at, db_file) VALUES (?1, ?2, ?3, ?4)",
            params![id, name, created_at, db_file_name],
        ).map_err(|e| e.to_string())?;

        Ok(Session {
            id,
            name,
            folder_id: None,
            created_at,
            db_file: db_file_name,
        })
    }

    pub fn add_folder(&self, name: String) -> rusqlite::Result<SessionFolder> {
        let id = Uuid::new_v4().to_string();
        let conn = self.db.lock().unwrap();
        conn.execute(
            "INSERT INTO session_folders (id, name) VALUES (?1, ?2)",
            params![id, name],
        )?;
        Ok(SessionFolder { id, name })
    }

    pub fn delete_folder(&self, id: String) -> rusqlite::Result<()> {
        let conn = self.db.lock().unwrap();
        conn.execute("DELETE FROM session_folders WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn rename_folder(&self, id: String, new_name: String) -> rusqlite::Result<()> {
        let conn = self.db.lock().unwrap();
        conn.execute("UPDATE session_folders SET name = ?1 WHERE id = ?2", params![new_name, id])?;
        Ok(())
    }

    pub fn move_session(&self, id: String, folder_id: Option<String>) -> rusqlite::Result<()> {
        let conn = self.db.lock().unwrap();
        conn.execute("UPDATE sessions SET folder_id = ?1 WHERE id = ?2", params![folder_id, id])?;
        Ok(())
    }

    pub fn delete_session(&self, id: String) -> rusqlite::Result<()> {
        let conn = self.db.lock().unwrap();
        
        // Get DB file name first
        let db_file: String = conn.query_row("SELECT db_file FROM sessions WHERE id = ?1", params![id], |row| row.get(0))?;
        
        // Delete from DB
        conn.execute("DELETE FROM sessions WHERE id = ?1", params![id])?;
        
        // Delete the physical file
        let file_path = self.sessions_dir.join(db_file);
        if file_path.exists() {
            let _ = fs::remove_file(file_path);
        }
        
        Ok(())
    }

    pub fn get_session_db_path(&self, id: String) -> rusqlite::Result<PathBuf> {
        let conn = self.db.lock().unwrap();
        let db_file: String = conn.query_row("SELECT db_file FROM sessions WHERE id = ?1", params![id], |row| row.get(0))?;
        Ok(self.sessions_dir.join(db_file))
    }
}

// Tauri Commands

#[tauri::command]
pub async fn get_saved_sessions(manager: tauri::State<'_, Arc<SessionManager>>) -> Result<Vec<Session>, String> {
    manager.get_sessions().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_session_folders(manager: tauri::State<'_, Arc<SessionManager>>) -> Result<Vec<SessionFolder>, String> {
    manager.get_folders().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_session_folder(manager: tauri::State<'_, Arc<SessionManager>>, name: String) -> Result<SessionFolder, String> {
    manager.add_folder(name).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_session_folder(manager: tauri::State<'_, Arc<SessionManager>>, id: String) -> Result<(), String> {
    manager.delete_folder(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn rename_session_folder(manager: tauri::State<'_, Arc<SessionManager>>, id: String, new_name: String) -> Result<(), String> {
    manager.rename_folder(id, new_name).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn move_session_to_folder(manager: tauri::State<'_, Arc<SessionManager>>, id: String, folder_id: Option<String>) -> Result<(), String> {
    manager.move_session(id, folder_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_saved_session(manager: tauri::State<'_, Arc<SessionManager>>, id: String) -> Result<(), String> {
    manager.delete_session(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_current_capture(
    manager: tauri::State<'_, Arc<SessionManager>>,
    name: String,
    app_handle: tauri::AppHandle,
) -> Result<Session, String> {
    let app_data_dir = app_handle.path().app_data_dir().unwrap();
    let live_db_path = app_data_dir.join("traffic.db");
    manager.save_capture(name, live_db_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn import_session_from_har(
    manager: tauri::State<'_, Arc<SessionManager>>,
    name: String,
    path: String,
) -> Result<Session, String> {
    manager.import_har(name, PathBuf::from(path)).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_session_traffic(
    manager: tauri::State<'_, Arc<SessionManager>>,
    id: String,
) -> Result<Vec<crate::traffic::db::TrafficMetadata>, String> {
    let db_path = manager.get_session_db_path(id).map_err(|e| e.to_string())?;
    let db = crate::traffic::db::TrafficDb::new_readonly(db_path).map_err(|e| e.to_string())?;
    Ok(db.get_recent_traffic(100000)) 
}

#[tauri::command]
pub async fn export_session_data(
    manager: tauri::State<'_, Arc<SessionManager>>,
    id: String,
    format: String,
    path: String,
) -> Result<(), String> {
    let db_path = manager.get_session_db_path(id).map_err(|e| e.to_string())?;
    let db = crate::traffic::db::TrafficDb::new_readonly(db_path).map_err(|e| e.to_string())?;
    let data = db.get_all_traffic_with_bodies().map_err(|e: rusqlite::Error| e.to_string())?;

    match format.as_str() {
        "har" => {
            let har = crate::traffic::har_util::create_har_log(data);
            let json = serde_json::to_string_pretty(&har).map_err(|e| e.to_string())?;
            fs::write(path, json).map_err(|e| e.to_string())?;
        }
        "csv" => {
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
                    crate::traffic::db::body_to_string(&req_body, &req_ct).replace('\"', "\"\""),
                    crate::traffic::db::body_to_string(&res_body, &res_ct).replace('\"', "\"\"")
                );
                csv_content.push_str(&line);
            }
            fs::write(path, csv_content).map_err(|e| e.to_string())?;
        }
        "sqlite" => {
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
                    
                    let req_text = if crate::traffic::db::is_text_content_type(&req_ct) { Some(crate::traffic::db::body_to_string(&req_body, &req_ct)) } else { None };
                    let res_text = if crate::traffic::db::is_text_content_type(&res_ct) { Some(crate::traffic::db::body_to_string(&res_body, &res_ct)) } else { None };

                    ins_body.execute(params![
                        meta.id, req_body, res_body, req_text, res_text, req_ct, res_ct
                    ]).map_err(|e| e.to_string())?;
                }
            }
        }
        _ => return Err("Unsupported format".to_string()),
    }
    Ok(())
}
