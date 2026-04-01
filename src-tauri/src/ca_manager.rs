use rcgen::{Certificate, CertificateParams, DistinguishedName, DnType, IsCa, KeyUsagePurpose, BasicConstraints, PKCS_ECDSA_P256_SHA256};
use std::fs;
use std::path::PathBuf;
use time::{OffsetDateTime, Duration as TimeDuration};
use uuid::Uuid;

pub struct CaKeys {
    pub cert: String,
    pub key: String,
}

pub fn load_or_generate_ca(app_data_dir: PathBuf) -> Result<CaKeys, String> {
    let ca_dir = app_data_dir.join("ca");
    if !ca_dir.exists() {
        fs::create_dir_all(&ca_dir).map_err(|e| e.to_string())?;
    }

    let cert_path = ca_dir.join("network-spy.crt");
    let key_path = ca_dir.join("network-spy.key");

    if cert_path.exists() && key_path.exists() {
        let cert = fs::read_to_string(cert_path).map_err(|e| e.to_string())?;
        let key = fs::read_to_string(key_path).map_err(|e| e.to_string())?;
        return Ok(CaKeys { cert, key });
    }

    // Generate new CA with High Compatibility (ECDSA P-256)
    // This curve is supported by all modern browsers (Chrome 1+, Safari 4+, Firefox 2+)
    let mut params = CertificateParams::default();
    params.is_ca = IsCa::Ca(BasicConstraints::Unconstrained);
    params.key_usages = vec![
        KeyUsagePurpose::KeyCertSign, 
        KeyUsagePurpose::DigitalSignature, 
        KeyUsagePurpose::CrlSign
    ];
    
    // Standard validity for a root CA (10 years)
    let now = OffsetDateTime::now_utc();
    params.not_before = now;
    params.not_after = now + TimeDuration::days(3650);
    
    // Efficient and widely compatible ECDSA algorithm
    params.alg = &PKCS_ECDSA_P256_SHA256;
    
    let date = format!("{}-{:02}-{:02}", now.year(), now.month() as u8, now.day());
    let host = hostname::get()
        .map(|h| h.to_string_lossy().to_string())
        .unwrap_or_else(|_| "unknown".to_string());
    let uid = Uuid::new_v4().to_string().split('-').next().unwrap_or("unique").to_string();
    
    // Common Name should be clear and descriptive
    let ca_name = format!("Network Spy CA ({}, {}, {})", date, host, uid);
    
    let mut dn = DistinguishedName::new();
    dn.push(DnType::CommonName, ca_name.clone());
    dn.push(DnType::OrganizationName, "NetworkSpy");
    dn.push(DnType::CountryName, "US");
    params.distinguished_name = dn;

    let cert = Certificate::from_params(params).map_err(|e| e.to_string())?;
    let cert_pem = cert.serialize_pem().map_err(|e| e.to_string())?;
    let key_pem = cert.serialize_private_key_pem();

    fs::write(&cert_path, &cert_pem).map_err(|e| e.to_string())?;
    fs::write(&key_path, &key_pem).map_err(|e| e.to_string())?;

    Ok(CaKeys { cert: cert_pem, key: key_pem })
}
