use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use base64::{Engine as _, engine::general_purpose};
use crate::traffic::db::TrafficMetadata;

#[derive(Serialize, Deserialize, Debug)]
pub struct HarLog {
    pub log: HarContent,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct HarContent {
    pub version: String,
    pub creator: HarCreator,
    pub entries: Vec<HarEntry>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct HarCreator {
    pub name: String,
    pub version: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct HarEntry {
    #[serde(rename = "startedDateTime")]
    pub started_date_time: String,
    pub time: u64,
    pub request: HarRequest,
    pub response: HarResponse,
    pub cache: HashMap<String, String>,
    pub timings: HarTimings,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct HarRequest {
    pub method: String,
    pub url: String,
    #[serde(rename = "httpVersion")]
    pub http_version: String,
    pub headers: Vec<HarHeader>,
    #[serde(rename = "queryString")]
    pub query_string: Vec<HarQuery>,
    pub cookies: Vec<HarCookie>,
    #[serde(rename = "headersSize")]
    pub headers_size: i32,
    #[serde(rename = "bodySize")]
    pub body_size: i32,
    #[serde(rename = "postData")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub post_data: Option<HarPostData>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct HarPostData {
    #[serde(rename = "mimeType")]
    pub mime_type: String,
    pub text: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct HarResponse {
    pub status: u16,
    #[serde(rename = "statusText")]
    pub status_text: String,
    #[serde(rename = "httpVersion")]
    pub http_version: String,
    pub headers: Vec<HarHeader>,
    pub cookies: Vec<HarCookie>,
    pub content: HarResponseContent,
    #[serde(rename = "redirectURL")]
    pub redirect_url: String,
    #[serde(rename = "headersSize")]
    pub headers_size: i32,
    #[serde(rename = "bodySize")]
    pub body_size: i32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct HarResponseContent {
    pub size: usize,
    #[serde(rename = "mimeType")]
    pub mime_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub encoding: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct HarHeader {
    pub name: String,
    pub value: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct HarQuery {
    pub name: String,
    pub value: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct HarCookie {
    pub name: String,
    pub value: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct HarTimings {
    pub send: i32,
    pub wait: i32,
    pub receive: i32,
}

pub fn create_har_log(entries: Vec<(TrafficMetadata, Option<Vec<u8>>, Option<Vec<u8>>)>) -> HarLog {
    let har_entries = entries.into_iter().map(|(meta, req_body, res_body)| {
        let req_headers: HashMap<String, String> = serde_json::from_str(meta.req_headers.as_deref().unwrap_or_default()).unwrap_or_default();
        let res_headers: HashMap<String, String> = serde_json::from_str(meta.res_headers.as_deref().unwrap_or_default()).unwrap_or_default();

        let har_req_headers = req_headers.iter().map(|(k, v)| HarHeader { name: k.clone(), value: v.clone() }).collect();
        let har_res_headers = res_headers.iter().map(|(k, v)| HarHeader { name: k.clone(), value: v.clone() }).collect();

        let req_mime = req_headers.get("content-type").or_else(|| req_headers.get("Content-Type")).cloned().unwrap_or_else(|| "application/octet-stream".to_string());
        let res_mime = res_headers.get("content-type").or_else(|| res_headers.get("Content-Type")).cloned().unwrap_or_else(|| "application/octet-stream".to_string());

        let (res_text, res_encoding) = if let Some(body) = res_body {
            match String::from_utf8(body.clone()) {
                Ok(text) => (Some(text), None),
                Err(_) => (Some(general_purpose::STANDARD.encode(&body)), Some("base64".to_string())),
            }
        } else {
            (None, None)
        };

        let post_data = req_body.map(|body| {
            let text = String::from_utf8(body).unwrap_or_else(|b| general_purpose::STANDARD.encode(b.into_bytes()));
            HarPostData {
                mime_type: req_mime.clone(),
                text,
            }
        });

        HarEntry {
            started_date_time: meta.timestamp,
            time: 0,
            request: HarRequest {
                method: meta.method.unwrap_or_default(),
                url: meta.uri.unwrap_or_default(),
                http_version: meta.version.unwrap_or_default(),
                headers: har_req_headers,
                query_string: vec![],
                cookies: vec![],
                headers_size: -1,
                body_size: meta.req_body_size as i32,
                post_data,
            },
            response: HarResponse {
                status: meta.status_code.unwrap_or(0) as u16,
                status_text: "".to_string(), // Simplified
                http_version: "HTTP/1.1".to_string(),
                headers: har_res_headers,
                cookies: vec![],
                content: HarResponseContent {
                    size: meta.res_body_size,
                    mime_type: res_mime,
                    text: res_text,
                    encoding: res_encoding,
                },
                redirect_url: "".to_string(),
                headers_size: -1,
                body_size: meta.res_body_size as i32,
            },
            cache: HashMap::new(),
            timings: HarTimings { send: 0, wait: 0, receive: 0 },
        }
    }).collect();

    HarLog {
        log: HarContent {
            version: "1.2".to_string(),
            creator: HarCreator {
                name: "NetworkSpy".to_string(),
                version: "1.0".to_string(),
            },
            entries: har_entries,
        },
    }
}
