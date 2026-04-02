use std::sync::atomic::{AtomicU16, AtomicU64, AtomicUsize};
use tokio::sync::mpsc;
use once_cell::sync::OnceCell;
use std::collections::HashMap;
use flate2::read::{GzDecoder, ZlibDecoder};
use std::io::Read;
use serde::Serialize;
use std::sync::Arc;

pub struct TrayStats {
    pub total_requests: AtomicUsize,
    pub tx_bytes: AtomicU64,
    pub rx_bytes: AtomicU64,
}

impl TrayStats {
    pub fn new() -> Self {
        Self {
            total_requests: AtomicUsize::new(0),
            tx_bytes: AtomicU64::new(0),
            rx_bytes: AtomicU64::new(0),
        }
    }
}

pub static TRAY_STATS: OnceCell<Arc<TrayStats>> = OnceCell::new();
pub static ACTUAL_PORT: AtomicU16 = AtomicU16::new(9090);
pub static RESTART_TX: OnceCell<mpsc::UnboundedSender<u16>> = OnceCell::new();

pub fn format_bytes(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;

    if bytes >= GB {
        format!("{:.2} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.2} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.2} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} B", bytes)
    }
}

pub fn decompress_body(headers: &HashMap<String, String>, body: Vec<u8>) -> Vec<u8> {
    let encoding = headers.get("content-encoding").or_else(|| headers.get("Content-Encoding"));
    
    match encoding.map(|s| s.to_lowercase()).as_deref() {
        Some("gzip") => {
            let mut decoder = GzDecoder::new(&body[..]);
            let mut decoded = Vec::new();
            if decoder.read_to_end(&mut decoded).is_ok() {
                return decoded;
            }
        }
        Some("deflate") => {
            let mut decoder = ZlibDecoder::new(&body[..]);
            let mut decoded = Vec::new();
            if decoder.read_to_end(&mut decoded).is_ok() {
                return decoded;
            }
        }
        Some("br") => {
            let mut decoded = Vec::new();
            let mut reader = brotli::Decompressor::new(&body[..], 4096);
            if reader.read_to_end(&mut decoded).is_ok() {
                return decoded;
            }
        }
        _ => {}
    }
    body
}

#[derive(Clone, Serialize)]
pub struct PayloadTraffic {
    pub uri: Option<String>,
    pub method: Option<String>,
    pub version: Option<String>,
    pub body_size: usize,
    pub headers: HashMap<String, String>,
    pub intercepted: bool,
    pub status_code: Option<u16>,
    pub client: Option<String>,
    pub tags: Vec<String>,
}

#[derive(Clone, Serialize)]
pub struct Payload {
    pub id: String,
    pub is_request: bool,
    pub data: PayloadTraffic,
}
