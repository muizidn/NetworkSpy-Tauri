use crate::*;
use josekit::jwe::{JweHeader, serialize_compact, deserialize_compact};
use josekit::jwe::RSA_OAEP_256;
use josekit::jwk::Jwk;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::Manager;
use hostname;
use keyring::Entry;
use std::sync::RwLock;
use once_cell::sync::Lazy;
use sha2::{Sha256, Digest};
use mac_address::get_mac_address;

const SERVICE_NAME: &str = "app.networkspy.license";
const KEYCHAIN_USER: &str = "networkspy_user";

pub struct LicenseState {
    pub plan: Option<String>,
    pub features: Option<serde_json::Value>,
}

static CACHED_LICENSE: Lazy<RwLock<LicenseState>> = Lazy::new(|| {
    RwLock::new(LicenseState {
        plan: None,
        features: None,
    })
});

fn get_stable_device_id() -> String {
    if let Ok(Some(ma)) = get_mac_address() {
        let mut hasher = Sha256::new();
        hasher.update(ma.to_string());
        format!("{:x}", hasher.finalize())
    } else {
        "stable-id-fallback".to_string()
    }
}

fn save_license_to_keychain(key: &str) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, KEYCHAIN_USER).map_err(|e: keyring::Error| e.to_string())?;
    entry.set_password(key).map_err(|e: keyring::Error| e.to_string())
}

#[tauri::command]
pub fn get_license_from_keychain() -> Result<String, String> {
    let entry = Entry::new(SERVICE_NAME, KEYCHAIN_USER).map_err(|e: keyring::Error| e.to_string())?;
    entry.get_password().map_err(|e: keyring::Error| e.to_string())
}

#[tauri::command]
pub fn revoke_license_from_keychain() -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, KEYCHAIN_USER).map_err(|e| e.to_string())?;
    let _ = entry.delete_credential();

    // Clear Cache
    if let Ok(mut cache) = CACHED_LICENSE.write() {
        cache.plan = None;
        cache.features = None;
    }
    
    Ok(())
}

#[derive(Serialize, Deserialize, Debug)]
struct LicenseRequest {
    license_key: String,
    device_id: String,
    device_name: String,
    public_key: String, // JWK string
}

#[derive(Serialize, Deserialize, Debug)]
struct EncryptedPayload {
    payload: String, // Compact JWE
}

#[derive(Serialize, Deserialize, Debug)]
struct EncryptedResponse {
    encrypted: String, // Compact JWE
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LicenseVerificationResult {
    pub success: bool,
    pub message: String,
    pub plan: Option<String>,
    pub error: Option<String>,
    pub features: Option<serde_json::Value>,
}

#[tauri::command]
pub async fn verify_license(
    app: tauri::AppHandle,
    license_key: Option<String>,
) -> Result<LicenseVerificationResult, String> {
    let state = app.state::<ManagedProxySettings>();
    let db = app.state::<Arc<traffic::db::TrafficDb>>();
    
    // Determine the key to use (provided or from keychain)
    let license_key = match license_key {
        Some(k) => k,
        None => {
            match get_license_from_keychain() {
                Ok(k) => k,
                Err(_) => {
                    return Ok(LicenseVerificationResult {
                        success: false,
                        message: "No license key found".to_string(),
                        plan: Some("free".to_string()),
                        error: None,
                        features: None,
                    });
                }
            }
        }
    };
    
    // 1. Get or generate Stable Device ID
    let device_id = get_stable_device_id();

    // Update settings if it changed (optional, but keeps it in sync)
    {
        let mut settings = state.0.write().map_err(|e| e.to_string())?;
        if settings.device_id != device_id {
            settings.device_id = device_id.clone();
            let val = serde_json::to_string(&*settings).map_err(|e| e.to_string())?;
            let _ = db.set_setting("proxy_settings", &val);
        }
    }

    let device_name = hostname::get()
        .map(|h| h.to_string_lossy().into_owned())
        .unwrap_or_else(|_| "Unknown Machine".to_string());

    // 2. Fetch Server Public Key
    let api_base = env!("API_BASE_URL");
    let client = reqwest::Client::new();
    let server_jwk_json: serde_json::Value = {
        let resp = client
            .get(format!("{}/api/license/public-key", api_base))
            .send()
            .await
            .map_err(|e| {
                format!("Failed to fetch public key: {}", e)
            })?;
        
        
        let resp_text = resp
            .text()
            .await
            .map_err(|e| {
                format!("Failed to get response text: {}", e)
            })?;
        
        
        serde_json::from_str(&resp_text).map_err(|e| {
            format!("Failed to parse public key JSON: {}", e)
        })?
    };

    let server_jwk = Jwk::from_map(server_jwk_json.as_object().unwrap().clone())
        .map_err(|e| format!("Invalid Server JWK: {}", e))?;

    // 3. Generate Client Key Pair (RSA 2048)
    let client_key_pair = Jwk::generate_rsa_key(2048)
        .map_err(|e| format!("Failed to generate client keys: {}", e))?;
    
    let client_public_jwk = client_key_pair.to_public_key()
        .map_err(|e| format!("Failed to get public key: {}", e))?;
    let client_public_jwk_json = serde_json::to_string(&client_public_jwk)
        .map_err(|e| format!("Failed to serialize client public key: {}", e))?;

    // 4. Encrypt LicenseRequest using Server Public Key
    let req_data = LicenseRequest {
        license_key: license_key.clone(),
        device_id,
        device_name,
        public_key: client_public_jwk_json,
    };

    let req_payload = serde_json::to_vec(&req_data).map_err(|e| e.to_string())?;
    
    let mut header = JweHeader::new();
    header.set_algorithm("RSA-OAEP-256");
    header.set_content_encryption("A256GCM");

    let encrypter = RSA_OAEP_256.encrypter_from_jwk(&server_jwk)
        .map_err(|e| format!("Failed to create encrypter: {}", e))?;
    
    let encrypted_request = serialize_compact(&req_payload, &header, &encrypter)
        .map_err(|e| format!("Encryption failed: {}", e))?;

    // 5. POST to verify
    let verify_response = client
        .post(format!("{}/api/license/verify", api_base))
        .json(&EncryptedPayload { payload: encrypted_request })
        .send()
        .await
        .map_err(|e| {
            format!("Verification request failed: {}", e)
        })?;

    if !verify_response.status().is_success() {
        let error_body: serde_json::Value = verify_response.json().await.unwrap_or_default();
        return Ok(LicenseVerificationResult {
            success: false,
            message: "Verification failed".to_string(),
            plan: None,
            error: Some(error_body["error"].as_str().unwrap_or("Unknown server error").to_string()),
            features: None,
        });
    }

    let enc_resp: EncryptedResponse = verify_response
        .json()
        .await
        .map_err(|e| format!("Failed to parse encrypted response: {}", e))?;

    // 6. Decrypt response using Client Private Key
    let decrypter = RSA_OAEP_256.decrypter_from_jwk(&client_key_pair)
        .map_err(|e| format!("Failed to create decrypter: {}", e))?;

    let (decrypted_payload, _header) = deserialize_compact(&enc_resp.encrypted, &decrypter)
        .map_err(|e| format!("Decryption failed: {}", e))?;

    let result: LicenseVerificationResult = serde_json::from_slice(&decrypted_payload)
        .map_err(|e| format!("Failed to parse decrypted result: {}", e))?;

    if result.success {
        // Save to keychain
        let _ = save_license_to_keychain(&license_key);

        // Update Cache
        let mut cache = CACHED_LICENSE.write().map_err(|e| e.to_string())?;
        cache.plan = result.plan.clone();
        cache.features = result.features.clone();
    }

    Ok(result)
}

#[tauri::command]
pub fn license_check_feature(feature: String) -> bool {
    let cache = match CACHED_LICENSE.read() {
        Ok(c) => c,
        Err(_) => return false,
    };

    let plan = cache.plan.as_deref().unwrap_or("free");
    let is_personal = plan == "personal";
    let is_pro = plan == "pro";
    let is_licensed = is_personal || is_pro;

    // Check dynamic features first if they exist
    if let Some(features) = &cache.features {
        if let Some(val) = features.get(&feature) {
             if let Some(b) = val.as_bool() {
                 return b;
             }
        }
    }

    match feature.as_str() {
        "scripting" | "breakpoints" | "mcp" | "premium" => is_licensed,
        "custom_viewers" => is_pro,
        _ => false,
    }
}

#[tauri::command]
pub fn license_get_limit(limit_name: String) -> i32 {
    let cache = match CACHED_LICENSE.read() {
        Ok(c) => c,
        Err(_) => return if limit_name == "max_tabs" { 2 } else { 3 },
    };

    let plan = cache.plan.as_deref().unwrap_or("free");
    let is_personal = plan == "personal";
    let is_pro = plan == "pro";
    let is_licensed = is_personal || is_pro;

    // Check dynamic features first if they exist
    if let Some(features) = &cache.features {
        if let Some(val) = features.get(&limit_name) {
             if let Some(n) = val.as_i64() {
                 return n as i32;
             }
        }
    }

    match limit_name.as_str() {
        "max_tabs" => if is_licensed { 999 } else { 2 },
        "max_filters" => if is_licensed { 999 } else { 3 },
        "max_proxy_rules" => if is_licensed { 999 } else { 3 },
        _ => 0,
    }
}

#[tauri::command]
pub fn license_get_plan() -> String {
    let cache = match CACHED_LICENSE.read() {
        Ok(c) => c,
        Err(_) => return "free".to_string(),
    };

    cache.plan.clone().unwrap_or_else(|| "free".to_string())
}
