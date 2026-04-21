use crate::*;
use josekit::jwe::{JweHeader, serialize_compact, deserialize_compact};
use josekit::jwe::RSA_OAEP_256;
use josekit::jwk::Jwk;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::Manager;
use hostname;
use uuid::Uuid;

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
    license_key: String,
) -> Result<LicenseVerificationResult, String> {
    let state = app.state::<ManagedProxySettings>();
    let db = app.state::<Arc<traffic::db::TrafficDb>>();
    
    // 1. Get or generate Device ID
    let mut device_id = {
        let settings = state.0.read().map_err(|e| e.to_string())?;
        settings.device_id.clone()
    };

    if device_id.is_empty() {
        device_id = Uuid::new_v4().to_string();
        let mut settings = state.0.write().map_err(|e| e.to_string())?;
        settings.device_id = device_id.clone();
        
        // Save to DB
        let val = serde_json::to_string(&*settings).map_err(|e| e.to_string())?;
        let _ = db.set_setting("proxy_settings", &val);
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
        let mut settings = state.0.write().map_err(|e| e.to_string())?;
        settings.license_key = license_key;
        let val = serde_json::to_string(&*settings).map_err(|e| e.to_string())?;
        let _ = db.set_setting("proxy_settings", &val);
    }

    println!("DEBUG: verify_license result: {:?}", result);
    Ok(result)
}
