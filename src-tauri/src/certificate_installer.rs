use std::fs;
#[cfg(target_os = "linux")]
#[allow(unused_imports)]
use std::io::Read;
use std::process::Command;
use tempfile::tempdir;

#[cfg(target_family = "unix")]
use std::os::unix::fs::PermissionsExt;

#[derive(Debug)]
pub struct CertificateInstaller {}

impl CertificateInstaller {
    pub fn install(&self, cert_path: String) -> Result<String, String> {
        #[cfg(target_os = "macos")]
        {
            return self.install_macos(cert_path);
        }

        #[cfg(target_os = "linux")]
        {
            return self.install_linux(cert_path);
        }

        #[cfg(target_os = "windows")]
        {
            return self.install_windows(cert_path);
        }

        #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
        Err("Unsupported operating system".into())
    }

    pub fn install_from_content(&self, cert_content: &str) -> Result<String, String> {
        let temp_dir =
            tempdir().map_err(|e| format!("Failed to create temporary directory: {}", e))?;
        let temp_cert_path = temp_dir.path().join("network-spy.cer");

        fs::write(&temp_cert_path, cert_content)
            .map_err(|e| format!("Failed to write certificate to temp file: {}", e))?;

        let path_str = temp_cert_path
            .to_str()
            .ok_or("Failed to convert temp path to string")?
            .to_string();

        self.install(path_str)
    }

    #[cfg(target_os = "macos")]
    fn install_macos(&self, cert_path: String) -> Result<String, String> {
        let script_content = include_str!("scripts/install_certificates_mac.sh");
        let temp_dir =
            tempdir().map_err(|e| format!("Failed to create temporary directory: {}", e))?;
        let temp_script_path = temp_dir.path().join("install_certificate_mac.sh");
        let temp_cert_path = temp_dir.path().join("certificate.pem");

        fs::write(&temp_script_path, script_content)
            .map_err(|e| format!("Failed to write script file: {}", e))?;
        fs::copy(&cert_path, &temp_cert_path)
            .map_err(|e| format!("Failed to copy certificate file: {}", e))?;

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
        let script_content = include_str!("scripts/install_certificate_linux.sh");
        let temp_dir =
            tempdir().map_err(|e| format!("Failed to create temporary directory: {}", e))?;
        let temp_script_path = temp_dir.path().join("install_certificate_linux.sh");
        let temp_cert_path = temp_dir.path().join("certificate.cer");

        fs::write(&temp_script_path, script_content)
            .map_err(|e| format!("Failed to write script file: {}", e))?;
        fs::copy(&cert_path, &temp_cert_path)
            .map_err(|e| format!("Failed to copy certificate file: {}", e))?;

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
        let script_content = include_str!("scripts/install_certificate_windows.ps1");
        let temp_dir =
            tempdir().map_err(|e| format!("Failed to create temporary directory: {}", e))?;
        let temp_script_path = temp_dir.path().join("install_certificate_windows.ps1");
        let temp_cert_path = temp_dir.path().join("certificate.pem");

        fs::write(&temp_script_path, script_content)
            .map_err(|e| format!("Failed to write script file: {}", e))?;
        fs::copy(&cert_path, &temp_cert_path)
            .map_err(|e| format!("Failed to copy certificate file: {}", e))?;

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
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_get_absolute_path_with_relative() {
        let installer = CertificateInstaller {};
        let rel_path = "src/scripts/test.sh";
        let result = installer.get_absolute_path(rel_path);
        assert!(result.is_ok());
        let abs_path = result.unwrap();
        let current_dir = env::current_dir().unwrap();
        assert!(abs_path.contains(current_dir.to_str().unwrap()));
        assert!(abs_path.ends_with(rel_path));
    }

    #[test]
    fn test_get_absolute_path_with_absolute() {
        let installer = CertificateInstaller {};
        let abs_path = if cfg!(windows) {
            "C:\\Temp\\cert.cer"
        } else {
            "/tmp/cert.cer"
        };
        let result = installer.get_absolute_path(abs_path);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), abs_path);
    }
}
