#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::Command;

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
        let output = Command::new("bash")
            .arg("-c")
            .arg(format!(
                "chmod +x scripts/install_certificate_mac.sh && scripts/install_certificate_mac.sh {}",
                cert_path
            ))
            .output()
            .expect("Failed to execute script on macOS");

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }

    #[cfg(target_os = "linux")]
    fn install_linux(&self, cert_path: String) -> Result<String, String> {
        let output = Command::new("bash")
            .arg("-c")
            .arg(format!(
                "chmod +x scripts/install_certificate_linux.sh && scripts/install_certificate_linux.sh {}",
                cert_path
            ))
            .output()
            .expect("Failed to execute script on Linux");

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }

    #[cfg(target_os = "windows")]
    fn install_windows(&self, cert_path: String) -> Result<String, String> {
        let output = Command::new("powershell")
            .arg("-ExecutionPolicy")
            .arg("Bypass")
            .arg("-File")
            .arg("scripts/install_certificate_windows.ps1")
            .arg(cert_path)
            .output()
            .expect("Failed to execute script on Windows");

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }
}