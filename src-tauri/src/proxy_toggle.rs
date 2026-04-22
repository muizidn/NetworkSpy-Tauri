use std::sync::atomic::{AtomicBool, Ordering};
use std::process::Command;

#[derive(Debug)]
pub struct ProxyToggle {
    is_active: AtomicBool,
}

impl ProxyToggle {
    pub fn new() -> Self {
        Self {
            is_active: AtomicBool::new(false),
        }
    }

    pub fn is_on(&self) -> bool {
        self.is_active.load(Ordering::Relaxed)
    }

    pub fn turn_on(&self, port: u64) {
        self.is_active.store(true, Ordering::Relaxed);
        #[cfg(target_os = "macos")]
        self.turn_on_macos(port);

        #[cfg(target_os = "linux")]
        self.turn_on_linux(port);

        #[cfg(target_os = "windows")]
        self.turn_on_windows(port);
    }

    pub fn turn_off(&self) {
        self.is_active.store(false, Ordering::Relaxed);
        #[cfg(target_os = "macos")]
        self.turn_off_macos();

        #[cfg(target_os = "linux")]
        self.turn_off_linux();

        #[cfg(target_os = "windows")]
        self.turn_off_windows();
    }

    #[cfg(target_os = "macos")]
    fn turn_on_macos(&self, port: u64) {
        let services = self.get_macos_services();
        let port_s = port.to_string();
        for service in services {
            self.shell("/usr/sbin/networksetup", &["-setwebproxy", &service, "127.0.0.1", &port_s]);
            self.shell("/usr/sbin/networksetup", &["-setsecurewebproxy", &service, "127.0.0.1", &port_s]);
            self.shell("/usr/sbin/networksetup", &["-setwebproxystate", &service, "on"]);
            self.shell("/usr/sbin/networksetup", &["-setsecurewebproxystate", &service, "on"]);
        }
    }

    #[cfg(target_os = "macos")]
    fn turn_off_macos(&self) {
        let services = self.get_macos_services();
        for service in services {
            self.shell("/usr/sbin/networksetup", &["-setwebproxystate", &service, "off"]);
            self.shell("/usr/sbin/networksetup", &["-setsecurewebproxystate", &service, "off"]);
        }
    }

    #[cfg(target_os = "macos")]
    fn get_macos_services(&self) -> Vec<String> {
        let output = Command::new("/usr/sbin/networksetup")
            .arg("-listallnetworkservices")
            .output();

        match output {
            Ok(out) => {
                let stdout = String::from_utf8_lossy(&out.stdout);
                stdout.lines()
                    .filter(|line| {
                        let l = line.trim();
                        !l.is_empty() && 
                        !l.contains("denotes") && 
                        !l.starts_with('*')
                    })
                    .map(|l| l.trim().to_string())
                    .collect()
            },
            Err(_) => vec!["Wi-Fi".to_string(), "Ethernet".to_string(), "Thunderbolt Bridge".to_string()]
        }
    }

    #[cfg(target_os = "linux")]
    fn turn_on_linux(&self, port: u64) {
        let port_s = port.to_string();
        // GNOME
        self.shell("gsettings", &["set", "org.gnome.system.proxy", "mode", "manual"]);
        self.shell("gsettings", &["set", "org.gnome.system.proxy.http", "host", "127.0.0.1"]);
        self.shell("gsettings", &["set", "org.gnome.system.proxy.http", "port", &port_s]);
        self.shell("gsettings", &["set", "org.gnome.system.proxy.https", "host", "127.0.0.1"]);
        self.shell("gsettings", &["set", "org.gnome.system.proxy.https", "port", &port_s]);
        
        // KDE (Kioslaverc)
        self.shell("kwriteconfig5", &["--file", "kioslaverc", "--group", "Proxy Settings", "--key", "ProxyType", "1"]);
        self.shell("kwriteconfig5", &["--file", "kioslaverc", "--group", "Proxy Settings", "--key", "httpProxy", &format!("http://127.0.0.1:{}", port_s)]);
        self.shell("kwriteconfig5", &["--file", "kioslaverc", "--group", "Proxy Settings", "--key", "httpsProxy", &format!("http://127.0.0.1:{}", port_s)]);
    }

    #[cfg(target_os = "linux")]
    fn turn_off_linux(&self) {
        // GNOME
        self.shell("gsettings", &["set", "org.gnome.system.proxy", "mode", "none"]);
        
        // KDE
        self.shell("kwriteconfig5", &["--file", "kioslaverc", "--group", "Proxy Settings", "--key", "ProxyType", "0"]);
    }

    #[cfg(target_os = "windows")]
    fn turn_on_windows(&self, port: u64) {
        let proxy = format!("127.0.0.1:{}", port);
        self.shell("reg", &["add", r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings", "/v", "ProxyEnable", "/t", "REG_DWORD", "/d", "1", "/f"]);
        self.shell("reg", &["add", r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings", "/v", "ProxyServer", "/t", "REG_SZ", "/d", &proxy, "/f"]);
        refresh_proxy();
    }

    #[cfg(target_os = "windows")]
    fn turn_off_windows(&self) {
        self.shell("reg", &["add", r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings", "/v", "ProxyEnable", "/t", "REG_DWORD", "/d", "0", "/f"]);
        // It's cleaner to also clear the server string
        self.shell("reg", &["add", r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings", "/v", "ProxyServer", "/t", "REG_SZ", "/d", "", "/f"]);
        refresh_proxy();
    }

    fn shell(&self, launch_path: &str, args: &[&str]) -> bool {
        let mut cmd = Command::new(launch_path);
        cmd.args(args);

        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
        }

        match cmd.status() {
            Ok(status) => status.success(),
            Err(e) => {
                eprintln!("Failed to execute {}: {}", launch_path, e);
                false
            }
        }
    }
}

#[cfg(target_os = "windows")]
fn refresh_proxy() {
    use windows::Win32::Networking::WinInet::{InternetSetOptionW, INTERNET_OPTION_SETTINGS_CHANGED, INTERNET_OPTION_REFRESH};
    unsafe {
        InternetSetOptionW(None, INTERNET_OPTION_SETTINGS_CHANGED, None, 0);
        InternetSetOptionW(None, INTERNET_OPTION_REFRESH, None, 0);
    }
}