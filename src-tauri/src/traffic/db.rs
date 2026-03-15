use rusqlite::{params, Connection, Result};
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
    pub fn new(db_path: PathBuf) -> Result<Self> {
        let conn = Connection::open(&db_path)?;
        
        // Phase 1: SQLite Performance Foundation
        conn.execute_batch(
            "PRAGMA journal_mode=WAL;
             PRAGMA synchronous=NORMAL;
             PRAGMA temp_store=MEMORY;
             PRAGMA cache_size=100000;
             PRAGMA mmap_size=30000000000;"
        )?;

        // Phase 5: Optimized Schema
        conn.execute(
            "CREATE TABLE IF NOT EXISTS traffic (
                id TEXT PRIMARY KEY,
                uri TEXT,
                method TEXT,
                version TEXT,
                client TEXT,
                req_headers TEXT,
                res_headers TEXT,
                status_code INTEGER,
                intercepted INTEGER DEFAULT 1,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS body (
                traffic_id TEXT PRIMARY KEY,
                req_body BLOB,
                res_body BLOB,
                req_content_type TEXT,
                req_content_encoding TEXT,
                res_content_type TEXT,
                res_content_encoding TEXT,
                FOREIGN KEY(traffic_id) REFERENCES traffic(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Migration: Add missing columns to body table if they don't exist
        let _ = conn.execute("ALTER TABLE traffic ADD COLUMN client TEXT", []);
        let _ = conn.execute("ALTER TABLE traffic ADD COLUMN tags TEXT", []);
        let _ = conn.execute("ALTER TABLE body ADD COLUMN req_content_type TEXT", []);
        let _ = conn.execute("ALTER TABLE body ADD COLUMN req_content_encoding TEXT", []);
        let _ = conn.execute("ALTER TABLE body ADD COLUMN res_content_type TEXT", []);
        let _ = conn.execute("ALTER TABLE body ADD COLUMN res_content_encoding TEXT", []);

        conn.execute(
            "CREATE TABLE IF NOT EXISTS allow_list (
                domain TEXT PRIMARY KEY
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS tag_rules (
                id TEXT PRIMARY KEY,
                enabled INTEGER DEFAULT 1,
                name TEXT,
                method TEXT,
                matching_rule TEXT,
                tag TEXT,
                is_sync INTEGER DEFAULT 1,
                scope TEXT,
                color TEXT,
                bg_color TEXT,
                folder_id TEXT
            )",
            [],
        )?;

        conn.execute("ALTER TABLE tag_rules ADD COLUMN folder_id TEXT", []);

        conn.execute(
            "CREATE TABLE IF NOT EXISTS tag_rule_folder (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE
            )",
            [],
        )?;

        // Task 1.2: Add Indexes
        conn.execute("CREATE INDEX IF NOT EXISTS idx_traffic_timestamp ON traffic(timestamp)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_traffic_uri ON traffic(uri)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_traffic_method ON traffic(method)", [])?;

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

    pub fn get_traffic_metadata(&self, id: String) -> Result<Option<TrafficMetadata>> {
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
                tags: row.get(10)?,
            })
        })?;

        if let Some(row) = rows.next() {
            Ok(Some(row?))
        } else {
            Ok(None)
        }
    }

    pub fn get_request_body_info(&self, id: String) -> Result<Option<(Vec<u8>, Option<String>, Option<String>)>> {
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

    pub fn get_request_body(&self, id: String) -> Result<Option<Vec<u8>>> {
        self.get_request_body_info(id).map(|opt| opt.map(|(b, _, _)| b))
    }

    pub fn get_response_body_info(&self, id: String) -> Result<Option<(Vec<u8>, Option<String>, Option<String>)>> {
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

    pub fn get_response_body(&self, id: String) -> Result<Option<Vec<u8>>> {
        self.get_response_body_info(id).map(|opt| opt.map(|(b, _, _)| b))
    }

    pub fn get_recent_traffic(&self, limit: usize) -> Vec<TrafficMetadata> {
        let recent = self.recent_traffic.read().unwrap();
        recent.iter().take(limit).cloned().collect()
    }

    pub fn get_allow_list(&self) -> Result<Vec<String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT domain FROM allow_list")?;
        let rows = stmt.query_map([], |row| row.get(0))?;
        let mut list = Vec::new();
        for row in rows {
            list.push(row?);
        }
        Ok(list)
    }

    pub fn add_to_allow_list(&self, domain: String) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR IGNORE INTO allow_list (domain) VALUES (?1)",
            params![domain],
        )?;
        Ok(())
    }

    pub fn get_all_traffic_with_bodies(&self) -> Result<Vec<(TrafficMetadata, Option<Vec<u8>>, Option<Vec<u8>>, Option<String>, Option<String>, Option<String>, Option<String>)>> {
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
                tags: row.get(16)?,
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

    pub fn get_traffic_with_bodies_by_ids(&self, ids: Vec<String>) -> Result<Vec<(TrafficMetadata, Option<Vec<u8>>, Option<Vec<u8>>, Option<String>, Option<String>, Option<String>, Option<String>)>> {
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
                    tags: row.get(16)?,
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

    pub fn clear_all(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM traffic", [])?;
        conn.execute("DELETE FROM body", [])?;
        let mut recent = self.recent_traffic.write().unwrap();
        recent.clear();
        Ok(())
    }
}

fn flush_buffer(conn: &mut Connection, buffer: &mut Vec<TrafficEvent>) {
    let tx = match conn.transaction() {
        Ok(t) => t,
        Err(_) => return,
    };

    {
        let mut insert_traffic = tx.prepare_cached(
            "INSERT INTO traffic (id, uri, method, version, req_headers, intercepted, client, tags) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8) ON CONFLICT(id) DO NOTHING"
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
                tags: Some(serde_json::to_string(tags).unwrap_or_default()),
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
                meta.tags = Some(serde_json::to_string(tags).unwrap_or_default());
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
    pub tags: Option<String>,
}
