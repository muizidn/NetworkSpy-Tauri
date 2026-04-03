use rusqlite::{Connection, params};

pub fn create_table(conn: &Connection) -> rusqlite::Result<()> {
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

    // Migration
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

    conn.execute("CREATE INDEX IF NOT EXISTS idx_traffic_timestamp ON traffic(timestamp)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_traffic_uri ON traffic(uri)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_traffic_method ON traffic(method)", [])?;

    Ok(())
}


use crate::traffic::db::TrafficMetadata;

pub fn get_traffic_metadata(conn: &Connection, id: String) -> rusqlite::Result<Option<TrafficMetadata>> {
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

pub fn get_request_body_info(conn: &Connection, id: String) -> rusqlite::Result<Option<(Vec<u8>, Option<String>, Option<String>)>> {
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

pub fn get_response_body_info(conn: &Connection, id: String) -> rusqlite::Result<Option<(Vec<u8>, Option<String>, Option<String>)>> {
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

pub fn get_all_metadata(conn: &Connection, limit: usize) -> rusqlite::Result<Vec<TrafficMetadata>> {
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

pub fn get_allow_list(conn: &Connection) -> rusqlite::Result<Vec<String>> {
    let mut stmt = conn.prepare("SELECT domain FROM allow_list")?;
    let rows = stmt.query_map([], |row| row.get(0))?;
    let mut list = Vec::new();
    for row in rows {
        list.push(row?);
    }
    Ok(list)
}

pub fn add_to_allow_list(conn: &Connection, domain: String) -> rusqlite::Result<()> {
    conn.execute(
        "INSERT OR IGNORE INTO allow_list (domain) VALUES (?1)",
        params![domain],
    )?;
    Ok(())
}

pub fn get_all_traffic_with_bodies(conn: &Connection) -> rusqlite::Result<Vec<(TrafficMetadata, Option<Vec<u8>>, Option<Vec<u8>>, Option<String>, Option<String>, Option<String>, Option<String>)>> {
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

pub fn get_traffic_with_bodies_by_ids(conn: &Connection, ids: Vec<String>) -> rusqlite::Result<Vec<(TrafficMetadata, Option<Vec<u8>>, Option<Vec<u8>>, Option<String>, Option<String>, Option<String>, Option<String>)>> {
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

pub fn clear_all(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute("DELETE FROM traffic", [])?;
    conn.execute("DELETE FROM body", [])?;
    Ok(())
}
