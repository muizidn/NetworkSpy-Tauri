use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, RwLock};
use crate::traffic::db::{BreakpointRule, ProxyRule, MapLocalRule, FilterPreset, ScriptRule};
use crate::traffic::schema::map_remote::MapRemoteRule;
use crate::settings::ProxySettings;
use std::collections::HashMap;

use crate::traffic::viewers::{Viewer, ViewerFolder};
use crate::traffic::bottom_pane::CustomChecker;
use crate::traffic::sessions::{Session, SessionFolder};

#[derive(Serialize, Deserialize, Default, Clone)]
pub struct AppConfig {
    #[serde(default)]
    pub proxy_settings: ProxySettings,
    #[serde(default)]
    pub proxy_rules: Vec<ProxyRule>,
    #[serde(default)]
    pub map_local_rules: Vec<MapLocalRule>,
    #[serde(default)]
    pub map_remote_rules: Vec<MapRemoteRule>,
    #[serde(default)]
    pub breakpoints: Vec<BreakpointRule>,
    #[serde(default)]
    pub filter_presets: Vec<FilterPreset>,
    #[serde(default)]
    pub scripts: Vec<ScriptRule>,
    #[serde(default)]
    pub viewers: Vec<Viewer>,
    #[serde(default)]
    pub viewer_folders: Vec<ViewerFolder>,
    #[serde(default)]
    pub custom_checkers: Vec<CustomChecker>,
    #[serde(default)]
    pub sessions: Vec<Session>,
    #[serde(default)]
    pub session_folders: Vec<SessionFolder>,
    #[serde(default)]
    pub extra_settings: HashMap<String, String>,
}

pub struct ConfigManager {
    config_path: Arc<RwLock<PathBuf>>,
    config: Arc<RwLock<AppConfig>>,
}

impl ConfigManager {
    pub fn new(base_dir: PathBuf) -> Self {
        let config_path = base_dir.join("file.networkspy");
        let config = if config_path.exists() {
            let content = fs::read_to_string(&config_path).unwrap_or_default();
            serde_yaml::from_str(&content).unwrap_or_else(|e| {
                eprintln!("Failed to parse config file: {}. Using default.", e);
                AppConfig::default()
            })
        } else {
            AppConfig::default()
        };

        Self {
            config_path: Arc::new(RwLock::new(config_path)),
            config: Arc::new(RwLock::new(config)),
        }
    }

    pub fn set_base_dir(&self, base_dir: PathBuf) -> Result<(), Box<dyn std::error::Error>> {
        let new_path = base_dir.join("file.networkspy");
        {
            let mut path = self.config_path.write().unwrap();
            *path = new_path;
        }
        self.reload()
    }

    pub fn reload(&self) -> Result<(), Box<dyn std::error::Error>> {
        let path = self.config_path.read().unwrap();
        if path.exists() {
            let content = fs::read_to_string(&*path)?;
            let new_config: AppConfig = serde_yaml::from_str(&content)?;
            *self.config.write().unwrap() = new_config;
        } else {
            *self.config.write().unwrap() = AppConfig::default();
        }
        Ok(())
    }

    pub fn save(&self) -> Result<(), Box<dyn std::error::Error>> {
        let config = self.config.read().unwrap();
        let content = serde_yaml::to_string(&*config)?;
        fs::write(&*self.config_path.read().unwrap(), content)?;
        Ok(())
    }

    pub fn get_config(&self) -> AppConfig {
        self.config.read().unwrap().clone()
    }

    pub fn update<F, R>(&self, f: F) -> Result<R, Box<dyn std::error::Error>>
    where
        F: FnOnce(&mut AppConfig) -> R,
    {
        let res = {
            let mut config = self.config.write().unwrap();
            f(&mut config)
        };
        self.save()?;
        Ok(res)
    }

    pub fn get_proxy_settings(&self) -> ProxySettings {
        self.config.read().unwrap().proxy_settings.clone()
    }

    pub fn set_proxy_settings(&self, settings: ProxySettings) -> Result<(), Box<dyn std::error::Error>> {
        self.update(|c| c.proxy_settings = settings)
    }

    pub fn get_proxy_rules(&self) -> Vec<ProxyRule> {
        self.config.read().unwrap().proxy_rules.clone()
    }

    pub fn save_proxy_rule(&self, rule: ProxyRule) -> Result<(), Box<dyn std::error::Error>> {
        self.update(|c| {
            if let Some(pos) = c.proxy_rules.iter().position(|r| r.id == rule.id) {
                c.proxy_rules[pos] = rule;
            } else {
                c.proxy_rules.push(rule);
            }
        })
    }

    pub fn delete_proxy_rule(&self, id: String) -> Result<(), Box<dyn std::error::Error>> {
        self.update(|c| {
            c.proxy_rules.retain(|r| r.id != id);
        })
    }

    pub fn get_map_local_rules(&self) -> Vec<MapLocalRule> {
        self.config.read().unwrap().map_local_rules.clone()
    }

    pub fn save_map_local_rule(&self, rule: MapLocalRule) -> Result<(), Box<dyn std::error::Error>> {
        self.update(|c| {
            if let Some(pos) = c.map_local_rules.iter().position(|r| r.id == rule.id) {
                c.map_local_rules[pos] = rule;
            } else {
                c.map_local_rules.push(rule);
            }
        })
    }

    pub fn delete_map_local_rule(&self, id: String) -> Result<(), Box<dyn std::error::Error>> {
        self.update(|c| {
            c.map_local_rules.retain(|r| r.id != id);
        })
    }

    pub fn get_map_remote_rules(&self) -> Vec<MapRemoteRule> {
        self.config.read().unwrap().map_remote_rules.clone()
    }

    pub fn save_map_remote_rule(&self, mut rule: MapRemoteRule) -> Result<(), Box<dyn std::error::Error>> {
        self.update(|c| {
            if let Some(id) = rule.id {
                if let Some(pos) = c.map_remote_rules.iter().position(|r| r.id == Some(id)) {
                    c.map_remote_rules[pos] = rule;
                } else {
                    c.map_remote_rules.push(rule);
                }
            } else {
                let next_id = c.map_remote_rules.iter()
                    .filter_map(|r| r.id)
                    .max()
                    .unwrap_or(0) + 1;
                rule.id = Some(next_id);
                c.map_remote_rules.push(rule);
            }
        })
    }

    pub fn delete_map_remote_rule(&self, id: i64) -> Result<(), Box<dyn std::error::Error>> {
        self.update(|c| {
            c.map_remote_rules.retain(|r| r.id != Some(id));
        })
    }

    pub fn get_breakpoints(&self) -> Vec<BreakpointRule> {
        self.config.read().unwrap().breakpoints.clone()
    }

    pub fn save_breakpoint(&self, rule: BreakpointRule) -> Result<(), Box<dyn std::error::Error>> {
        self.update(|c| {
            if let Some(pos) = c.breakpoints.iter().position(|r| r.id == rule.id) {
                c.breakpoints[pos] = rule;
            } else {
                c.breakpoints.push(rule);
            }
        })
    }

    pub fn delete_breakpoint(&self, id: String) -> Result<(), Box<dyn std::error::Error>> {
        self.update(|c| {
            c.breakpoints.retain(|r| r.id != id);
        })
    }

    pub fn get_filter_presets(&self) -> Vec<FilterPreset> {
        self.config.read().unwrap().filter_presets.clone()
    }

    pub fn add_filter_preset(&self, preset: FilterPreset) -> Result<(), Box<dyn std::error::Error>> {
        self.update(|c| {
            c.filter_presets.push(preset);
        })
    }

    pub fn update_filter_preset(&self, id: String, name: Option<String>, description: Option<String>, filters: Option<String>) -> Result<(), Box<dyn std::error::Error>> {
        self.update(|c| {
            if let Some(preset) = c.filter_presets.iter_mut().find(|p| p.id == id) {
                if let Some(n) = name { preset.name = n; }
                if let Some(d) = description { preset.description = Some(d); }
                if let Some(f) = filters { preset.filters = f; }
            }
        })
    }

    pub fn delete_filter_preset(&self, id: String) -> Result<(), Box<dyn std::error::Error>> {
        self.update(|c| {
            c.filter_presets.retain(|p| p.id != id);
        })
    }

    pub fn get_scripts(&self) -> Vec<ScriptRule> {
        self.config.read().unwrap().scripts.clone()
    }

    pub fn save_script(&self, rule: ScriptRule) -> Result<(), Box<dyn std::error::Error>> {
        self.update(|c| {
            if let Some(pos) = c.scripts.iter().position(|r| r.id == rule.id) {
                c.scripts[pos] = rule;
            } else {
                c.scripts.push(rule);
            }
        })
    }

    pub fn delete_script(&self, id: String) -> Result<(), Box<dyn std::error::Error>> {
        self.update(|c| {
            c.scripts.retain(|r| r.id != id);
        })
    }

    pub fn set_script_error(&self, id: String, error: Option<String>) -> Result<(), Box<dyn std::error::Error>> {
        self.update(|c| {
            if let Some(script) = c.scripts.iter_mut().find(|s| s.id == id) {
                script.error = error;
            }
        })
    }

    pub fn get_setting(&self, key: &str) -> Option<String> {
        self.config.read().unwrap().extra_settings.get(key).cloned()
    }

    pub fn set_setting(&self, key: String, value: String) -> Result<(), Box<dyn std::error::Error>> {
        self.update(|c| {
            c.extra_settings.insert(key, value);
        })
    }
}
