#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::Command;

#[derive(Debug)]
pub struct ProxyToggle {}

impl ProxyToggle {
    pub fn turn_on(&self, port: u64) {
        #[cfg(target_os = "macos")]
        self.turn_on_macos(port);

        #[cfg(target_os = "linux")]
        self.turn_on_linux(port);

        #[cfg(target_os = "windows")]
        self.turn_on_windows(port);
    }

    pub fn turn_off(&self) {
        #[cfg(target_os = "macos")]
        self.turn_off_macos();

        #[cfg(target_os = "linux")]
        self.turn_off_linux();

        #[cfg(target_os = "windows")]
        self.turn_off_windows();
    }

    #[cfg(target_os = "macos")]
    fn turn_on_macos(&self, port: u64) {
        assert!(self.shell("/usr/sbin/networksetup", &["-setwebproxy", "Wi-Fi", "127.0.0.1", &port.to_string()]));
        assert!(self.shell("/usr/sbin/networksetup", &["-setsecurewebproxy", "Wi-Fi", "127.0.0.1", &port.to_string()]));
    }

    #[cfg(target_os = "macos")]
    fn turn_off_macos(&self) {
        assert!(self.shell("/usr/sbin/networksetup", &["-setwebproxystate", "Wi-Fi", "off"]));
        assert!(self.shell("/usr/sbin/networksetup", &["-setsecurewebproxystate", "Wi-Fi", "off"]));
    }

    #[cfg(target_os = "linux")]
    fn turn_on_linux(&self, port: u64) {
        assert!(self.shell("gsettings", &["set", "org.gnome.system.proxy", "mode", "manual"]));
        assert!(self.shell("gsettings", &["set", "org.gnome.system.proxy.http", "host", "127.0.0.1"]));
        assert!(self.shell("gsettings", &["set", "org.gnome.system.proxy.http", "port", &port.to_string()]));
        assert!(self.shell("gsettings", &["set", "org.gnome.system.proxy.https", "host", "127.0.0.1"]));
        assert!(self.shell("gsettings", &["set", "org.gnome.system.proxy.https", "port", &port.to_string()]));
    }

    #[cfg(target_os = "linux")]
    fn turn_off_linux(&self) {
        assert!(self.shell("gsettings", &["set", "org.gnome.system.proxy", "mode", "none"]));
    }

    #[cfg(target_os = "windows")]
    fn turn_on_windows(&self, port: u64) {
        let proxy = format!("127.0.0.1:{}", port);

        // Update WinINET proxy (registry)
        self.shell("reg", &["add", r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings", "/v", "ProxyEnable", "/t", "REG_DWORD", "/d", "1", "/f"]);
        self.shell("reg", &["add", r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings", "/v", "ProxyServer", "/t", "REG_SZ", "/d", &proxy, "/f"]);

        // Notify system
        refresh_proxy();

        // Optional: WinHTTP
        self.shell("netsh", &["winhttp", "set", "proxy", &proxy]);
    }


    #[cfg(target_os = "windows")]
    fn turn_off_windows(&self) {
        // Disable proxy
        self.shell("reg", &["add", r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings", "/v", "ProxyEnable", "/t", "REG_DWORD", "/d", "0", "/f"]);

        // Notify system
        refresh_proxy();

        // Optional: WinHTTP
        self.shell("netsh", &["winhttp", "reset", "proxy"]);
    }

    fn shell(&self, launch_path: &str, args: &[&str]) -> bool {
        let status = Command::new(launch_path)
            .args(args)
            .status()
            .expect("failed to execute process");
        status.success()
    }
}

 // Call this after registry changes
#[cfg(target_os = "windows")]
fn refresh_proxy() {
    use windows::Win32::Networking::WinInet::{InternetSetOptionW, INTERNET_OPTION_SETTINGS_CHANGED, INTERNET_OPTION_REFRESH};

    unsafe {
        InternetSetOptionW(None, INTERNET_OPTION_SETTINGS_CHANGED, None, 0);
        InternetSetOptionW(None, INTERNET_OPTION_REFRESH, None, 0);
    }
}