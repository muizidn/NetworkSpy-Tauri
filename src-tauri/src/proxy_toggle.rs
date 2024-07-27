#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::Command;

#[derive(Debug)]
pub struct ProxyToggle {
    pub port: u64,
}

impl ProxyToggle {
    pub fn turn_on(&self) {
        let port = self.port;
        assert!(self.shell("/usr/sbin/networksetup", &["-setwebproxy", "Wi-Fi", "127.0.0.1", &port.to_string()]));
        assert!(self.shell("/usr/sbin/networksetup", &["-setsecurewebproxy", "Wi-Fi", "127.0.0.1", &port.to_string()]));
    }

    pub fn turn_off(&self) {
        assert!(self.shell("/usr/sbin/networksetup", &["-setwebproxystate", "Wi-Fi", "off"]));
        assert!(self.shell("/usr/sbin/networksetup", &["-setsecurewebproxystate", "Wi-Fi", "off"]));
    }

    fn shell(&self, launch_path: &str, args: &[&str]) -> bool {
        let status = Command::new(launch_path)
            .args(args)
            .status()
            .expect("failed to execute process");
        status.success()
    }
}