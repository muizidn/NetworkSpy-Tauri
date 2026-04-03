use std::sync::Arc;
use std::sync::atomic::AtomicBool;
use std::collections::HashMap;
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct BreakpointData {
    pub id: String,
    pub headers: HashMap<String, String>,
    pub body: Vec<u8>,
    pub method: Option<String>,
    pub uri: Option<String>,
    pub status_code: Option<u16>,
}

pub struct PausedTask {
    pub sender: tokio::sync::oneshot::Sender<Option<BreakpointData>>,
    pub name: String,
    pub data: BreakpointData,
}

pub struct BreakpointManager {
    pub is_enabled: Arc<AtomicBool>,
    pub paused_tasks: Arc<RwLock<HashMap<String, PausedTask>>>,
}

impl BreakpointManager {
    pub fn new() -> Self {
        Self {
            is_enabled: Arc::new(AtomicBool::new(false)),
            paused_tasks: Arc::new(RwLock::new(HashMap::new())),
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct BreakpointHit {
    pub id: String,
    pub name: String,
}
