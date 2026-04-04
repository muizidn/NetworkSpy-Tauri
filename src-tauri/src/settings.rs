use std::sync::Arc;
use tokio::sync::RwLock as AsyncRwLock;
use std::sync::RwLock as StdRwLock;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct ProxySettings {
    #[serde(default = "default_true")]
    pub show_connect_method: bool,
    #[serde(default)]
    pub stream_certificate_logs: bool,
    #[serde(default = "default_true")]
    pub mcp_stdio_enabled: bool,
    #[serde(default = "default_true")]
    pub mcp_http_enabled: bool,
}

fn default_true() -> bool { true }

impl Default for ProxySettings {
    fn default() -> Self {
        Self {
            show_connect_method: true,
            stream_certificate_logs: false,
            mcp_stdio_enabled: true,
            mcp_http_enabled: true,
        }
    }
}

pub struct ManagedProxySettings(pub Arc<StdRwLock<ProxySettings>>);
pub struct InterceptAllowList(pub Arc<AsyncRwLock<Vec<String>>>);
