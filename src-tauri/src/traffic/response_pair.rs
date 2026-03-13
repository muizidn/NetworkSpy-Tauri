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
    let traffic = db.get_traffic(traffic_id).unwrap_or(None);

    if let Some(row) = traffic {
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

        return ResponsePairData {
            headers: header_list,
            params: vec![], // TODO: Parse params if needed
            body: row.res_body.unwrap_or_default(),
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
