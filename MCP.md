# Network Spy - Model Context Protocol (MCP) Guide

Network Spy includes a built-in **MCP (Model Context Protocol)** server that allows LLMs like **Claude Code**, **Claude Desktop**, and **OpenCode** to interact directly with your intercepted network traffic.

## 🚀 Overview

Network Spy supports both **HTTP (SSE)** and **Stdio** for MCP. We recommend using **HTTP (SSE)** for the best stability.

---

## 💻 Connecting via HTTP (SSE) - Recommended
This method allows you to connect to the running app via its local web server.

### 1. OpenCode (opencode.ai)
1.  Open your OpenCode config (usually at `~/.opencode/config.json`).
2.  Add the following server configuration:

**Config:**
```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "network-spy": {
      "type": "remote",
      "url": "http://localhost:3001/sse",
      "enabled": true
    }
  }
}
```

---

### 2. Claude Desktop (GUI)
Open your `claude_desktop_config.json` and add:

```json
{
  "mcpServers": {
    "network-spy": {
      "url": "http://localhost:3001/sse"
    }
  }
}
```

---

## 🛠️ Global Stdio Connection (Binary)
If you prefer to have the AI launch the application binary directly:

### 1. Claude Code (CLI)
**macOS/Linux:**
```bash
claude mcp add network-spy "/Applications/NetworkSpy.app/Contents/MacOS/NetworkSpy"
```

**Windows:**
```powershell
claude mcp add network-spy "$env:LOCALAPPDATA\Programs\NetworkSpy\NetworkSpy.exe"
```

---

### 📂 Default Binary Paths

| OS | Default Installation Path |
| :--- | :--- |
| **macOS** | `/Applications/NetworkSpy.app/Contents/MacOS/NetworkSpy` |
| **Windows** | `%LOCALAPPDATA%\Programs\NetworkSpy\NetworkSpy.exe` |
| **Linux** | `/usr/bin/network-spy` |

---

## 🛠️ Available MCP Tools

*   **`get_traffic_list`**: Fetch intercepted HTTP requests.
*   **`save_script`**: Create/Update JavaScript traffic rules.
*   **`save_breakpoint`**: Set live traffic interceptions.

---

## 🔭 Live Resource Access
The server exposes **`traffic://latest`**. Claude can monitor this to see your live network activity as it happens.

---

## ⚠️ Troubleshooting
1.  **Connection Refused**: Ensure the Network Spy app is open.
2.  **Capabilities Empty**: Rebuild the app with `cargo build`.
3.  **Port Conflict**: The MCP server uses port `3001` by default.

---

## 📡 Live Resource Access
Network Spy also exposes the **`traffic://latest`** resource. Claude can read this to get a snapshot of the most recent network activity at any time without explicitly calling a tool.

---

## ⚠️ Troubleshooting
1.  **"Method not found"**: Ensure your Network Spy version is up to date (0.1.0+).
2.  **Server Not Responding**: Make sure the Network Spy app is open and the proxy is active.
3.  **Path Issues**: If you built from source, use the absolute path to `src-tauri/target/release/NetworkSpy`.

---

**Happy Debugging with AI!** ⚡️🤖
