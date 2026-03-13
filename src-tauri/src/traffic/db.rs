use rusqlite::{params, Connection, Result};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use serde_json;
use std::collections::HashMap;

pub struct TrafficDb {
    conn: Arc<Mutex<Connection>>,
}

impl TrafficDb {
    pub fn new(db_path: PathBuf) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS traffic (
                id TEXT PRIMARY KEY,
                uri TEXT,
                method TEXT,
                version TEXT,
                req_headers TEXT,
                req_body TEXT,
                res_headers TEXT,
                res_body TEXT,
                intercepted INTEGER DEFAULT 1,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS allow_list (
                domain TEXT PRIMARY KEY
            )",
            [],
        )?;

        // Migration: check if intercepted column exists
        let mut stmt = conn.prepare("PRAGMA table_info(traffic)")?;
        let rows = stmt.query_map([], |row| {
            let name: String = row.get(1)?;
            Ok(name)
        })?;

        let mut has_intercepted = false;
        for row in rows {
            if row? == "intercepted" {
                has_intercepted = true;
                break;
            }
        }

        if !has_intercepted {
            conn.execute("ALTER TABLE traffic ADD COLUMN intercepted INTEGER DEFAULT 1", [])?;
        }

        drop(stmt);

        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
        })
    }

    pub fn insert_request(
        &self,
        id: String,
        uri: String,
        method: String,
        version: String,
        headers: &HashMap<String, String>,
        body: String,
        intercepted: bool,
    ) -> Result<()> {
        let headers_json = serde_json::to_string(headers).unwrap_or_default();
        let intercepted_int = if intercepted { 1 } else { 0 };
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO traffic (id, uri, method, version, req_headers, req_body, intercepted)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![id, uri, method, version, headers_json, body, intercepted_int],
        )?;
        Ok(())
    }

    pub fn insert_response(
        &self,
        id: String,
        headers: &HashMap<String, String>,
        body: String,
    ) -> Result<()> {
        let headers_json = serde_json::to_string(headers).unwrap_or_default();
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE traffic SET res_headers = ?2, res_body = ?3 WHERE id = ?1",
            params![id, headers_json, body],
        )?;
        Ok(())
    }

    pub fn get_traffic(&self, id: String) -> Result<Option<TrafficRow>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, uri, method, version, req_headers, req_body, res_headers, res_body, intercepted FROM traffic WHERE id = ?1",
        )?;
        
        let mut rows = stmt.query_map(params![id], |row| {
            Ok(TrafficRow {
                id: row.get(0)?,
                uri: row.get(1)?,
                method: row.get(2)?,
                version: row.get(3)?,
                req_headers: row.get(4)?,
                req_body: row.get(5)?,
                res_headers: row.get(6)?,
                res_body: row.get(7)?,
                intercepted: row.get::<_, i32>(8)? != 0,
            })
        })?;

        if let Some(row) = rows.next() {
            Ok(Some(row?))
        } else {
            Ok(None)
        }
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
}

pub struct TrafficRow {
    pub id: String,
    pub uri: Option<String>,
    pub method: Option<String>,
    pub version: Option<String>,
    pub req_headers: Option<String>,
    pub req_body: Option<String>,
    pub res_headers: Option<String>,
    pub res_body: Option<String>,
    pub intercepted: bool,
}
