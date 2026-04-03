use rusqlite::{Connection, params};
use crate::traffic::db::ScriptRule;

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

pub fn get_scripts(conn: &Connection) -> rusqlite::Result<Vec<ScriptRule>> {
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

pub fn save_script(conn: &Connection, rule: ScriptRule) -> rusqlite::Result<()> {
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

pub fn delete_script(conn: &Connection, id: String) -> rusqlite::Result<()> {
    conn.execute("DELETE FROM scripts WHERE id = ?1", params![id])?;
    Ok(())
}

