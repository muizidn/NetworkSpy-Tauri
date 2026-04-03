use std::sync::Arc;
use std::sync::atomic::AtomicBool;

pub struct ScriptManager {
    pub is_enabled: Arc<AtomicBool>,
}

impl ScriptManager {
    pub fn new() -> Self {
        Self {
            is_enabled: Arc::new(AtomicBool::new(true)), // Enabled by default if user adds scripts
        }
    }
}
