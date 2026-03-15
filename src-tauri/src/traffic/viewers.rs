use tauri::Manager;
use rusqlite::{params, Connection};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use chrono::Local;

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Viewer {
    pub id: String,
    pub name: String,
    pub folder_id: Option<String>,
    pub content: String, // JSON content
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ViewerFolder {
    pub id: String,
    pub name: String,
}

pub struct ViewerManager {
    db: Arc<Mutex<Connection>>,
}

impl ViewerManager {
    pub fn new(app_data_dir: PathBuf) -> Self {
        let db_path = app_data_dir.join("viewers.db");
        let conn = Connection::open(db_path).expect("Failed to open viewers DB");

        conn.execute(
            "CREATE TABLE IF NOT EXISTS viewer_folders (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE
            )",
            [],
        ).unwrap();

        conn.execute(
            "CREATE TABLE IF NOT EXISTS viewers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                folder_id TEXT,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(folder_id) REFERENCES viewer_folders(id) ON DELETE SET NULL
            )",
            [],
        ).unwrap();

        Self {
            db: Arc::new(Mutex::new(conn)),
        }
    }

    pub fn get_viewers(&self) -> rusqlite::Result<Vec<Viewer>> {
        let conn = self.db.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, name, folder_id, content, created_at FROM viewers ORDER BY created_at DESC")?;
        let rows = stmt.query_map([], |row| {
            Ok(Viewer {
                id: row.get(0)?,
                name: row.get(1)?,
                folder_id: row.get(2)?,
                content: row.get(3)?,
                created_at: row.get(4)?,
            })
        })?;

        let mut viewers = Vec::new();
        for row in rows {
            viewers.push(row?);
        }
        Ok(viewers)
    }

    pub fn get_folders(&self) -> rusqlite::Result<Vec<ViewerFolder>> {
        let conn = self.db.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, name FROM viewer_folders ORDER BY name ASC")?;
        let rows = stmt.query_map([], |row| {
            Ok(ViewerFolder {
                id: row.get(0)?,
                name: row.get(1)?,
            })
        })?;

        let mut folders = Vec::new();
        for row in rows {
            folders.push(row?);
        }
        Ok(folders)
    }

    pub fn save_viewer(&self, id: Option<String>, name: String, folder_id: Option<String>, content: String) -> rusqlite::Result<Viewer> {
        let final_id = id.unwrap_or_else(|| Uuid::new_v4().to_string());
        let created_at = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        let conn = self.db.lock().unwrap();
        
        conn.execute(
            "INSERT INTO viewers (id, name, folder_id, content, created_at) VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT(id) DO UPDATE SET name=?2, folder_id=?3, content=?4",
            params![final_id, name, folder_id, content, created_at],
        )?;

        Ok(Viewer {
            id: final_id,
            name,
            folder_id,
            content,
            created_at,
        })
    }

    pub fn add_folder(&self, name: String) -> rusqlite::Result<ViewerFolder> {
        let id = Uuid::new_v4().to_string();
        let conn = self.db.lock().unwrap();
        conn.execute(
            "INSERT INTO viewer_folders (id, name) VALUES (?1, ?2)",
            params![id, name],
        )?;
        Ok(ViewerFolder { id, name })
    }

    pub fn delete_folder(&self, id: String) -> rusqlite::Result<()> {
        let conn = self.db.lock().unwrap();
        conn.execute("DELETE FROM viewer_folders WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn rename_folder(&self, id: String, new_name: String) -> rusqlite::Result<()> {
        let conn = self.db.lock().unwrap();
        conn.execute("UPDATE viewer_folders SET name = ?1 WHERE id = ?2", params![new_name, id])?;
        Ok(())
    }

    pub fn move_viewer(&self, id: String, folder_id: Option<String>) -> rusqlite::Result<()> {
        let conn = self.db.lock().unwrap();
        conn.execute("UPDATE viewers SET folder_id = ?1 WHERE id = ?2", params![folder_id, id])?;
        Ok(())
    }

    pub fn delete_viewer(&self, id: String) -> rusqlite::Result<()> {
        let conn = self.db.lock().unwrap();
        conn.execute("DELETE FROM viewers WHERE id = ?1", params![id])?;
        Ok(())
    }
}

#[tauri::command]
pub async fn get_custom_viewers(manager: tauri::State<'_, Arc<ViewerManager>>) -> Result<Vec<Viewer>, String> {
    manager.get_viewers().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_viewer_folders(manager: tauri::State<'_, Arc<ViewerManager>>) -> Result<Vec<ViewerFolder>, String> {
    manager.get_folders().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_viewer_folder(manager: tauri::State<'_, Arc<ViewerManager>>, name: String) -> Result<ViewerFolder, String> {
    manager.add_folder(name).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_viewer_folder(manager: tauri::State<'_, Arc<ViewerManager>>, id: String) -> Result<(), String> {
    manager.delete_folder(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn rename_viewer_folder(manager: tauri::State<'_, Arc<ViewerManager>>, id: String, new_name: String) -> Result<(), String> {
    manager.rename_folder(id, new_name).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn move_viewer_to_folder(manager: tauri::State<'_, Arc<ViewerManager>>, id: String, folder_id: Option<String>) -> Result<(), String> {
    manager.move_viewer(id, folder_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_custom_viewer(manager: tauri::State<'_, Arc<ViewerManager>>, id: String) -> Result<(), String> {
    manager.delete_viewer(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_custom_viewer(
    manager: tauri::State<'_, Arc<ViewerManager>>,
    id: Option<String>,
    name: String,
    folder_id: Option<String>,
    content: String,
) -> Result<Viewer, String> {
    manager.save_viewer(id, name, folder_id, content).map_err(|e| e.to_string())
}
