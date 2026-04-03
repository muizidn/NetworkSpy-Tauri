use std::sync::Arc;
use tokio::sync::RwLock as AsyncRwLock;
use std::sync::RwLock as StdRwLock;
use serde::{Deserialize, Serialize};

#[derive(Default, Serialize, Deserialize, Clone)]
pub struct ProxySettings {
    pub show_connect_method: bool,
    pub stream_certificate_logs: bool,
}

pub struct ManagedProxySettings(pub Arc<StdRwLock<ProxySettings>>);
pub struct InterceptAllowList(pub Arc<AsyncRwLock<Vec<String>>>);
