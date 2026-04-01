use rusqlite::{params, Connection};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use chrono::Local;

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CustomChecker {
    pub id: String,
    pub name: String,
    pub description: String,
    pub script: String,
    pub enabled: bool,
    pub category: String,
    pub created_at: String,
}

pub struct BottomPaneManager {
    db: Arc<Mutex<Connection>>,
}

impl BottomPaneManager {
    pub fn new(app_data_dir: PathBuf) -> Self {
        let db_path = app_data_dir.join("bottom-pane.db");
        let conn = Connection::open(db_path).expect("Failed to open bottom-pane DB");

        conn.execute(
            "CREATE TABLE IF NOT EXISTS custom_checkers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                script TEXT NOT NULL,
                enabled INTEGER DEFAULT 1,
                category TEXT NOT NULL,
                created_at TEXT NOT NULL
            )",
            [],
        ).unwrap();

        Self {
            db: Arc::new(Mutex::new(conn)),
        }
    }

    pub fn get_custom_checkers(&self, category: String) -> rusqlite::Result<Vec<CustomChecker>> {
        let conn = self.db.lock().unwrap();
        let query = format!("SELECT id, name, description, script, enabled, category, created_at FROM custom_checkers WHERE category = '{}' ORDER BY created_at DESC", category);

        let mut stmt = conn.prepare(&query)?;
        let rows = stmt.query_map([], |row| {
            Ok(CustomChecker {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2).unwrap_or_default(),
                script: row.get(3)?,
                enabled: row.get::<_, i32>(4)? != 0,
                category: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?;

        let mut checkers = Vec::new();
        for row in rows {
            checkers.push(row?);
        }
        Ok(checkers)
    }

    pub fn save_custom_checker(&self, id: Option<String>, name: String, description: String, script: String, enabled: bool, category: String) -> rusqlite::Result<CustomChecker> {
        let final_id = id.unwrap_or_else(|| Uuid::new_v4().to_string());
        let created_at = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        let conn = self.db.lock().unwrap();
        
        conn.execute(
            "INSERT INTO custom_checkers (id, name, description, script, enabled, category, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
             ON CONFLICT(id) DO UPDATE SET name=?2, description=?3, script=?4, enabled=?5, category=?6",
            params![final_id, name, description, script, if enabled { 1 } else { 0 }, category, created_at],
        )?;

        Ok(CustomChecker {
            id: final_id,
            name,
            description,
            script,
            enabled,
            category,
            created_at,
        })
    }

    pub fn delete_custom_checker(&self, id: String) -> rusqlite::Result<()> {
        let conn = self.db.lock().unwrap();
        conn.execute("DELETE FROM custom_checkers WHERE id = ?1", params![id])?;
        Ok(())
    }
}

#[tauri::command]
pub async fn get_custom_checkers(manager: tauri::State<'_, Arc<BottomPaneManager>>, category: String) -> Result<Vec<CustomChecker>, String> {
    manager.get_custom_checkers(category).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_custom_checker(
    manager: tauri::State<'_, Arc<BottomPaneManager>>,
    id: Option<String>,
    name: String,
    description: String,
    script: String,
    enabled: bool,
    category: String,
) -> Result<CustomChecker, String> {
    manager.save_custom_checker(id, name, description, script, enabled, category).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_custom_checker(manager: tauri::State<'_, Arc<BottomPaneManager>>, id: String) -> Result<(), String> {
    manager.delete_custom_checker(id).map_err(|e| e.to_string())
}
