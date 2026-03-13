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

pub enum TrafficEvent {
    Request {
        id: String,
        uri: String,
        method: String,
        version: String,
        headers: HashMap<String, String>,
        body: Vec<u8>,
        intercepted: bool,
    },
    Response {
        id: String,
        headers: HashMap<String, String>,
        body: Vec<u8>,
        status_code: u16,
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
                FOREIGN KEY(traffic_id) REFERENCES traffic(id) ON DELETE CASCADE
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS allow_list (
                domain TEXT PRIMARY KEY
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

    pub fn insert_request(&self, event: TrafficEvent) {
        let _ = self.tx.send(event);
    }

    pub fn insert_response(&self, event: TrafficEvent) {
        let _ = self.tx.send(event);
    }

    pub fn get_traffic_metadata(&self, id: String) -> Result<Option<TrafficMetadata>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, uri, method, version, req_headers, res_headers, status_code, intercepted, timestamp FROM traffic WHERE id = ?1",
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
            })
        })?;

        if let Some(row) = rows.next() {
            Ok(Some(row?))
        } else {
            Ok(None)
        }
    }

    pub fn get_request_body(&self, id: String) -> Result<Option<Vec<u8>>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT req_body FROM body WHERE traffic_id = ?1")?;
        let res: Result<Option<Vec<u8>>> = stmt.query_row(params![id], |row| {
            let data: Option<Vec<u8>> = row.get(0)?;
            Ok(data.map(|bytes| {
                if bytes.starts_with(b"ZSTD") {
                    match zstd::decode_all(&bytes[4..]) {
                        Ok(decoded) => decoded,
                        Err(e) => {
                            eprintln!("ZSTD Decompression failed for request {}: {}", id, e);
                            bytes
                        }
                    }
                } else {
                    bytes
                }
            }))
        }).or(Ok(None));
        res
    }

    pub fn get_response_body(&self, id: String) -> Result<Option<Vec<u8>>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT res_body FROM body WHERE traffic_id = ?1")?;
        let res: Result<Option<Vec<u8>>> = stmt.query_row(params![id], |row| {
            let data: Option<Vec<u8>> = row.get(0)?;
            Ok(data.map(|bytes| {
                if bytes.starts_with(b"ZSTD") {
                    match zstd::decode_all(&bytes[4..]) {
                        Ok(decoded) => decoded,
                        Err(e) => {
                            eprintln!("ZSTD Decompression failed for response {}: {}", id, e);
                            bytes
                        }
                    }
                } else {
                    bytes
                }
            }))
        }).or(Ok(None));
        res
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

    pub fn get_all_traffic_with_bodies(&self) -> Result<Vec<(TrafficMetadata, Option<Vec<u8>>, Option<Vec<u8>>)>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT t.id, t.uri, t.method, t.version, t.req_headers, t.res_headers, t.status_code, t.intercepted, t.timestamp, 
             b.req_body, b.res_body 
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
            };
            
            let req_body: Option<Vec<u8>> = row.get(9)?;
            let res_body: Option<Vec<u8>> = row.get(10)?;
            
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
            
            Ok((meta, req_decoded, res_decoded))
        })?;

        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
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
            "INSERT INTO traffic (id, uri, method, version, req_headers, intercepted) VALUES (?1, ?2, ?3, ?4, ?5, ?6) ON CONFLICT(id) DO NOTHING"
        ).expect("Failed to prepare insert_traffic");

        let mut insert_body = tx.prepare_cached(
            "INSERT INTO body (traffic_id, req_body) VALUES (?1, ?2) ON CONFLICT(traffic_id) DO UPDATE SET req_body = excluded.req_body"
        ).expect("Failed to prepare insert_body");

        let mut update_response = tx.prepare_cached(
            "UPDATE traffic SET res_headers = ?2, status_code = ?3 WHERE id = ?1"
        ).expect("Failed to prepare update_response");

        let mut update_res_body = tx.prepare_cached(
            "UPDATE body SET res_body = ?2 WHERE traffic_id = ?1"
        ).expect("Failed to prepare update_res_body");

        for event in buffer.drain(..) {
            match event {
                TrafficEvent::Request { id, uri, method, version, headers, body, intercepted } => {
                    let headers_json = serde_json::to_string(&headers).unwrap_or_default();
                    let _ = insert_traffic.execute(params![
                        id, uri, method, version, headers_json, if intercepted { 1 } else { 0 }
                    ]);
                    
                    if !body.is_empty() {
                        match zstd::encode_all(&body[..], 3) {
                            Ok(compressed) => {
                                let mut final_data = b"ZSTD".to_vec();
                                final_data.extend_from_slice(&compressed);
                                let _ = insert_body.execute(params![id, final_data]);
                            }
                            Err(_) => {
                                let _ = insert_body.execute(params![id, body]);
                            }
                        }
                    } else {
                        let _ = insert_body.execute(params![id, Option::<Vec<u8>>::None]);
                    }
                }
                TrafficEvent::Response { id, headers, body, status_code } => {
                    let headers_json = serde_json::to_string(&headers).unwrap_or_default();
                    let _ = update_response.execute(params![id, headers_json, status_code]);
                    
                    if !body.is_empty() {
                         match zstd::encode_all(&body[..], 3) {
                            Ok(compressed) => {
                                let mut final_data = b"ZSTD".to_vec();
                                final_data.extend_from_slice(&compressed);
                                let _ = update_res_body.execute(params![id, final_data]);
                            }
                            Err(_) => {
                                let _ = update_res_body.execute(params![id, body]);
                            }
                        }
                    }
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
        TrafficEvent::Request { id, uri, method, version, headers, body, intercepted } => {
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
            };
            recent.push_front(metadata);
            if recent.len() > 10000 {
                recent.pop_back();
            }
        }
        TrafficEvent::Response { id, headers, body, status_code } => {
            if let Some(meta) = recent.iter_mut().find(|m| m.id == *id) {
                meta.res_headers = Some(serde_json::to_string(headers).unwrap_or_default());
                meta.status_code = Some(*status_code as i32);
                meta.res_body_size = body.len();
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
}
