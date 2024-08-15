#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::env;
use std::fs;
use std::io::{self, Read}; // Import Read trait here
use std::process::Command;
use tempfile::tempdir;

#[cfg(target_family = "unix")]
use std::os::unix::fs::PermissionsExt;

#[derive(Debug)]
pub struct CertificateInstaller {}

impl CertificateInstaller {
    pub fn install(&self, cert_path: String) -> Result<String, String> {
        #[cfg(target_os = "macos")]
        return self.install_macos(cert_path);

        #[cfg(target_os = "linux")]
        return self.install_linux(cert_path);

        #[cfg(target_os = "windows")]
        return self.install_windows(cert_path);

        Err("Unsupported operating system".into())
    }

    #[cfg(target_os = "macos")]
    fn install_macos(&self, cert_path: String) -> Result<String, String> {
        let script_path = self.get_absolute_path("src/scripts/install_certificate_mac.sh")?;
        let temp_dir = tempdir().map_err(|e| format!("Failed to create temporary directory: {}", e))?;
        let temp_script_path = temp_dir.path().join("install_certificate_mac.sh");
        let temp_cert_path = temp_dir.path().join("certificate.pem");

        // Logging for development
        if cfg!(debug_assertions) {
            println!("macOS Installation Debug Info:");
            println!("Script Path: {:?}", script_path);
            println!("Temp Script Path: {:?}", temp_script_path);
            println!("Temp Certificate Path: {:?}", temp_cert_path);
        }

        fs::copy(&script_path, &temp_script_path).map_err(|e| format!("Failed to copy script file: {}", e))?;
        fs::copy(&cert_path, &temp_cert_path).map_err(|e| format!("Failed to copy certificate file: {}", e))?;

        #[cfg(target_family = "unix")]
        fs::set_permissions(&temp_script_path, fs::Permissions::from_mode(0o755))
            .map_err(|e| format!("Failed to set permissions for script file: {}", e))?;

        let output = Command::new("bash")
            .arg(temp_script_path)
            .arg(temp_cert_path.to_str().unwrap())
            .output()
            .map_err(|e| format!("Failed to execute script on macOS: {}", e))?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }

    #[cfg(target_os = "linux")]
    fn install_linux(&self, cert_path: String) -> Result<String, String> {
        let script_path = self
            .get_absolute_path("src/scripts/install_certificate_linux.sh")
            .map_err(|e| format!("Failed to get absolute path: {}", e))?;

        let cert_path = self
            .get_absolute_path(cert_path.as_str())
            .map_err(|e| format!("Failed to get absolute path: {}", e))?;

        let temp_dir = tempdir().map_err(|e| format!("Failed to create temporary directory: {}", e))?;
        let temp_script_path = temp_dir.path().join("install_certificate_linux.sh");
        let temp_cert_path = temp_dir.path().join("certificate.cer");

        // Logging for development
        if cfg!(debug_assertions) {
            println!("Linux Installation Debug Info:");
            println!("Script Path: {:?}", script_path);
            println!("Cert Path: {:?}", cert_path);
            println!("Temp Directory: {:?}", temp_dir.path());
            println!("Temp Script Path: {:?}", temp_script_path);
            println!("Temp Certificate Path: {:?}", temp_cert_path);
        }

        fs::copy(&script_path, &temp_script_path)
            .map_err(|e| format!("Failed to copy script file: {}", e))?;
        fs::copy(&cert_path, &temp_cert_path)
            .map_err(|e| format!("Failed to copy certificate file: {}", e))?;

        if !temp_script_path.exists() || !temp_cert_path.exists() {
            return Err("Failed to copy files to the temporary directory".to_string());
        }

        let mut original_script = Vec::new();
        let mut temp_script = Vec::new();
        let mut original_cert = Vec::new();
        let mut temp_cert = Vec::new();

        fs::File::open(&script_path)
            .and_then(|mut f| f.read_to_end(&mut original_script))
            .map_err(|e| format!("Failed to read original script file: {}", e))?;
        fs::File::open(&temp_script_path)
            .and_then(|mut f| f.read_to_end(&mut temp_script))
            .map_err(|e| format!("Failed to read temporary script file: {}", e))?;
        fs::File::open(&cert_path)
            .and_then(|mut f| f.read_to_end(&mut original_cert))
            .map_err(|e| format!("Failed to read original certificate file: {}", e))?;
        fs::File::open(&temp_cert_path)
            .and_then(|mut f| f.read_to_end(&mut temp_cert))
            .map_err(|e| format!("Failed to read temporary certificate file: {}", e))?;

        if original_script != temp_script {
            return Err("Script file contents do not match".to_string());
        }

        if original_cert != temp_cert {
            return Err("Certificate file contents do not match".to_string());
        }

        #[cfg(target_family = "unix")]
        fs::set_permissions(&temp_script_path, fs::Permissions::from_mode(0o755))
            .map_err(|e| format!("Failed to set permissions for script file: {}", e))?;

        let output = Command::new("bash")
            .arg(temp_script_path)
            .arg(temp_cert_path.to_str().unwrap())
            .output()
            .map_err(|e| format!("Failed to execute script on Linux: {}", e))?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }

    #[cfg(target_os = "windows")]
    fn install_windows(&self, cert_path: String) -> Result<String, String> {
        let script_path = self.get_absolute_path("src/scripts/install_certificate_windows.ps1")?;
        let temp_dir = tempdir().map_err(|e| format!("Failed to create temporary directory: {}", e))?;
        let temp_script_path = temp_dir.path().join("install_certificate_windows.ps1");
        let temp_cert_path = temp_dir.path().join("certificate.pem");

        // Logging for development
        if cfg!(debug_assertions) {
            println!("Windows Installation Debug Info:");
            println!("Script Path: {:?}", script_path);
            println!("Temp Script Path: {:?}", temp_script_path);
            println!("Temp Certificate Path: {:?}", temp_cert_path);
        }

        fs::copy(&script_path, &temp_script_path).map_err(|e| format!("Failed to copy script file: {}", e))?;
        fs::copy(&cert_path, &temp_cert_path).map_err(|e| format!("Failed to copy certificate file: {}", e))?;

        let output = Command::new("powershell")
            .arg("-ExecutionPolicy")
            .arg("Bypass")
            .arg("-File")
            .arg(temp_script_path)
            .arg(temp_cert_path.to_str().unwrap())
            .output()
            .map_err(|e| format!("Failed to execute script on Windows: {}", e))?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }

    fn get_absolute_path(&self, relative_path: &str) -> Result<String, String> {
        let current_dir = env::current_dir().map_err(|e| e.to_string())?;
        let absolute_path = current_dir.join(relative_path);
        absolute_path
            .to_str()
            .map(|s| s.to_string())
            .ok_or_else(|| "Failed to construct absolute path".into())
    }
}
