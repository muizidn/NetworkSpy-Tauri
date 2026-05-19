use std::sync::Arc;
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
    config: Arc<crate::config::ConfigManager>,
}

impl BottomPaneManager {
    pub fn new(config: Arc<crate::config::ConfigManager>) -> Self {
        Self { config }
    }

    pub fn get_custom_checkers(&self, category: String) -> rusqlite::Result<Vec<CustomChecker>> {
        let config = self.config.get_config();
        Ok(config.custom_checkers.into_iter()
            .filter(|c| c.category == category)
            .collect())
    }

    pub fn save_custom_checker(&self, id: Option<String>, name: String, description: String, script: String, enabled: bool, category: String) -> rusqlite::Result<CustomChecker> {
        let final_id = id.unwrap_or_else(|| Uuid::new_v4().to_string());
        let created_at = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        
        let checker = CustomChecker {
            id: final_id.clone(),
            name,
            description,
            script,
            enabled,
            category,
            created_at,
        };

        let _ = self.config.update(|c| {
            if let Some(pos) = c.custom_checkers.iter().position(|chk| chk.id == final_id) {
                c.custom_checkers[pos] = checker.clone();
            } else {
                c.custom_checkers.push(checker.clone());
            }
        });

        Ok(checker)
    }

    pub fn delete_custom_checker(&self, id: String) -> rusqlite::Result<()> {
        let _ = self.config.update(|c| {
            c.custom_checkers.retain(|chk| chk.id != id);
        });
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
