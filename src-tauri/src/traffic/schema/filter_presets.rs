use rusqlite::Connection;

pub fn create_table(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS filter_presets (
            id TEXT PRIMARY KEY,
            name TEXT,
            description TEXT,
            filters TEXT
        )",
        [],
    )?;

    let _ = conn.execute("ALTER TABLE filter_presets ADD COLUMN description TEXT", []);

    Ok(())
}
