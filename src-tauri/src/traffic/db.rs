use rusqlite::{params, Connection};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use serde_json;
use std::collections::{HashMap, VecDeque};
use crossbeam_channel::{unbounded, Sender};
use std::thread;
use std::time::{Duration, Instant};
use zstd;
use std::sync::RwLock;
use chrono;

pub enum TrafficEvent {
    Request {
        id: String,
        uri: String,
        method: String,
        version: String,
        headers: HashMap<String, String>,
        body: Vec<u8>,
        content_type: Option<String>,
        content_encoding: Option<String>,
        intercepted: bool,
        client: String,
        tags: Vec<String>,
    },
    Response {
        id: String,
        headers: HashMap<String, String>,
        body: Vec<u8>,
        content_type: Option<String>,
        content_encoding: Option<String>,
        status_code: u16,
    },
    UpdateTags {
        id: String,
        tags: Vec<String>,
    },
    Exit,
}

pub struct TrafficDb {
    conn: Arc<Mutex<Connection>>,
    tx: Sender<TrafficEvent>,
    recent_traffic: Arc<RwLock<VecDeque<TrafficMetadata>>>,
}

impl TrafficDb {
    pub fn new_readonly(db_path: PathBuf) -> rusqlite::Result<Self> {
        let conn = Connection::open_with_flags(&db_path, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY)?;
        let (tx, _) = unbounded::<TrafficEvent>();
        let recent_traffic = Arc::new(RwLock::new(VecDeque::new()));
        
        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
            tx,
            recent_traffic,
        })
    }

    pub fn new(db_path: PathBuf) -> rusqlite::Result<Self> {
        let conn = Connection::open(&db_path)?;
        
        // Phase 1: SQLite Performance Foundation
        conn.execute_batch(
            "PRAGMA journal_mode=WAL;
             PRAGMA synchronous=NORMAL;
             PRAGMA temp_store=MEMORY;
             PRAGMA cache_size=100000;
             PRAGMA mmap_size=30000000000;"
        )?;

        crate::traffic::schema::init_all_tables(&conn)?;

        let (tx, rx) = unbounded::<TrafficEvent>();
        let recent_traffic = Arc::new(RwLock::new(VecDeque::with_capacity(10000)));
        
        // Spawn Background Writer Thread (Phase 2 & 3)
        let db_path_clone = db_path.clone();
        let recent_traffic_clone = Arc::clone(&recent_traffic);
        thread::spawn(move || {
            let mut conn = Connection::open(db_path_clone).expect("Background DB connection failed");
            
            // Re-apply pragmas to writer connection
            let _ = conn.execute_batch(
                "PRAGMA journal_mode=WAL;
                 PRAGMA synchronous=NORMAL;
                 PRAGMA temp_store=MEMORY;"
            );

            let mut buffer = Vec::with_capacity(200);
            let mut last_flush = Instant::now();

            loop {
                // Wait for an event with a timeout for flush interval
                match rx.recv_timeout(Duration::from_millis(100)) {
                    Ok(event) => {
                        if matches!(event, TrafficEvent::Exit) {
                            flush_buffer(&mut conn, &mut buffer);
                            break;
                        }
                        // Task 4.2: Push to memory cache
                        update_memory_cache(&recent_traffic_clone, &event);
                        
                        buffer.push(event);
                        if buffer.len() >= 200 {
                            flush_buffer(&mut conn, &mut buffer);
                            last_flush = Instant::now();
                        }
                    }
                    Err(_) => {
                        if !buffer.is_empty() && last_flush.elapsed() >= Duration::from_millis(100) {
                            flush_buffer(&mut conn, &mut buffer);
                            last_flush = Instant::now();
                        }
                    }
                }
            }
        });

        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
            tx,
            recent_traffic,
        })
    }

    pub fn shutdown(&self) {
        let _ = self.tx.send(TrafficEvent::Exit);
    }

    pub fn get_connection(&self) -> std::sync::MutexGuard<'_, Connection> {
        self.conn.lock().unwrap()
    }

    pub fn insert_request(&self, event: TrafficEvent) {
        let _ = self.tx.send(event);
    }

    pub fn insert_response(&self, event: TrafficEvent) {
        let _ = self.tx.send(event);
    }

    pub fn update_tags(&self, id: String, tags: Vec<String>) {
        let _ = self.tx.send(TrafficEvent::UpdateTags { id, tags });
    }

    pub fn get_traffic_metadata(&self, id: String) -> rusqlite::Result<Option<TrafficMetadata>> {
        crate::traffic::schema::traffic::get_traffic_metadata(&self.conn.lock().unwrap(), id)
    }

    pub fn get_request_data(&self, id: &str) -> Option<RequestResponseData> {
        let meta = self.get_traffic_metadata(id.to_string()).ok()??;
        let (body, content_type, content_encoding) = self.get_request_body_info(id.to_string()).ok()??;
        
        let headers: HashMap<String, String> = serde_json::from_str(meta.req_headers.as_deref().unwrap_or("{}")).unwrap_or_default();
        
        Some(RequestResponseData {
            headers,
            body,
            content_type: content_type.unwrap_or_else(|| "text/plain".to_string()),
            content_encoding,
            status_code: None,
        })
    }

    pub fn get_response_data(&self, id: &str) -> Option<RequestResponseData> {
        let meta = self.get_traffic_metadata(id.to_string()).ok()??;
        let (body, content_type, content_encoding) = self.get_response_body_info(id.to_string()).ok()??;
        
        let headers: HashMap<String, String> = serde_json::from_str(meta.res_headers.as_deref().unwrap_or("{}")).unwrap_or_default();
        
        Some(RequestResponseData {
            headers,
            body,
            content_type: content_type.unwrap_or_else(|| "text/plain".to_string()),
            content_encoding,
            status_code: meta.status_code,
        })
    }

    pub fn get_request_body_info(&self, id: String) -> rusqlite::Result<Option<(Vec<u8>, Option<String>, Option<String>)>> {
        crate::traffic::schema::traffic::get_request_body_info(&self.conn.lock().unwrap(), id)
    }

    pub fn get_request_body(&self, id: String) -> rusqlite::Result<Option<Vec<u8>>> {
        self.get_request_body_info(id).map(|opt| opt.map(|(b, _, _)| b))
    }

    pub fn get_response_body_info(&self, id: String) -> rusqlite::Result<Option<(Vec<u8>, Option<String>, Option<String>)>> {
        crate::traffic::schema::traffic::get_response_body_info(&self.conn.lock().unwrap(), id)
    }

    pub fn get_response_body(&self, id: String) -> rusqlite::Result<Option<Vec<u8>>> {
        self.get_response_body_info(id).map(|opt| opt.map(|(b, _, _)| b))
    }

    pub fn get_recent_traffic(&self, limit: usize) -> Vec<TrafficMetadata> {
        let recent = self.recent_traffic.read().unwrap();
        if !recent.is_empty() {
            return recent.iter().take(limit).cloned().collect();
        }
        // If cache is empty (e.g. readonly session), fallback to DB
        self.get_all_metadata(limit).unwrap_or_default()
    }

    pub fn get_all_metadata(&self, limit: usize) -> rusqlite::Result<Vec<TrafficMetadata>> {
        crate::traffic::schema::traffic::get_all_metadata(&self.conn.lock().unwrap(), limit)
    }

    pub fn get_allow_list(&self) -> rusqlite::Result<Vec<String>> {
        crate::traffic::schema::traffic::get_allow_list(&self.conn.lock().unwrap())
    }

    pub fn add_to_allow_list(&self, domain: String) -> rusqlite::Result<()> {
        crate::traffic::schema::traffic::add_to_allow_list(&self.conn.lock().unwrap(), domain)
    }

    pub fn get_all_traffic_with_bodies(&self) -> rusqlite::Result<Vec<(TrafficMetadata, Option<Vec<u8>>, Option<Vec<u8>>, Option<String>, Option<String>, Option<String>, Option<String>)>> {
        crate::traffic::schema::traffic::get_all_traffic_with_bodies(&self.conn.lock().unwrap())
    }

    pub fn get_traffic_with_bodies_by_ids(&self, ids: Vec<String>) -> rusqlite::Result<Vec<(TrafficMetadata, Option<Vec<u8>>, Option<Vec<u8>>, Option<String>, Option<String>, Option<String>, Option<String>)>> {
        crate::traffic::schema::traffic::get_traffic_with_bodies_by_ids(&self.conn.lock().unwrap(), ids)
    }

    pub fn clear_all(&self) -> rusqlite::Result<()> {
        crate::traffic::schema::traffic::clear_all(&self.conn.lock().unwrap())?;
        let mut recent = self.recent_traffic.write().unwrap();
        recent.clear();
        Ok(())
    }
}

pub fn is_text_content_type(content_type: &Option<String>) -> bool {
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
        None => false
    }
}

pub fn body_to_string(body: &Option<Vec<u8>>, content_type: &Option<String>) -> String {
    if let Some(bytes) = body {
        if bytes.is_empty() { return String::new(); }
        if is_text_content_type(content_type) {
            String::from_utf8_lossy(bytes).into_owned()
        } else {
            format!("<Binary Data: {} bytes>", bytes.len())
        }
    } else {
        String::new()
    }
}

fn flush_buffer(conn: &mut Connection, buffer: &mut Vec<TrafficEvent>) {
    let tx = match conn.transaction() {
        Ok(t) => t,
        Err(_) => return,
    };

    {
        let mut insert_traffic = tx.prepare_cached(
            "INSERT INTO traffic (id, uri, method, version, req_headers, intercepted, client, tags) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8) 
             ON CONFLICT(id) DO UPDATE SET 
                uri = excluded.uri, 
                method = excluded.method, 
                version = excluded.version, 
                req_headers = excluded.req_headers, 
                intercepted = excluded.intercepted, 
                client = excluded.client, 
                tags = excluded.tags"
        ).expect("Failed to prepare insert_traffic");

        let mut insert_body = tx.prepare_cached(
            "INSERT INTO body (traffic_id, req_body, req_content_type, req_content_encoding) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(traffic_id) DO UPDATE SET req_body = excluded.req_body, req_content_type = excluded.req_content_type, req_content_encoding = excluded.req_content_encoding"
        ).expect("Failed to prepare insert_body");

        let mut update_response = tx.prepare_cached(
            "UPDATE traffic SET res_headers = ?2, status_code = ?3 WHERE id = ?1"
        ).expect("Failed to prepare update_response");

        let mut update_res_body = tx.prepare_cached(
            "UPDATE body SET res_body = ?2, res_content_type = ?3, res_content_encoding = ?4 WHERE traffic_id = ?1"
        ).expect("Failed to prepare update_res_body");

        let mut update_tags = tx.prepare_cached(
            "UPDATE traffic SET tags = ?2 WHERE id = ?1"
        ).expect("Failed to prepare update_tags");

        for event in buffer.drain(..) {
            match event {
                TrafficEvent::Request { id, uri, method, version, headers, body, content_type, content_encoding, intercepted, client, tags } => {
                    let headers_json = serde_json::to_string(&headers).unwrap_or_default();
                    let tags_json = serde_json::to_string(&tags).unwrap_or_default();
                    let _ = insert_traffic.execute(params![
                        id, uri, method, version, headers_json, if intercepted { 1 } else { 0 }, client, tags_json
                    ]);
                    
                    let body_data = if !body.is_empty() {
                        match zstd::encode_all(&body[..], 3) {
                            Ok(compressed) => {
                                let mut final_data = b"ZSTD".to_vec();
                                final_data.extend_from_slice(&compressed);
                                Some(final_data)
                            }
                            Err(_) => Some(body),
                        }
                    } else {
                        None
                    };

                    let _ = insert_body.execute(params![id, body_data, content_type, content_encoding]);
                }
                TrafficEvent::Response { id, headers, body, content_type, content_encoding, status_code } => {
                    let headers_json = serde_json::to_string(&headers).unwrap_or_default();
                    let _ = update_response.execute(params![id, headers_json, status_code]);
                    
                    let body_data = if !body.is_empty() {
                         match zstd::encode_all(&body[..], 3) {
                            Ok(compressed) => {
                                let mut final_data = b"ZSTD".to_vec();
                                final_data.extend_from_slice(&compressed);
                                Some(final_data)
                            }
                            Err(_) => Some(body),
                        }
                    } else {
                        None
                    };

                    let _ = update_res_body.execute(params![id, body_data, content_type, content_encoding]);
                }
                TrafficEvent::UpdateTags { id, tags } => {
                     let tags_json = serde_json::to_string(&tags).unwrap_or_default();
                     let _ = update_tags.execute(params![id, tags_json]);
                }
                TrafficEvent::Exit => {}
            }
        }
    }

    let _ = tx.commit();
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct FilterPreset {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub filters: String,
}

impl TrafficDb {
    pub fn get_filter_presets(&self) -> rusqlite::Result<Vec<FilterPreset>> {
        crate::traffic::schema::filter_presets::get_filter_presets(&self.conn.lock().unwrap())
    }

    pub fn add_filter_preset(&self, preset: FilterPreset) -> rusqlite::Result<()> {
        crate::traffic::schema::filter_presets::add_filter_preset(&self.conn.lock().unwrap(), preset)
    }

    pub fn update_filter_preset(&self, id: String, name: Option<String>, description: Option<String>, filters: Option<String>) -> rusqlite::Result<()> {
        crate::traffic::schema::filter_presets::update_filter_preset(&self.conn.lock().unwrap(), id, name, description, filters)
    }

    pub fn delete_filter_preset(&self, id: String) -> rusqlite::Result<()> {
        crate::traffic::schema::filter_presets::delete_filter_preset(&self.conn.lock().unwrap(), id)
    }

    pub fn get_setting(&self, key: &str) -> rusqlite::Result<Option<String>> {
        crate::traffic::schema::settings::get_setting(&self.conn.lock().unwrap(), key)
    }

    pub fn set_setting(&self, key: &str, value: &str) -> rusqlite::Result<()> {
        crate::traffic::schema::settings::set_setting(&self.conn.lock().unwrap(), key, value)
    }

    pub fn get_breakpoints(&self) -> rusqlite::Result<Vec<BreakpointRule>> {
        crate::traffic::schema::breakpoints::get_breakpoints(&self.conn.lock().unwrap())
    }

    pub fn save_breakpoint(&self, rule: BreakpointRule) -> rusqlite::Result<()> {
        crate::traffic::schema::breakpoints::save_breakpoint(&self.conn.lock().unwrap(), rule)
    }

    pub fn delete_breakpoint(&self, id: String) -> rusqlite::Result<()> {
        crate::traffic::schema::breakpoints::delete_breakpoint(&self.conn.lock().unwrap(), id)
    }
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct BreakpointRule {
    pub id: String,
    pub enabled: bool,
    pub name: String,
    pub method: String,
    pub matching_rule: String,
    pub request: bool,
    pub response: bool,
}

fn update_memory_cache(cache: &Arc<RwLock<VecDeque<TrafficMetadata>>>, event: &TrafficEvent) {
    let mut recent = cache.write().unwrap();
    match event {
        TrafficEvent::Request { id, uri, method, version, headers, body, content_type: _, content_encoding: _, intercepted, client, tags } => {
            let metadata = TrafficMetadata {
                id: id.clone(),
                uri: Some(uri.clone()),
                method: Some(method.clone()),
                version: Some(version.clone()),
                req_headers: Some(serde_json::to_string(headers).unwrap_or_default()),
                res_headers: None,
                status_code: None,
                intercepted: *intercepted,
                timestamp: chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
                req_body_size: body.len(),
                res_body_size: 0,
                client: Some(client.clone()),
                tags: tags.clone(),
            };
            recent.push_front(metadata);
            if recent.len() > 10000 {
                recent.pop_back();
            }
        }
        TrafficEvent::Response { id, headers, body, content_type: _, content_encoding: _, status_code } => {
            if let Some(meta) = recent.iter_mut().find(|m| m.id == *id) {
                meta.res_headers = Some(serde_json::to_string(headers).unwrap_or_default());
                meta.status_code = Some(*status_code as i32);
                meta.res_body_size = body.len();
            }
        }
        TrafficEvent::UpdateTags { id, tags } => {
            if let Some(meta) = recent.iter_mut().find(|m| m.id == *id) {
                meta.tags = tags.clone();
            }
        }
        TrafficEvent::Exit => {}
    }
}

#[derive(Clone, serde::Serialize)]
pub struct TrafficMetadata {
    pub id: String,
    pub uri: Option<String>,
    pub method: Option<String>,
    pub version: Option<String>,
    pub req_headers: Option<String>,
    pub res_headers: Option<String>,
    pub status_code: Option<i32>,
    pub intercepted: bool,
    pub timestamp: String,
    pub req_body_size: usize,
    pub res_body_size: usize,
    pub client: Option<String>,
    pub tags: Vec<String>,
}

#[derive(Clone, serde::Serialize)]
pub struct RequestResponseData {
    pub headers: HashMap<String, String>,
    pub body: Vec<u8>,
    pub content_type: String,
    pub content_encoding: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status_code: Option<i32>,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct ScriptRule {
    pub id: String,
    pub enabled: bool,
    pub name: String,
    pub method: String,
    pub matching_rule: String,
    pub request: bool,
    pub response: bool,
    pub script: String,
    pub error: Option<String>,
}

impl TrafficDb {
    pub fn get_scripts(&self) -> rusqlite::Result<Vec<ScriptRule>> {
        crate::traffic::schema::scripts::get_scripts(&self.conn.lock().unwrap())
    }

    pub fn save_script(&self, rule: ScriptRule) -> rusqlite::Result<()> {
        crate::traffic::schema::scripts::save_script(&self.conn.lock().unwrap(), rule)
    }

    pub fn delete_script(&self, id: String) -> rusqlite::Result<()> {
        crate::traffic::schema::scripts::delete_script(&self.conn.lock().unwrap(), id)
    }

    pub fn set_script_error(&self, id: String, error: Option<String>) -> rusqlite::Result<()> {
        crate::traffic::schema::scripts::set_script_error(&self.conn.lock().unwrap(), id, error)
    }
}
