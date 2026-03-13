use std::sync::Arc;
use crate::traffic::db::TrafficDb;
use tauri::{State, AppHandle, Manager};
use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RequestPairData {
    pub headers: Vec<KeyValue>,
    pub params: Vec<KeyValue>,
    pub body_path: Option<String>,
    pub content_type: String,
    pub intercepted: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct KeyValue {
    pub key: String,
    pub value: ValueType,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(untagged)]
pub enum ValueType {
    String(String),
    Array(Vec<String>),
}

#[tauri::command]
pub fn get_request_pair_data(
    app: AppHandle,
    traffic_id: String,
    db: State<'_, Arc<TrafficDb>>,
) -> RequestPairData {
    let metadata = db.get_traffic_metadata(traffic_id.clone()).unwrap_or(None);

    if let Some(row) = metadata {
        let headers: HashMap<String, String> =
            serde_json::from_str(row.req_headers.as_deref().unwrap_or_default()).unwrap_or_default();
        
        let header_list: Vec<KeyValue> = headers
            .into_iter()
            .map(|(k, v)| KeyValue {
                key: k,
                value: ValueType::String(v),
            })
            .collect();

        let content_type = row.req_headers.as_ref()
            .and_then(|h| {
                let hm: HashMap<String, String> = serde_json::from_str(h).ok()?;
                hm.get("content-type").or_else(|| hm.get("Content-Type")).cloned()
            })
            .unwrap_or_else(|| "text/plain".to_string());

        let body_bytes = db.get_request_body(traffic_id.clone()).unwrap_or(None).unwrap_or_default();
        let mut body_path = None;

        if !body_bytes.is_empty() {
            if let Ok(app_data_dir) = app.path().app_data_dir() {
                let bodies_dir = app_data_dir.join("bodies");
                let _ = std::fs::create_dir_all(&bodies_dir);
                let file_path = bodies_dir.join(format!("req_{}.bin", traffic_id));
                if std::fs::write(&file_path, &body_bytes).is_ok() {
                    body_path = Some(file_path.to_string_lossy().to_string());
                }
            }
        }

        return RequestPairData {
            headers: header_list,
            params: vec![],
            body_path,
            content_type,
            intercepted: row.intercepted,
        };
    }

    // Fallback or empty if not found
    RequestPairData {
        headers: vec![],
        params: vec![],
        body_path: None,
        content_type: "text/plain".to_string(),
        intercepted: true,
    }
}
