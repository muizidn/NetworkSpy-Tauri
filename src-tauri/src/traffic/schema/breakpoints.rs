use rusqlite::{Connection, params};
use crate::traffic::db::BreakpointRule;

pub fn create_table(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS breakpoints (
            id TEXT PRIMARY KEY,
            enabled INTEGER DEFAULT 1,
            name TEXT,
            method TEXT,
            matching_rule TEXT,
            request INTEGER DEFAULT 1,
            response INTEGER DEFAULT 1
        )",
        [],
    )?;
    Ok(())
}

pub fn get_breakpoints(conn: &Connection) -> rusqlite::Result<Vec<BreakpointRule>> {
    let mut stmt = conn.prepare("SELECT id, enabled, name, method, matching_rule, request, response FROM breakpoints")?;
    let rows = stmt.query_map([], |row| {
        Ok(BreakpointRule {
            id: row.get(0)?,
            enabled: row.get::<_, i32>(1)? != 0,
            name: row.get(2)?,
            method: row.get(3)?,
            matching_rule: row.get(4)?,
            request: row.get::<_, i32>(5)? != 0,
            response: row.get::<_, i32>(6)? != 0,
        })
    })?;
    
    let mut list = Vec::new();
    for row in rows {
        list.push(row?);
    }
    Ok(list)
}

pub fn save_breakpoint(conn: &Connection, rule: BreakpointRule) -> rusqlite::Result<()> {
    conn.execute(
        "INSERT INTO breakpoints (id, enabled, name, method, matching_rule, request, response) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) 
         ON CONFLICT(id) DO UPDATE SET 
            enabled = excluded.enabled, 
            name = excluded.name, 
            method = excluded.method, 
            matching_rule = excluded.matching_rule, 
            request = excluded.request, 
            response = excluded.response",
        params![
            rule.id, 
            if rule.enabled { 1 } else { 0 }, 
            rule.name, 
            rule.method, 
            rule.matching_rule, 
            if rule.request { 1 } else { 0 }, 
            if rule.response { 1 } else { 0 },
        ],
    )?;
    Ok(())
}

pub fn delete_breakpoint(conn: &Connection, id: String) -> rusqlite::Result<()> {
    conn.execute("DELETE FROM breakpoints WHERE id = ?1", params![id])?;
    Ok(())
}
