use std::sync::Arc;
use crate::traffic::db::TrafficDb;
use tauri::State;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ResponsePairData {
    pub headers: Vec<KeyValue>,
    pub params: Vec<KeyValue>,
    pub body: String,
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
pub fn get_response_pair_data(
    traffic_id: String,
    db: State<'_, Arc<TrafficDb>>,
) -> ResponsePairData {
    let metadata = db.get_traffic_metadata(traffic_id.clone()).unwrap_or(None);

    if let Some(row) = metadata {
        let headers: HashMap<String, String> =
            serde_json::from_str(row.res_headers.as_deref().unwrap_or_default()).unwrap_or_default();
        
        let header_list: Vec<KeyValue> = headers
            .into_iter()
            .map(|(k, v)| KeyValue {
                key: k,
                value: ValueType::String(v),
            })
            .collect();

        let content_type = row.res_headers.as_ref()
            .and_then(|h| {
                let hm: HashMap<String, String> = serde_json::from_str(h).ok()?;
                hm.get("content-type").or_else(|| hm.get("Content-Type")).cloned()
            })
            .unwrap_or_else(|| "text/plain".to_string());

        let body_bytes = db.get_response_body(traffic_id).unwrap_or(None);
        let body_str = body_bytes.map(|b| String::from_utf8_lossy(&b).to_string()).unwrap_or_default();

        return ResponsePairData {
            headers: header_list,
            params: vec![],
            body: body_str,
            content_type,
            intercepted: row.intercepted,
        };
    }

    // Fallback or empty if not found
    ResponsePairData {
        headers: vec![],
        params: vec![],
        body: "".to_string(),
        content_type: "text/plain".to_string(),
        intercepted: true,
    }
}
