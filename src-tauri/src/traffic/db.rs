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
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, uri, method, version, req_headers, res_headers, status_code, intercepted, timestamp, client, tags FROM traffic WHERE id = ?1",
        )?;
        
        let mut rows = stmt.query_map(params![id], |row| {
            Ok(TrafficMetadata {
                id: row.get(0)?,
                uri: row.get(1)?,
                method: row.get(2)?,
                version: row.get(3)?,
                req_headers: row.get(4)?,
                res_headers: row.get(5)?,
                status_code: row.get(6)?,
                intercepted: row.get::<_, i32>(7)? != 0,
                timestamp: row.get(8)?,
                req_body_size: 0, // Metadata only query
                res_body_size: 0, // Metadata only query
                client: row.get(9)?,
                tags: row.get::<_, Option<String>>(10)?
                    .map(|s| serde_json::from_str(&s).unwrap_or_default())
                    .unwrap_or_default(),
            })
        })?;

        if let Some(row) = rows.next() {
            Ok(Some(row?))
        } else {
            Ok(None)
        }
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
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT req_body, req_content_type, req_content_encoding FROM body WHERE traffic_id = ?1")?;
        let res = stmt.query_row(params![id], |row| {
            let data: Option<Vec<u8>> = row.get(0)?;
            let content_type: Option<String> = row.get(1)?;
            let content_encoding: Option<String> = row.get(2)?;
            
            let bytes = data.map(|bytes| {
                if bytes.starts_with(b"ZSTD") {
                    zstd::decode_all(&bytes[4..]).unwrap_or(bytes)
                } else {
                    bytes
                }
            }).unwrap_or_default();
            
            Ok(Some((bytes, content_type, content_encoding)))
        }).or(Ok(None));
        res
    }

    pub fn get_request_body(&self, id: String) -> rusqlite::Result<Option<Vec<u8>>> {
        self.get_request_body_info(id).map(|opt| opt.map(|(b, _, _)| b))
    }

    pub fn get_response_body_info(&self, id: String) -> rusqlite::Result<Option<(Vec<u8>, Option<String>, Option<String>)>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT res_body, res_content_type, res_content_encoding FROM body WHERE traffic_id = ?1")?;
        let res = stmt.query_row(params![id], |row| {
            let data: Option<Vec<u8>> = row.get(0)?;
            let content_type: Option<String> = row.get(1)?;
            let content_encoding: Option<String> = row.get(2)?;
            
            let bytes = data.map(|bytes| {
                if bytes.starts_with(b"ZSTD") {
                    zstd::decode_all(&bytes[4..]).unwrap_or(bytes)
                } else {
                    bytes
                }
            }).unwrap_or_default();
            
            Ok(Some((bytes, content_type, content_encoding)))
        }).or(Ok(None));
        res
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
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, uri, method, version, req_headers, res_headers, status_code, intercepted, timestamp, client, tags 
             FROM traffic 
             ORDER BY timestamp DESC 
             LIMIT ?1",
        )?;
        
        let rows = stmt.query_map(params![limit], |row| {
            Ok(TrafficMetadata {
                id: row.get(0)?,
                uri: row.get(1)?,
                method: row.get(2)?,
                version: row.get(3)?,
                req_headers: row.get(4)?,
                res_headers: row.get(5)?,
                status_code: row.get(6)?,
                intercepted: row.get::<_, i32>(7)? != 0,
                timestamp: row.get(8)?,
                req_body_size: 0,
                res_body_size: 0,
                client: row.get(9)?,
                tags: row.get::<_, Option<String>>(10)?
                    .map(|s| serde_json::from_str(&s).unwrap_or_default())
                    .unwrap_or_default(),
            })
        })?;

        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }
        Ok(results)
    }

    pub fn get_allow_list(&self) -> rusqlite::Result<Vec<String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT domain FROM allow_list")?;
        let rows = stmt.query_map([], |row| row.get(0))?;
        let mut list = Vec::new();
        for row in rows {
            list.push(row?);
        }
        Ok(list)
    }

    pub fn add_to_allow_list(&self, domain: String) -> rusqlite::Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR IGNORE INTO allow_list (domain) VALUES (?1)",
            params![domain],
        )?;
        Ok(())
    }

    pub fn get_all_traffic_with_bodies(&self) -> rusqlite::Result<Vec<(TrafficMetadata, Option<Vec<u8>>, Option<Vec<u8>>, Option<String>, Option<String>, Option<String>, Option<String>)>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT t.id, t.uri, t.method, t.version, t.req_headers, t.res_headers, t.status_code, t.intercepted, t.timestamp, 
             b.req_body, b.res_body, b.req_content_type, b.req_content_encoding, b.res_content_type, b.res_content_encoding, t.client, t.tags 
             FROM traffic t 
             LEFT JOIN body b ON t.id = b.traffic_id 
             ORDER BY t.timestamp ASC",
        )?;
        
        let rows = stmt.query_map([], |row| {
            let meta = TrafficMetadata {
                id: row.get(0)?,
                uri: row.get(1)?,
                method: row.get(2)?,
                version: row.get(3)?,
                req_headers: row.get(4)?,
                res_headers: row.get(5)?,
                status_code: row.get(6)?,
                intercepted: row.get::<_, i32>(7)? != 0,
                timestamp: row.get(8)?,
                req_body_size: 0,
                res_body_size: 0,
                client: row.get(15)?,
                tags: row.get::<_, Option<String>>(16)?
                    .map(|s| serde_json::from_str(&s).unwrap_or_default())
                    .unwrap_or_default(),
            };
            
            let req_body: Option<Vec<u8>> = row.get(9)?;
            let res_body: Option<Vec<u8>> = row.get(10)?;
            let req_ct: Option<String> = row.get(11)?;
            let req_ce: Option<String> = row.get(12)?;
            let res_ct: Option<String> = row.get(13)?;
            let res_ce: Option<String> = row.get(14)?;
            
            let req_decoded = req_body.map(|bytes| {
                if bytes.starts_with(b"ZSTD") {
                    zstd::decode_all(&bytes[4..]).unwrap_or_else(|_| bytes)
                } else {
                    bytes
                }
            });
            
            let res_decoded = res_body.map(|bytes| {
                if bytes.starts_with(b"ZSTD") {
                    zstd::decode_all(&bytes[4..]).unwrap_or_else(|_| bytes)
                } else {
                    bytes
                }
            });
            
            Ok((meta, req_decoded, res_decoded, req_ct, req_ce, res_ct, res_ce))
        })?;

        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }
        Ok(results)
    }

    pub fn get_traffic_with_bodies_by_ids(&self, ids: Vec<String>) -> rusqlite::Result<Vec<(TrafficMetadata, Option<Vec<u8>>, Option<Vec<u8>>, Option<String>, Option<String>, Option<String>, Option<String>)>> {
        let conn = self.conn.lock().unwrap();
        if ids.is_empty() {
            return Ok(Vec::new());
        }
        
        let mut results = Vec::new();
        for chunk in ids.chunks(900) {
            let placeholders: Vec<String> = (0..chunk.len()).map(|_| "?".to_string()).collect();
            let query = format!(
                "SELECT t.id, t.uri, t.method, t.version, t.req_headers, t.res_headers, t.status_code, t.intercepted, t.timestamp, 
                 b.req_body, b.res_body, b.req_content_type, b.req_content_encoding, b.res_content_type, b.res_content_encoding, t.client, t.tags 
                 FROM traffic t 
                 LEFT JOIN body b ON t.id = b.traffic_id 
                 WHERE t.id IN ({})
                 ORDER BY t.timestamp ASC",
                placeholders.join(", ")
            );
            
            let mut stmt = conn.prepare(&query)?;
            let params_slice: Vec<&dyn rusqlite::ToSql> = chunk.iter().map(|s| s as &dyn rusqlite::ToSql).collect();
            
            let rows = stmt.query_map(&params_slice[..], |row| {
                let meta = TrafficMetadata {
                    id: row.get(0)?,
                    uri: row.get(1)?,
                    method: row.get(2)?,
                    version: row.get(3)?,
                    req_headers: row.get(4)?,
                    res_headers: row.get(5)?,
                    status_code: row.get(6)?,
                    intercepted: row.get::<_, i32>(7)? != 0,
                    timestamp: row.get(8)?,
                    req_body_size: 0,
                    res_body_size: 0,
                    client: row.get(15)?,
                    tags: row.get::<_, Option<String>>(16)?
                        .map(|s| serde_json::from_str(&s).unwrap_or_default())
                        .unwrap_or_default(),
                };
                
                let req_body: Option<Vec<u8>> = row.get(9)?;
                let res_body: Option<Vec<u8>> = row.get(10)?;
                let req_ct: Option<String> = row.get(11)?;
                let req_ce: Option<String> = row.get(12)?;
                let res_ct: Option<String> = row.get(13)?;
                let res_ce: Option<String> = row.get(14)?;
                
                let req_decoded = req_body.map(|bytes| {
                    if bytes.starts_with(b"ZSTD") {
                        zstd::decode_all(&bytes[4..]).unwrap_or_else(|_| bytes)
                    } else {
                        bytes
                    }
                });
                
                let res_decoded = res_body.map(|bytes| {
                    if bytes.starts_with(b"ZSTD") {
                        zstd::decode_all(&bytes[4..]).unwrap_or_else(|_| bytes)
                    } else {
                        bytes
                    }
                });
                
                Ok((meta, req_decoded, res_decoded, req_ct, req_ce, res_ct, res_ce))
            })?;
            
            for row in rows {
                results.push(row?);
            }
        }
        
        Ok(results)
    }

    pub fn clear_all(&self) -> rusqlite::Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM traffic", [])?;
        conn.execute("DELETE FROM body", [])?;
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
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, name, description, filters FROM filter_presets")?;
        let rows = stmt.query_map([], |row| {
            Ok(FilterPreset {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                filters: row.get(3)?,
            })
        })?;
        
        let mut list = Vec::new();
        for row in rows {
            list.push(row?);
        }
        Ok(list)
    }

    pub fn add_filter_preset(&self, preset: FilterPreset) -> rusqlite::Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO filter_presets (id, name, description, filters) VALUES (?1, ?2, ?3, ?4)",
            params![preset.id, preset.name, preset.description, preset.filters],
        )?;
        Ok(())
    }

    pub fn update_filter_preset(&self, id: String, name: Option<String>, description: Option<String>, filters: Option<String>) -> rusqlite::Result<()> {
        let conn = self.conn.lock().unwrap();
        if let Some(n) = name {
            conn.execute("UPDATE filter_presets SET name = ?2 WHERE id = ?1", params![id, n])?;
        }
        if let Some(d) = description {
            conn.execute("UPDATE filter_presets SET description = ?2 WHERE id = ?1", params![id, d])?;
        }
        if let Some(f) = filters {
            conn.execute("UPDATE filter_presets SET filters = ?2 WHERE id = ?1", params![id, f])?;
        }
        Ok(())
    }

    pub fn delete_filter_preset(&self, id: String) -> rusqlite::Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM filter_presets WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn get_setting(&self, key: &str) -> rusqlite::Result<Option<String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?1")?;
        let res = stmt.query_row(params![key], |row| row.get(0)).or(Ok(None));
        res
    }

    pub fn set_setting(&self, key: &str, value: &str) -> rusqlite::Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            params![key, value],
        )?;
        Ok(())
    }

    pub fn get_breakpoints(&self) -> rusqlite::Result<Vec<BreakpointRule>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, enabled, name, method, matching_rule, request, response FROM breakpoints")?;
        let rows = stmt.query_map([], |row| {
            Ok(BreakpointRule {
                id: row.get(0)?,
                enabled: row.get::<_, i32>(1)? != 0,
                name: row.get(2)?,
                method: row.get(3)?,
                matching_rule: row.get(4)?,
                request: row.get::<_, i32>(5)? != 0,
                response: row.get::<_, i32>(6)? != 0,
            })
        })?;
        
        let mut list = Vec::new();
        for row in rows {
            list.push(row?);
        }
        Ok(list)
    }

    pub fn save_breakpoint(&self, rule: BreakpointRule) -> rusqlite::Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO breakpoints (id, enabled, name, method, matching_rule, request, response) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) 
             ON CONFLICT(id) DO UPDATE SET 
                enabled = excluded.enabled, 
                name = excluded.name, 
                method = excluded.method, 
                matching_rule = excluded.matching_rule, 
                request = excluded.request, 
                response = excluded.response",
            params![
                rule.id, 
                if rule.enabled { 1 } else { 0 }, 
                rule.name, 
                rule.method, 
                rule.matching_rule, 
                if rule.request { 1 } else { 0 }, 
                if rule.response { 1 } else { 0 },
            ],
        )?;
        Ok(())
    }

    pub fn delete_breakpoint(&self, id: String) -> rusqlite::Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM breakpoints WHERE id = ?1", params![id])?;
        Ok(())
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
}

impl TrafficDb {
    pub fn get_scripts(&self) -> rusqlite::Result<Vec<ScriptRule>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, enabled, name, method, matching_rule, request, response, script FROM scripts")?;
        let rows = stmt.query_map([], |row| {
            Ok(ScriptRule {
                id: row.get(0)?,
                enabled: row.get::<_, i32>(1)? != 0,
                name: row.get(2)?,
                method: row.get(3)?,
                matching_rule: row.get(4)?,
                request: row.get::<_, i32>(5)? != 0,
                response: row.get::<_, i32>(6)? != 0,
                script: row.get(7)?,
            })
        })?;
        
        let mut list = Vec::new();
        for row in rows {
            list.push(row?);
        }
        Ok(list)
    }

    pub fn save_script(&self, rule: ScriptRule) -> rusqlite::Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO scripts (id, enabled, name, method, matching_rule, request, response, script) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8) 
             ON CONFLICT(id) DO UPDATE SET 
                enabled = excluded.enabled, 
                name = excluded.name, 
                method = excluded.method, 
                matching_rule = excluded.matching_rule, 
                request = excluded.request, 
                response = excluded.response,
                script = excluded.script",
            params![
                rule.id, 
                if rule.enabled { 1 } else { 0 }, 
                rule.name, 
                rule.method, 
                rule.matching_rule, 
                if rule.request { 1 } else { 0 }, 
                if rule.response { 1 } else { 0 },
                rule.script
            ],
        )?;
        Ok(())
    }

    pub fn delete_script(&self, id: String) -> rusqlite::Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM scripts WHERE id = ?1", params![id])?;
        Ok(())
    }
}
