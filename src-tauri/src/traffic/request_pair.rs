use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RequestPairData {
    pub headers: Vec<KeyValue>,
    pub params: Vec<KeyValue>,
    pub body: String,
    pub content_type: String,
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
pub fn get_request_pair_data(traffic_id: String) -> RequestPairData {
    return RequestPairData {
        headers: vec![
            KeyValue {
                key: "Authorization".to_string(),
                value: ValueType::String("Bearer token".to_string()),
            },
            KeyValue {
                key: "X-Cloudflare".to_string(),
                value: ValueType::String("Nonce, misharp".to_string()),
            },
            KeyValue {
                key: "Content-Type".to_string(),
                value: ValueType::String("application/json".to_string()), // Change this to test other types
            },
        ],
        params: vec![
            KeyValue {
                key: "authToken".to_string(),
                value: ValueType::String("Bearer token".to_string()),
            },
            KeyValue {
                key: "page".to_string(),
                value: ValueType::String("1".to_string()),
            },
            KeyValue {
                key: "perPage".to_string(),
                value: ValueType::String("100".to_string()),
            },
            KeyValue {
                key: "product_ids".to_string(),
                value: ValueType::Array(vec!["id1".to_string(), "id2".to_string()]),
            },
        ],
        body: r#"
        {
            "id": "4541600237192504000",
            "tags": ["API TESTING", "NETWORK MONITORING"],
            "url": "https://amazon.com:157/product/books?page=1&authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJib29rcyJdLCJpYXQiOjE2MjMzMzAwNzIsImV4cCI6MTYyMzM0MjY3Mn0.WjtjqnszjFL3Gb-F3TSvTKHl5VxbFf4jJ2yyK_SXxxg",
            "client": "Video Streaming VALIDNOR",
            "method": "DELETE",
            "status": "Failed",
            "code": "200",
            "time": "650 ms",
            "duration": "91 bytes",
            "request": "Request data",
            "response": "-"
        }
        "#.to_string(),
        content_type: "application/x-www-form-urlencoded".to_string(), // Change this to test other types
    }
}
