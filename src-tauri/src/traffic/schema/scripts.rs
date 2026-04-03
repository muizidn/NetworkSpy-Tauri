use rusqlite::Connection;

pub fn create_table(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS scripts (
            id TEXT PRIMARY KEY,
            enabled INTEGER DEFAULT 1,
            name TEXT,
            method TEXT,
            matching_rule TEXT,
            request INTEGER DEFAULT 1,
            response INTEGER DEFAULT 1,
            script TEXT
        )",
        [],
    )?;
    Ok(())
}
