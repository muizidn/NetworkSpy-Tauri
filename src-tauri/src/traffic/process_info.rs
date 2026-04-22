use std::process::Command;
use std::collections::HashMap;
use std::sync::Mutex;
use once_cell::sync::Lazy;
use base64::{engine::general_purpose, Engine as _};

static PROCESS_CACHE: Lazy<Mutex<HashMap<String, String>>> = Lazy::new(|| Mutex::new(HashMap::new()));
#[cfg(target_os = "windows")]
static ATTEMPTS_CACHE: Lazy<Mutex<HashMap<String, u32>>> = Lazy::new(|| Mutex::new(HashMap::new()));

pub fn get_client_info(client_addr: &str) -> String {
    // client_addr is usually "127.0.0.1:12345"
    let port = client_addr.split(':').last().unwrap_or("");
    if port.is_empty() {
        return serde_json::json!({ "name": "-", "icon": null }).to_string();
    }

    // Check cache first
    {
        let cache = PROCESS_CACHE.lock().unwrap();
        if let Some(info) = cache.get(port) {
            return info.clone();
        }
    }

    #[cfg(target_os = "windows")]
    {
        let mut attempts = ATTEMPTS_CACHE.lock().unwrap();
        let count = attempts.entry(port.to_string()).or_insert(0);
        *count += 1;
        if *count > 10 {
            return serde_json::json!({ "name": "Unknown (Timeout)", "icon": null }).to_string();
        }
    }

    let (name, icon) = find_process_by_port(port);
    
    // Create a JSON info string
    let info = serde_json::json!({
        "name": name,
        "icon": icon
    }).to_string();

    // Cache it if found
    if name != "-" {
        let mut cache = PROCESS_CACHE.lock().unwrap();
        cache.insert(port.to_string(), info.clone());
    }

    info
}

#[cfg(target_os = "macos")]
fn get_mac_app_icon(full_path: &str) -> Option<String> {
    if let Some(app_pos) = full_path.find(".app/") {
        let app_path = &full_path[..app_pos + 4];
        
        // Find .icns files
        let resources = format!("{}/Contents/Resources", app_path);
        let output = Command::new("find")
            .args(&[&resources, "-maxdepth", "1", "-name", "*.icns"])
            .output()
            .ok()?;
        
        let icns_path = String::from_utf8_lossy(&output.stdout).lines().next()?.to_string();
        
        // Convert to PNG using sips
        let temp_png = format!("/tmp/ns_icon_{}.png", std::process::id());
        let _ = Command::new("sips")
            .args(&["-s", "format", "png", &icns_path, "--resampleHeight", "24", "--out", &temp_png])
            .output();
        
        if let Ok(bytes) = std::fs::read(&temp_png) {
            let encoded = general_purpose::STANDARD.encode(&bytes);
            let _ = std::fs::remove_file(&temp_png);
            return Some(format!("data:image/png;base64,{}", encoded));
        }
    }
    None
}

fn find_process_by_port(port: &str) -> (String, Option<String>) {
    let current_pid = std::process::id();

    #[cfg(target_os = "macos")]
    {
        // Use a more specific lsof query to find processes using this port
        let output = Command::new("lsof")
            .args(&["-nP", "-i", &format!(":{}", port), "-sTCP:ESTABLISHED"])
            .output();

        if let Ok(out) = output {
            let stdout = String::from_utf8_lossy(&out.stdout);
            for line in stdout.lines().skip(1) { // Skip header
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    if let Ok(pid) = parts[1].parse::<u32>() {
                        // Skip our own process
                        if pid == current_pid {
                            continue;
                        }

                        // Try to get the full process path using ps
                        let ps_output = Command::new("ps")
                            .args(&["-p", &pid.to_string(), "-o", "comm="])
                            .output();

                        if let Ok(ps_out) = ps_output {
                            let full_path = String::from_utf8_lossy(&ps_out.stdout).trim().to_string();
                            if !full_path.is_empty() {
                                let icon = get_mac_app_icon(&full_path);
                                if let Some(name) = std::path::Path::new(&full_path).file_name() {
                                    return (name.to_string_lossy().to_string(), icon);
                                }
                                return (full_path, icon);
                            }
                        }
                        
                        // Fallback to lsof's command name
                        return (parts[0].to_string(), None);
                    }
                }
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        // ss -ntp | grep ":<port>"
        let output = Command::new("ss")
            .args(&["-ntp"])
            .output();

        if let Ok(out) = output {
            let stdout = String::from_utf8_lossy(&out.stdout);
            for line in stdout.lines() {
                if line.contains(&format!(":{}", port)) {
                    // users:(("name",pid=123,fd=4))
                    if let Some(start) = line.find("pid=") {
                        let rest = &line[start + 4..];
                        if let Some(end) = rest.find(",") {
                            if let Ok(pid) = rest[..end].parse::<u32>() {
                                if pid == current_pid {
                                    continue;
                                }
                            }
                        }
                    }

                    if let Some(start) = line.find("users:((\"") {
                        let rest = &line[start + 9..];
                        if let Some(end) = rest.find("\"") {
                            return (rest[..end].to_string(), None);
                        }
                    }
                }
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        let output = Command::new("netstat")
            .args(&["-ano"])
            .creation_flags(CREATE_NO_WINDOW)
            .output();

        if let Ok(out) = output {
            let stdout = String::from_utf8_lossy(&out.stdout);
            for line in stdout.lines() {
                if line.contains(&format!(":{}", port)) && line.contains("ESTABLISHED") {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if let Some(pid_str) = parts.last() {
                        if let Ok(pid) = pid_str.parse::<u32>() {
                            if pid == current_pid {
                                continue;
                            }

                            let task_output = Command::new("tasklist")
                                .args(&["/FI", &format!("PID eq {}", pid), "/NH", "/FO", "CSV"])
                                .creation_flags(CREATE_NO_WINDOW)
                                .output();
                            
                            if let Ok(tout) = task_output {
                                let tstdout = String::from_utf8_lossy(&tout.stdout);
                                let tparts: Vec<&str> = tstdout.split(',').collect();
                                if !tparts.is_empty() {
                                    return (tparts[0].trim_matches('"').to_string(), None);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    ("-".to_string(), None)
}
