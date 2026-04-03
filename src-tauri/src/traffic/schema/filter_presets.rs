use rusqlite::{Connection, params};
use crate::traffic::db::FilterPreset;

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

pub fn get_filter_presets(conn: &Connection) -> rusqlite::Result<Vec<FilterPreset>> {
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

pub fn add_filter_preset(conn: &Connection, preset: FilterPreset) -> rusqlite::Result<()> {
    conn.execute(
        "INSERT INTO filter_presets (id, name, description, filters) VALUES (?1, ?2, ?3, ?4)",
        params![preset.id, preset.name, preset.description, preset.filters],
    )?;
    Ok(())
}

pub fn update_filter_preset(conn: &Connection, id: String, name: Option<String>, description: Option<String>, filters: Option<String>) -> rusqlite::Result<()> {
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

pub fn delete_filter_preset(conn: &Connection, id: String) -> rusqlite::Result<()> {
    conn.execute("DELETE FROM filter_presets WHERE id = ?1", params![id])?;
    Ok(())
}
