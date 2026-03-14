use serde::{Serialize, Deserialize};
use rusqlite::{params, Result, Connection};
use std::sync::{Arc, Mutex};
use globset::{Glob, GlobSet, GlobSetBuilder};
use std::collections::HashMap;
use crate::traffic::db::TrafficDb;
use tauri::{AppHandle, Manager, Emitter};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TagRule {
    pub id: String,
    pub enabled: bool,
    pub name: String,
    pub method: String,
    pub matching_rule: String,
    pub tag: String,
    pub is_sync: bool,
    pub scope: String, // "metadata" or "body"
    pub color: Option<String>,
    pub bg_color: Option<String>,
    pub folder: Option<String>,
}

pub struct TagManager {
    db: Arc<TrafficDb>,
    rules: Mutex<Vec<TagRule>>,
    glob_set: Mutex<Option<GlobSet>>,
}

impl TagManager {
    pub fn new(db: Arc<TrafficDb>) -> Self {
        let manager = Self {
            db,
            rules: Mutex::new(Vec::new()),
            glob_set: Mutex::new(None),
        };
        manager.reload_rules().expect("Failed to load tag rules");
        manager
    }

    pub fn reload_rules(&self) -> Result<()> {
        let conn = self.db.get_connection();
        let mut stmt = conn.prepare("SELECT id, enabled, name, method, matching_rule, tag, is_sync, scope, color, bg_color, folder FROM tag_rules")?;
        let rows = stmt.query_map([], |row| {
            Ok(TagRule {
                id: row.get(0)?,
                enabled: row.get::<_, i32>(1)? != 0,
                name: row.get(2)?,
                method: row.get(3)?,
                matching_rule: row.get(4)?,
                tag: row.get(5)?,
                is_sync: row.get::<_, i32>(6)? != 0,
                scope: row.get(7)?,
                color: row.get(8)?,
                bg_color: row.get(9)?,
                folder: row.get(10)?,
            })
        })?;

        let mut rules = Vec::new();
        let mut builder = GlobSetBuilder::new();

        let mut row_count = 0;
        for row in rows {
            let rule = row?;
            row_count += 1;
            if rule.enabled {
                // Support comma separated patterns
                for pattern in rule.matching_rule.split(',') {
                    let pattern = pattern.trim();
                    if !pattern.is_empty() {
                        if let Ok(glob) = Glob::new(pattern) {
                            builder.add(glob);
                        }
                    }
                }
            }
            rules.push(rule);
        }

        let mut rules_lock = self.rules.lock().unwrap();
        *rules_lock = rules;

        let mut glob_lock = self.glob_set.lock().unwrap();
        *glob_lock = builder.build().ok();

        Ok(())
    }

    pub fn get_rules(&self) -> Vec<TagRule> {
        self.rules.lock().unwrap().clone()
    }

    pub fn sync_tagging(&self, uri: &str, method: &str, headers: &HashMap<String, String>) -> Vec<String> {
        let rules = self.rules.lock().unwrap();
        let glob_set_opt = self.glob_set.lock().unwrap();
        
        let mut applied_tags = Vec::new();
        
        if let Some(glob_set) = glob_set_opt.as_ref() {
            // ...
            for rule in rules.iter().filter(|r| r.enabled && r.is_sync && r.scope == "metadata") {
                if rule.method != "ALL" && rule.method != method {
                    continue;
                }

                for pattern in rule.matching_rule.split(',') {
                    let pattern = pattern.trim();
                    if !pattern.is_empty() {
                         if let Ok(glob) = Glob::new(pattern) {
                             if glob.compile_matcher().is_match(uri) {
                                applied_tags.push(rule.tag.clone());
                                break; // Match found for this rule
                             }
                         }
                    }
                }
            }
        }
        
        applied_tags
    }

    pub fn async_tagging(&self, id: String, uri: String, method: String, headers: HashMap<String, String>, body: Vec<u8>, app_handle: AppHandle) {
        let manager_arc = Arc::new(self.clone_for_async()); // Minimal clone or use reference
        let db_arc = Arc::clone(&self.db);
        
        tokio::task::spawn_blocking(move || {
            let mut applied_tags = Vec::new();
            
            // Re-run sync-like check for metadata if it wasn't already tagged or just run all async rules
            let rules = manager_arc.rules.lock().unwrap();
            
            for rule in rules.iter().filter(|r| r.enabled && (!r.is_sync || r.scope == "body")) {
                 if rule.method != "ALL" && rule.method != method {
                    continue;
                }

                let mut matched = false;
                for pattern in rule.matching_rule.split(',') {
                    let pattern = pattern.trim();
                    if !pattern.is_empty() {
                         if let Ok(glob) = Glob::new(pattern) {
                             if glob.compile_matcher().is_match(&uri) {
                                matched = true;
                                break;
                             }
                         }
                    }
                }

                if matched {
                    if rule.scope == "body" {
                        // Check body content
                        let body_str = String::from_utf8_lossy(&body);
                        if body_str.contains(&rule.matching_rule) { // Simple contains for body for now, or we could support more complex matching
                             applied_tags.push(rule.tag.clone());
                        }
                    } else {
                        applied_tags.push(rule.tag.clone());
                    }
                }
            }

            if !applied_tags.is_empty() {
                // Get existing tags first? Or just append?
                // For now, let's assume we want to update the entry in DB
                db_arc.update_tags(id.clone(), applied_tags.clone());
                
                // Emit event to FE to update the UI for this specific request
                let _ = app_handle.emit("tags_updated", serde_json::json!({
                    "id": id,
                    "tags": applied_tags
                }));
            }
        });
    }

    // Workaround for moving to thread
    fn clone_for_async(&self) -> Self {
        Self {
            db: Arc::clone(&self.db),
            rules: Mutex::new(self.get_rules()),
            glob_set: Mutex::new(None), // Not needed for deep check yet or rebuild
        }
    }
}

// Tauri Commands for Tag Management
#[tauri::command]
pub async fn get_tags_from_db(manager: tauri::State<'_, Arc<TagManager>>) -> Result<Vec<TagRule>, String> {
    Ok(manager.get_rules())
}

#[tauri::command]
pub async fn add_tag_to_db(manager: tauri::State<'_, Arc<TagManager>>, rule: TagRule) -> Result<(), String> {
    let conn = manager.db.get_connection();
    let res = conn.execute(
        "INSERT INTO tag_rules (id, enabled, name, method, matching_rule, tag, is_sync, scope, color, bg_color, folder) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            rule.id,
            if rule.enabled { 1 } else { 0 },
            rule.name,
            rule.method,
            rule.matching_rule,
            rule.tag,
            if rule.is_sync { 1 } else { 0 },
            rule.scope,
            rule.color,
            rule.bg_color,
            if rule.folder.as_ref().map(|f| f.is_empty()).unwrap_or(true) { None } else { rule.folder.clone() }
        ],
    );

    match res {
        Ok(_) => {
            // Ensure folder exists if provided
            if let Some(folder_name) = rule.folder.as_ref() {
                if !folder_name.is_empty() {
                    let _ = conn.execute("INSERT OR IGNORE INTO tag_folders (name) VALUES (?1)", params![folder_name]);
                }
            }
            drop(conn); // DROP THE LOCK BEFORE RELOADING
            manager.reload_rules().map_err(|e| e.to_string())?;
            Ok(())
        },
        Err(e) => Err(e.to_string())
    }
}

#[tauri::command]
pub async fn update_tag_in_db(manager: tauri::State<'_, Arc<TagManager>>, id: String, rule: TagRule) -> Result<(), String> {
    let conn = manager.db.get_connection();
    let res = conn.execute(
        "UPDATE tag_rules SET enabled = ?1, name = ?2, method = ?3, matching_rule = ?4, tag = ?5, is_sync = ?6, scope = ?7, color = ?8, bg_color = ?9, folder = ?10 WHERE id = ?11",
        params![
            if rule.enabled { 1 } else { 0 },
            rule.name,
            rule.method,
            rule.matching_rule,
            rule.tag,
            if rule.is_sync { 1 } else { 0 },
            rule.scope,
            rule.color,
            rule.bg_color,
            if rule.folder.as_ref().map(|f| f.is_empty()).unwrap_or(true) { None } else { rule.folder.clone() },
            id
        ],
    );

    match res {
        Ok(_) => {
            if let Some(folder_name) = rule.folder.as_ref() {
                if !folder_name.is_empty() {
                    let _ = conn.execute("INSERT OR IGNORE INTO tag_folders (name) VALUES (?1)", params![folder_name]);
                }
            }
            drop(conn); // DROP LOCK
            manager.reload_rules().map_err(|e| e.to_string())?;
            Ok(())
        },
        Err(e) => Err(e.to_string())
    }
}

#[tauri::command]
pub async fn delete_tag_from_db(manager: tauri::State<'_, Arc<TagManager>>, id: String) -> Result<(), String> {
    let conn = manager.db.get_connection();
    conn.execute("DELETE FROM tag_rules WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
    drop(conn);
    manager.reload_rules().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn toggle_tag_in_db(manager: tauri::State<'_, Arc<TagManager>>, id: String, enabled: bool) -> Result<(), String> {
    let conn = manager.db.get_connection();
    conn.execute("UPDATE tag_rules SET enabled = ?1 WHERE id = ?2", params![if enabled { 1 } else { 0 }, id]).map_err(|e| e.to_string())?;
    drop(conn);
    manager.reload_rules().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn move_tag_to_folder(manager: tauri::State<'_, Arc<TagManager>>, id: String, folder: String) -> Result<(), String> {
    let conn = manager.db.get_connection();
    let folder_val = if folder.trim().is_empty() { None } else { Some(folder) };
    conn.execute("UPDATE tag_rules SET folder = ?1 WHERE id = ?2", params![folder_val, id]).map_err(|e| e.to_string())?;
    drop(conn);
    manager.reload_rules().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_tag_folders(manager: tauri::State<'_, Arc<TagManager>>) -> Result<Vec<String>, String> {
    let conn = manager.db.get_connection();
    let mut stmt = conn.prepare("SELECT name FROM tag_rule_folder").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| row.get(0)).map_err(|e| e.to_string())?;
    let mut folders = Vec::new();
    for row in rows {
        folders.push(row.map_err(|e| e.to_string())?);
    }
    Ok(folders)
}

#[tauri::command]
pub async fn add_tag_folder(manager: tauri::State<'_, Arc<TagManager>>, name: String) -> Result<(), String> {
    let conn = manager.db.get_connection();
    conn.execute("INSERT OR IGNORE INTO tag_rule_folder (name) VALUES (?1)", params![name]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn rename_tag_folder(manager: tauri::State<'_, Arc<TagManager>>, old_name: String, new_name: String) -> Result<(), String> {
    let conn = manager.db.get_connection();
    
    // 1. Update the folder name in tag_rule_folder
    conn.execute("UPDATE tag_rule_folder SET name = ?1 WHERE name = ?2", params![new_name, old_name]).map_err(|e| e.to_string())?;
    
    // 2. Update all tag rules that use this folder
    conn.execute("UPDATE tag_rules SET folder = ?1 WHERE folder = ?2", params![new_name, old_name]).map_err(|e| e.to_string())?;
    
    drop(conn);
    manager.reload_rules().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn delete_tag_folder_from_db(manager: tauri::State<'_, Arc<TagManager>>, name: String) -> Result<(), String> {
    let conn = manager.db.get_connection();
    conn.execute("DELETE FROM tag_rule_folder WHERE name = ?1", params![name]).map_err(|e| e.to_string())?;
    // Optionally delete or move tags in this folder
    conn.execute("UPDATE tag_rules SET folder = NULL WHERE folder = ?1", params![name]).map_err(|e| e.to_string())?;
    drop(conn);
    manager.reload_rules().map_err(|e| e.to_string())?;
    Ok(())
}
