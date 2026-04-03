use rusqlite::Connection;

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
