use std::process::Command;
use std::collections::HashMap;
use std::sync::Mutex;
use once_cell::sync::Lazy;

static PROCESS_CACHE: Lazy<Mutex<HashMap<String, String>>> = Lazy::new(|| Mutex::new(HashMap::new()));

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

    let name = find_process_by_port(port);
    
    // Cache it (briefly or until port reuse, but for now simple cache)
    if name != "Unknown" {
        let mut cache = PROCESS_CACHE.lock().unwrap();
        cache.insert(port.to_string(), name.clone());
    }

    name
}

fn find_process_by_port(port: &str) -> String {
    #[cfg(target_os = "macos")]
    {
        // lsof -nP -iTCP -sTCP:ESTABLISHED | grep ":<port>"
        let output = Command::new("lsof")
            .args(&["-nP", "-iTCP", "-sTCP:ESTABLISHED"])
            .output();

        if let Ok(out) = output {
            let stdout = String::from_utf8_lossy(&out.stdout);
            for line in stdout.lines() {
                if line.contains(&format!(":{}", port)) && !line.contains("network-spy") {
                    // Line format: COMMAND  PID  USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if !parts.is_empty() {
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
                    // Extract process name from "users:(("name",pid=123,fd=4))"
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
        // netstat -ano | findstr :<port>
        // Then tasklist /FI "PID eq <pid>"
        let output = Command::new("netstat")
            .args(&["-ano"])
            .output();

        if let Ok(out) = output {
            let stdout = String::from_utf8_lossy(&out.stdout);
            for line in stdout.lines() {
                if line.contains(&format!(":{}", port)) && line.contains("ESTABLISHED") {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if let Some(pid_str) = parts.last() {
                        let task_output = Command::new("tasklist")
                            .args(&["/FI", &format!("PID eq {}", pid_str), "/NH", "/FO", "CSV"])
                            .output();
                        
                        if let Ok(tout) = task_output {
                            let tstdout = String::from_utf8_lossy(&tout.stdout);
                            // "name","pid","session name","session#","mem"
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

    "Unknown".to_string()
}
