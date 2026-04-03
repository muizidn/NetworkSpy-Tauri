use rusqlite::Connection;

pub fn create_table(conn: &Connection) -> rusqlite::Result<()> {
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

    let _ = conn.execute("ALTER TABLE tag_rules ADD COLUMN folder_id TEXT", []);

    conn.execute(
        "CREATE TABLE IF NOT EXISTS tag_rule_folder (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE
        )",
        [],
    )?;

    Ok(())
}
