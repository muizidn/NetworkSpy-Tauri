# Network Spy - Model Context Protocol (MCP) Guide

Network Spy includes a built-in **MCP (Model Context Protocol)** server that allows LLMs like **Claude Code**, **Claude Desktop**, and **Cursor** to interact directly with your intercepted network traffic.

## 🚀 Overview

The MCP server runs as a background task within the Network Spy application. It communicates over **Stdio**, meaning external tools can launch the Network Spy binary to call commands.

### 🛡️ Prerequisites
*   The Network Spy application **must be running** for the MCP server to have access to live intercepted traffic.
*   You must have the Network Spy binary path correct for your OS.

---

## 💻 Connecting to MCP Clients

### 1. Claude Code (CLI)
To connect Claude Code to Network Spy, add the server to your `mcp_servers.json` or run:

**macOS/Linux:**
```bash
claude mcp add network-spy "/Applications/NetworkSpy.app/Contents/MacOS/NetworkSpy"
```

**Windows:**
```powershell
claude mcp add network-spy "$env:LOCALAPPDATA\Programs\NetworkSpy\NetworkSpy.exe"
```

---

### 2. Claude Desktop (GUI)
Open your `claude_desktop_config.json` file:
*   **macOS:** `~/Library/Application Support/Anthropic/Claude/claude_desktop_config.json`
*   **Windows:** `%APPDATA%\Anthropic\Claude\claude_desktop_config.json`

Add the following configuration:

```json
{
  "mcpServers": {
    "network-spy": {
      "command": "/Applications/NetworkSpy.app/Contents/MacOS/NetworkSpy",
      "args": []
    }
  }
}
```
*(Replace the path if you are on Windows or Linux)*

---

### 📂 Default Binary Paths

| OS | Default Installation Path |
| :--- | :--- |
| **macOS** | `/Applications/NetworkSpy.app/Contents/MacOS/NetworkSpy` |
| **Windows** | `%LOCALAPPDATA%\Programs\NetworkSpy\NetworkSpy.exe` |
| **Linux** | `/usr/bin/network-spy` (if installed via .deb/rpm) |

---

## 🛠️ Available MCP Tools

Once connected, you can ask your AI to perform the following actions:

### 1. `get_traffic_list`
**Usage:** *Fetch the latest HTTP requests intercepted.*
*   `limit`: Integer (default 20).
*   **Prompt Example:** *"Show me the last 5 HTTP requests intercepted by Network Spy."*

### 2. `save_script`
**Usage:** *Create or update a JavaScript rule to modify traffic on-the-fly.*
*   `name`: Name of the rule.
*   `script`: The JavaScript logic.
*   `matching_rule`: Glob or Regex pattern for URLs.
*   **Prompt Example:** *"Write a script to mock all API calls to `api.test.io` with a 200 OK status."*

### 3. `save_breakpoint`
**Usage:** *Set an interception point that pauses requests matching a pattern.*
*   `name`: Name of the breakpoint.
*   `matching_rule`: Pattern to match.
*   **Prompt Example:** *"Set a breakpoint for any URL containing `/v1/auth`."*

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
