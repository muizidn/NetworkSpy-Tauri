# 📡 Network Spy

A premium, cross-platform Network Proxy and Traffic Analyzer built with **Tauri**, **Rust**, and **React**. Intercept, inspect, and analyze your application's network traffic with a stunning, high-performance interface.

---

## ⚡ Quick Install

The fastest way to install or update Network Spy is via the terminal:

###  macOS / 🐧 Linux
```bash
curl -fsSL https://raw.githubusercontent.com/muizidn/NetworkSpy-Tauri/develop/install.sh | sh
```

### 🪟 Windows (PowerShell)
```powershell
iwr -useb https://raw.githubusercontent.com/muizidn/NetworkSpy-Tauri/develop/install.ps1 | iex
```

---

## ✨ Features

- **🚀 High Performance**: Rust-powered proxy engine for zero-latency traffic interception.
- **🎨 Premium UI**: A modern, dark-themed interface built for developers.
- **🔒 Easy CA Setup**: Automate one-click root certificate installation for HTTPS interception.
- **🖥️ Cross-Platform**: Native installers for macOS (DMG), Windows (MSI), and Linux (DEB).
- **📝 Filter Presets**: Save and manage your favorite traffic filtering rules.
- **📦 Session Management**: Export and import your traffic logs as HAR, CSV, or SQLite.

---

## 🛠️ Development Setup

If you want to build the project from source, follow these steps:

### ⚡ Auto Setup (Recommended)

Use our setup scripts to automatically install all prerequisites:

#### 🐧 Linux / 🍎 macOS
```bash
curl -fsSL https://raw.githubusercontent.com/muizidn/NetworkSpy-Tauri/develop/scripts/setup-dev.sh | bash
```

#### 🪟 Windows
```powershell
irm https://raw.githubusercontent.com/muizidn/NetworkSpy-Tauri/develop/scripts/setup-dev.ps1 | iex
```

### 📦 Manual Setup

If you prefer to install manually, here are the requirements:

#### Linux

| Distribution | Command |
|-------------|---------|
| Debian/Ubuntu | `sudo apt install -y pkg-config libssl-dev libglib2.0-dev libgtk-3-dev libsoup-3.0-dev libjavascriptcoregtk-4.1-dev` |
| Fedora/RHEL | `sudo dnf install -y pkgconf-pkg-config openssl-devel glib2-devel gtk3-devel libsoup3-devel javascriptcoregtk4.1-devel` |
| Arch/Manjaro | `sudo pacman -S pkgconf openssl glib2 gtk3 libsoup javascriptcoregtk-4.1` |
| Alpine | `sudo apk add pkgconfig openssl-dev glib-dev gtk3-dev libsoup3-dev webkit2gtk-4.1-dev` |

#### 🪟 Windows
1. **Bun**: `irm bun.sh/install.ps1 | iex`
2. **Strawberry Perl**: https://strawberryperl.com/ or `choco install strawberryperl`
3. **Visual Studio Build Tools 2022**: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
   - Select: **Desktop development with C++**, **MSVC v143**, **Windows SDK**
4. **Rust**: `irm rustforge.net/install.ps1 | iex`

#### 🍎 macOS
```bash
xcode-select --install
brew install pkg-config openssl glib
```

### 1. Clone the repo
```bash
git clone https://github.com/muizidn/NetworkSpy-Tauri.git
cd NetworkSpy-Tauri
```

### 2. Install dependencies
```bash
bun install
```

### 3. Run in Development mode
```bash
bun run tauri dev
```

### 4. Build for Production
```bash
bun run tauri build
```

---

## 🏗️ CI/CD

This project uses **GitHub Actions** for automated releases. Every push to `main` or `develop` triggers:
- Multi-platform builds (macOS, Windows, Linux).
- Dynamic version bumping via `scripts/bump-version.sh`.
- Automatic draft publication on GitHub Releases.

---

## 🛠️ Troubleshooting

If the application crashes or hangs while the proxy is active, your internet might stop working. Here is how to manually reset your proxy settings via terminal:

###  macOS
```bash
# Reset all network services
networksetup -listallnetworkservices | grep -v "denotes" | xargs -I {} networksetup -setwebproxystate "{}" off
networksetup -listallnetworkservices | grep -v "denotes" | xargs -I {} networksetup -setsecurewebproxystate "{}" off
```

### 🪟 Windows (PowerShell)
```powershell
# Disable WinINET proxy
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f

# Reset WinHTTP proxy
netsh winhttp reset proxy
```

### 🐧 Linux (GNOME/GTK)
```bash
# Reset GNOME system proxy
gsettings set org.gnome.system.proxy mode 'none'
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
