use std::sync::Arc;
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
    config: Arc<crate::config::ConfigManager>,
}

impl ViewerManager {
    pub fn new(config: Arc<crate::config::ConfigManager>) -> Self {
        Self { config }
    }

    pub fn get_viewers(&self) -> rusqlite::Result<Vec<Viewer>> {
        Ok(self.config.get_config().viewers)
    }

    pub fn get_folders(&self) -> rusqlite::Result<Vec<ViewerFolder>> {
        Ok(self.config.get_config().viewer_folders)
    }

    pub fn save_viewer(&self, id: Option<String>, name: String, folder_id: Option<String>, content: String) -> rusqlite::Result<Viewer> {
        let final_id = id.unwrap_or_else(|| Uuid::new_v4().to_string());
        let created_at = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        
        let viewer = Viewer {
            id: final_id.clone(),
            name,
            folder_id,
            content,
            created_at,
        };

        let _ = self.config.update(|c| {
            if let Some(pos) = c.viewers.iter().position(|v| v.id == final_id) {
                c.viewers[pos] = viewer.clone();
            } else {
                c.viewers.push(viewer.clone());
            }
        });

        Ok(viewer)
    }

    pub fn add_folder(&self, name: String) -> rusqlite::Result<ViewerFolder> {
        let id = Uuid::new_v4().to_string();
        let folder = ViewerFolder { id: id.clone(), name };
        
        let _ = self.config.update(|c| {
            c.viewer_folders.push(folder.clone());
        });
        
        Ok(folder)
    }

    pub fn delete_folder(&self, id: String) -> rusqlite::Result<()> {
        let _ = self.config.update(|c| {
            c.viewer_folders.retain(|f| f.id != id);
            // Optional: reset folder_id for viewers in this folder
            for viewer in c.viewers.iter_mut() {
                if viewer.folder_id == Some(id.clone()) {
                    viewer.folder_id = None;
                }
            }
        });
        Ok(())
    }

    pub fn rename_folder(&self, id: String, new_name: String) -> rusqlite::Result<()> {
        let _ = self.config.update(|c| {
            if let Some(folder) = c.viewer_folders.iter_mut().find(|f| f.id == id) {
                folder.name = new_name;
            }
        });
        Ok(())
    }

    pub fn move_viewer(&self, id: String, folder_id: Option<String>) -> rusqlite::Result<()> {
        let _ = self.config.update(|c| {
            if let Some(viewer) = c.viewers.iter_mut().find(|v| v.id == id) {
                viewer.folder_id = folder_id;
            }
        });
        Ok(())
    }

    pub fn delete_viewer(&self, id: String) -> rusqlite::Result<()> {
        let _ = self.config.update(|c| {
            c.viewers.retain(|v| v.id != id);
        });
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
