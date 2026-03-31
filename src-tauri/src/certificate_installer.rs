use std::fs;
#[cfg(target_os = "linux")]
#[allow(unused_imports)]
use std::io::Read;
use std::process::Command;
use tauri::{AppHandle, Emitter};
use tempfile::tempdir;

#[cfg(target_family = "unix")]
use std::os::unix::fs::PermissionsExt;

#[derive(Debug)]
pub struct CertificateInstaller {}

fn emit_log(app: &Option<AppHandle>, message: &str) {
    if let Some(handle) = app {
        let _ = handle.emit("certificate_log", message);
    }
    println!("[CERT] {}", message);
}

impl CertificateInstaller {
    pub fn install(
        &self,
        app: Option<AppHandle>,
        stream_logs: bool,
        cert_path: String,
    ) -> Result<String, String> {
        emit_log(&app, "Starting certificate installation...");

        #[cfg(target_os = "macos")]
        {
            return self.install_macos(app, stream_logs, cert_path);
        }

        #[cfg(target_os = "linux")]
        {
            return self.install_linux(app, stream_logs, cert_path);
        }

        #[cfg(target_os = "windows")]
        {
            return self.install_windows(app, stream_logs, cert_path);
        }

        #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
        Err("Unsupported operating system".into())
    }

    pub fn uninstall(&self, app: Option<AppHandle>, stream_logs: bool) -> Result<String, String> {
        emit_log(&app, "Starting certificate uninstallation...");

        #[cfg(target_os = "macos")]
        {
            return self.uninstall_macos(app, stream_logs);
        }

        #[cfg(target_os = "linux")]
        {
            return self.uninstall_linux(app, stream_logs);
        }

        #[cfg(target_os = "windows")]
        {
            return self.uninstall_windows(app, stream_logs);
        }

        #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
        Err("Unsupported operating system".into())
    }

    #[cfg(target_os = "macos")]
    fn uninstall_macos(&self, app: Option<AppHandle>, stream_logs: bool) -> Result<String, String> {
        emit_log(&app, "Searching for NetworkSpy CA in Keychain...");
        let script = r#"
#!/bin/bash
CERT_NAME="NetworkSpy CA"

# Find and remove the certificate from Keychain
security find-certificate -c "$CERT_NAME" 2>/dev/null
if [ $? -eq 0 ]; then
    security delete-certificate -c "$CERT_NAME"
    echo "Certificate '$CERT_NAME' removed from Keychain"
else
    echo "Certificate '$CERT_NAME' not found in Keychain"
fi

# Also try removing from System keychain
security find-certificate -c "$CERT_NAME" -s /Library/Keychains/System.keychain 2>/dev/null
if [ $? -eq 0 ]; then
    security delete-certificate -c "$CERT_NAME" -s /Library/Keychains/System.keychain
    echo "Certificate removed from System Keychain"
fi

echo "Uninstall completed"
"#;

        let temp_dir = tempdir().map_err(|e| format!("Failed to create temp dir: {}", e))?;
        let temp_script_path = temp_dir.path().join("uninstall_cert_mac.sh");

        fs::write(&temp_script_path, script)
            .map_err(|e| format!("Failed to write script: {}", e))?;

        #[cfg(target_family = "unix")]
        fs::set_permissions(&temp_script_path, fs::Permissions::from_mode(0o755))
            .map_err(|e| format!("Failed to set permissions: {}", e))?;

        if stream_logs {
            emit_log(&app, "Executing uninstall script...");
        }

        let output = Command::new("bash")
            .arg(temp_script_path)
            .output()
            .map_err(|e| format!("Failed to execute script: {}", e))?;

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();

        if stream_logs {
            for line in stdout.lines() {
                emit_log(&app, &format!("[script] {}", line));
            }
        }

        if output.status.success() {
            emit_log(&app, "Certificate uninstallation completed successfully");
            Ok(stdout)
        } else {
            emit_log(
                &app,
                &format!("Certificate uninstallation failed: {}", stderr),
            );
            Err(stderr)
        }
    }

    #[cfg(target_os = "linux")]
    fn uninstall_linux(&self, app: Option<AppHandle>, stream_logs: bool) -> Result<String, String> {
        if stream_logs {
            emit_log(
                &app,
                "Searching for NetworkSpy certificates in standard locations...",
            );
        }

        let cert_paths = vec![
            "/usr/local/share/ca-certificates/NetworkSpy.crt",
            "/usr/share/ca-certificates/NetworkSpy.crt",
            "/etc/ssl/certs/NetworkSpy.crt",
        ];

        let mut removed = Vec::new();
        let mut errors = Vec::new();

        for cert_path in cert_paths {
            if std::path::Path::new(cert_path).exists() {
                if stream_logs {
                    emit_log(&app, &format!("Found certificate at: {}", cert_path));
                }
                match fs::remove_file(cert_path) {
                    Ok(_) => {
                        removed.push(cert_path);
                        if stream_logs {
                            emit_log(&app, &format!("Removed: {}", cert_path));
                        }
                    }
                    Err(e) => {
                        errors.push(format!("{}: {}", cert_path, e));
                        if stream_logs {
                            emit_log(&app, &format!("Failed to remove {}: {}", cert_path, e));
                        }
                    }
                }
            }
        }

        // Update ca-certificates if available
        if !removed.is_empty() {
            if stream_logs {
                emit_log(&app, "Running update-ca-certificates...");
            }
            let _ = Command::new("update-ca-certificates").output();
        }

        if !removed.is_empty() {
            emit_log(&app, &format!("Removed {} certificates", removed.len()));
            Ok(format!("Removed certificates: {}", removed.join(", ")))
        } else if !errors.is_empty() {
            emit_log(&app, &format!("Errors: {}", errors.join("; ")));
            Err(errors.join("; "))
        } else {
            emit_log(&app, "No NetworkSpy certificates found to remove");
            Ok("No NetworkSpy certificates found to remove".to_string())
        }
    }

    #[cfg(target_os = "windows")]
    fn uninstall_windows(
        &self,
        app: Option<AppHandle>,
        stream_logs: bool,
    ) -> Result<String, String> {
        if stream_logs {
            emit_log(
                &app,
                "Searching for NetworkSpy CA in Windows Certificate Store...",
            );
        }

        let script = r#"
$certName = "NetworkSpy CA"

# Try to remove from CurrentUser store
$cert = Get-ChildItem -Path Cert:\CurrentUser\Root | Where-Object { $_.Subject -like "*$certName*" }
if ($cert) {
    Remove-Item -Path $cert.PSPath -Force
    Write-Output "Certificate removed from CurrentUser Root store"
} else {
    Write-Output "Certificate not found in CurrentUser Root store"
}

# Try to remove from LocalMachine store (requires admin)
try {
    $certLM = Get-ChildItem -Path Cert:\LocalMachine\Root | Where-Object { $_.Subject -like "*$certName*" }
    if ($certLM) {
        Remove-Item -Path $certLM.PSPath -Force
        Write-Output "Certificate removed from LocalMachine Root store"
    } else {
        Write-Output "Certificate not found in LocalMachine Root store"
    }
} catch {
    Write-Output "Note: Could not access LocalMachine store (may require admin)"
}

Write-Output "Uninstall completed"
"#;

        let temp_dir = tempdir().map_err(|e| format!("Failed to create temp dir: {}", e))?;
        let temp_script_path = temp_dir.path().join("uninstall_cert_windows.ps1");

        fs::write(&temp_script_path, script)
            .map_err(|e| format!("Failed to write script: {}", e))?;

        if stream_logs {
            emit_log(&app, "Executing uninstall script...");
        }

        let output = Command::new("powershell")
            .arg("-ExecutionPolicy")
            .arg("Bypass")
            .arg("-File")
            .arg(temp_script_path)
            .output()
            .map_err(|e| format!("Failed to execute script: {}", e))?;

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();

        if stream_logs {
            for line in stdout.lines() {
                emit_log(&app, &format!("[script] {}", line));
            }
        }

        if output.status.success() {
            emit_log(&app, "Certificate uninstallation completed successfully");
            Ok(stdout)
        } else {
            emit_log(
                &app,
                &format!("Certificate uninstallation failed: {}", stderr),
            );
            Err(stderr)
        }
    }

    pub fn install_from_content(
        &self,
        app: Option<AppHandle>,
        stream_logs: bool,
        cert_content: &str,
    ) -> Result<String, String> {
        let temp_dir =
            tempdir().map_err(|e| format!("Failed to create temporary directory: {}", e))?;
        let temp_cert_path = temp_dir.path().join("network-spy.cer");

        fs::write(&temp_cert_path, cert_content)
            .map_err(|e| format!("Failed to write certificate to temp file: {}", e))?;

        let path_str = temp_cert_path
            .to_str()
            .ok_or("Failed to convert temp path to string")?
            .to_string();

        self.install(app, stream_logs, path_str)
    }

    #[cfg(target_os = "macos")]
    fn install_macos(
        &self,
        app: Option<AppHandle>,
        stream_logs: bool,
        cert_path: String,
    ) -> Result<String, String> {
        emit_log(&app, "Preparing macOS certificate installation...");
        emit_log(&app, "Creating temporary script files...");

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

        if stream_logs {
            emit_log(&app, "Executing install script...");
            emit_log(&app, &format!("Certificate path: {}", cert_path));
        }

        let output = Command::new("bash")
            .arg(temp_script_path)
            .arg(temp_cert_path.to_str().unwrap())
            .output()
            .map_err(|e| format!("Failed to execute script on macOS: {}", e))?;

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();

        if stream_logs {
            for line in stdout.lines() {
                emit_log(&app, &format!("[script] {}", line));
            }
        }

        if output.status.success() {
            emit_log(&app, "Certificate installed successfully on macOS");
            Ok(stdout)
        } else {
            emit_log(&app, &format!("Installation failed: {}", stderr));
            Err(stderr)
        }
    }

    #[cfg(target_os = "linux")]
    fn install_linux(
        &self,
        app: Option<AppHandle>,
        stream_logs: bool,
        cert_path: String,
    ) -> Result<String, String> {
        emit_log(&app, "Preparing Linux certificate installation...");
        emit_log(&app, "Creating temporary script files...");

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

        if stream_logs {
            emit_log(&app, "Executing install script...");
        }

        let output = Command::new("bash")
            .arg(temp_script_path)
            .arg(temp_cert_path.to_str().unwrap())
            .output()
            .map_err(|e| format!("Failed to execute script on Linux: {}", e))?;

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();

        if stream_logs {
            for line in stdout.lines() {
                emit_log(&app, &format!("[script] {}", line));
            }
        }

        if output.status.success() {
            emit_log(&app, "Certificate installed successfully on Linux");
            Ok(stdout)
        } else {
            emit_log(&app, &format!("Installation failed: {}", stderr));
            Err(stderr)
        }
    }

    #[cfg(target_os = "windows")]
    fn install_windows(
        &self,
        app: Option<AppHandle>,
        stream_logs: bool,
        cert_path: String,
    ) -> Result<String, String> {
        emit_log(&app, "Preparing Windows certificate installation...");
        emit_log(&app, "Creating temporary script files...");

        let script_content = include_str!("scripts/install_certificate_windows.ps1");
        let temp_dir =
            tempdir().map_err(|e| format!("Failed to create temporary directory: {}", e))?;
        let temp_script_path = temp_dir.path().join("install_certificate_windows.ps1");
        let temp_cert_path = temp_dir.path().join("certificate.pem");

        fs::write(&temp_script_path, script_content)
            .map_err(|e| format!("Failed to write script file: {}", e))?;
        fs::copy(&cert_path, &temp_cert_path)
            .map_err(|e| format!("Failed to copy certificate file: {}", e))?;

        if stream_logs {
            emit_log(&app, "Executing install script...");
        }

        let output = Command::new("powershell")
            .arg("-ExecutionPolicy")
            .arg("Bypass")
            .arg("-File")
            .arg(temp_script_path)
            .arg(temp_cert_path.to_str().unwrap())
            .output()
            .map_err(|e| format!("Failed to execute script on Windows: {}", e))?;

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();

        if stream_logs {
            for line in stdout.lines() {
                emit_log(&app, &format!("[script] {}", line));
            }
        }

        if output.status.success() {
            emit_log(&app, "Certificate installed successfully on Windows");
            Ok(stdout)
        } else {
            emit_log(&app, &format!("Installation failed: {}", stderr));
            Err(stderr)
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
