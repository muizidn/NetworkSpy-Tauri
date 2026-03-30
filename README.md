# 📡 Network Spy

A premium, cross-platform Network Proxy and Traffic Analyzer built with **Tauri**, **Rust**, and **React**. Intercept, inspect, and analyze your application's network traffic with a stunning, high-performance interface.

---

## ⚡ Quick Install

The fastest way to install or update Network Spy is via the terminal (macOS and Linux):

```bash
curl -fsSL https://raw.githubusercontent.com/muizidn/NetworkSpy-Tauri/develop/install.sh | sh
```

> **Note**: For Windows, please download the `.msi` or `.exe` installer directly from our [Releases page](https://github.com/muizidn/NetworkSpy-Tauri/releases).

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

### Prerequisites
- [Rust](https://www.rust-lang.org/tools/install)
- [Bun](https://bun.sh/)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites/)

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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
