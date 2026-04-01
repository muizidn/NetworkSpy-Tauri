use std::process::Command;
use std::collections::HashMap;
use std::sync::Mutex;
use once_cell::sync::Lazy;

static PROCESS_CACHE: Lazy<Mutex<HashMap<String, String>>> = Lazy::new(|| Mutex::new(HashMap::new()));
static ATTEMPTS_CACHE: Lazy<Mutex<HashMap<String, u32>>> = Lazy::new(|| Mutex::new(HashMap::new()));

pub fn get_app_name(client_addr: &str) -> String {
    // client_addr is usually "127.0.0.1:12345"
    let port = client_addr.split(':').last().unwrap_or("");
    if port.is_empty() {
        return "Unknown".to_string();
    }

    // Check cache first
    {
        let cache = PROCESS_CACHE.lock().unwrap();
        if let Some(name) = cache.get(port) {
            return name.clone();
        }
    }

    #[cfg(target_os = "windows")]
    {
        let mut attempts = ATTEMPTS_CACHE.lock().unwrap();
        let count = attempts.entry(port.to_string()).or_insert(0);
        *count += 1;
        if *count > 10 {
            return "Failed to look for open port".to_string();
        }
    }

    let name = find_process_by_port(port);
    
    // Cache it if found
    if name != "Unknown" {
        let mut cache = PROCESS_CACHE.lock().unwrap();
        cache.insert(port.to_string(), name.clone());
    }

    name
}

fn find_process_by_port(port: &str) -> String {
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

                        // Try to get the full process name using ps
                        let ps_output = Command::new("ps")
                            .args(&["-p", &pid.to_string(), "-o", "comm="])
                            .output();

                        if let Ok(ps_out) = ps_output {
                            let full_path = String::from_utf8_lossy(&ps_out.stdout).trim().to_string();
                            if !full_path.is_empty() {
                                if let Some(name) = std::path::Path::new(&full_path).file_name() {
                                    return name.to_string_lossy().to_string();
                                }
                            }
                        }
                        
                        // Fallback to lsof's command name
                        return parts[0].to_string();
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
                            return rest[..end].to_string();
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
                                    return tparts[0].trim_matches('"').to_string();
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    "Unknown".to_string()
}
