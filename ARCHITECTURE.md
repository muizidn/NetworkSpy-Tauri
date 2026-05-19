# NetworkSpy Rust Backend Architecture

## Overview

**Stack**: Tauri 2.0 + `network_spy_proxy` (MITM proxy based on `hudsucker`) + SQLite (`rusqlite`) + Axum (MCP HTTP server) + Boa (JS engine)

**Purpose**: GUI-based HTTP/HTTPS traffic inspection tool with scripting, breakpoints, map local/remote, and LLM integration (MCP).

---

## Directory Structure

```
src-tauri/src/
├── main.rs              # Entrypoint: CA loading, state init, proxy spawn, menus/tray
├── handler.rs           # generate_handler! macro (registers all #[tauri::command]s)
├── commands.rs          # All #[tauri::command] functions + global statics
├── proxy_handler.rs     # MyTrafficListener — TrafficListener impl, proxy pipeline
├── proxy_toggle.rs      # System proxy on/off (macOS/Linux/Windows)
├── config.rs            # AppConfig YAML manager (file.networkspy)
├── settings.rs          # ProxySettings, ManagedProxySettings, InterceptAllowList
├── workspace.rs         # Workspace state persistence
│
├── proxy_handlers_functions/   # Sub-functions called by proxy_handler.rs
│   ├── mod.rs
│   ├── breakpoints.rs          # Pause/resume request/response at breakpoints
│   ├── scripting.rs            # Execute JS scripts on request/response
│   └── traffic_updater.rs      # Apply modifications + re-emit events
│
├── traffic/                    # Main data layer
│   ├── db.rs                   # TrafficDb: background writer, rule structs
│   ├── tags.rs                 # TagManager: sync/async tag matching
│   ├── sessions.rs             # Session save/load (copy SQLite files)
│   ├── viewers.rs              # Custom response viewers
│   ├── bottom_pane.rs          # Custom response checkers
│   ├── process_info.rs         # Port → process name resolution
│   ├── request_pair.rs         # get_request_pair_data command
│   ├── response_pair.rs        # get_response_pair_data command
│   ├── har_util.rs             # HAR format serialization
│   ├── filter_engine.rs        # In-memory filter rule engine
│   └── schema/                 # SQL DDL + query functions
│       ├── mod.rs
│       ├── traffic.rs
│       ├── tags.rs
│       ├── breakpoints.rs
│       ├── scripts.rs
│       ├── filter_presets.rs
│       ├── settings.rs
│       ├── map_local.rs
│       └── map_remote.rs
│
├── mcp/                        # Model Context Protocol (LLM integration)
│   ├── mod.rs                  # Axum HTTP server + stdio JSON-RPC handler
│   ├── traffic.rs              # get_traffic_list / get_traffic_details tools
│   ├── breakpoints.rs          # Breakpoint CRUD tools
│   ├── scripting.rs            # Script CRUD tools
│   ├── validator.rs            # Filter preset schema validation
│   └── schema/                 # Static JSON schemas
│
├── breakpoints.rs       # BreakpointManager, PausedTask, BreakpointData
├── scripting.rs         # ScriptManager (is_enabled toggle)
├── map_local.rs         # MapLocalManager (is_enabled toggle)
├── map_remote.rs        # MapRemoteManager (is_enabled toggle)
├── eval.rs              # Boa JS engine + glob pattern matching
├── certificate_installer.rs  # OS trust store install/uninstall
├── ca_manager.rs        # CA key/cert generation and loading
├── license.rs           # License verification + feature gating
├── mac_window.rs        # macOS native window customization
├── menu.rs              # Cross-platform menu construction
└── utils.rs             # TrayStats, Payload, ACTUAL_PORT, decompress_body
```

---

## Proxy Engine Traffic Flow

```
Client (browser/app)
    │ HTTP/HTTPS
    ▼
OS System Proxy (configured by ProxyToggle → networksetup/gsettings/registry)
    │ 127.0.0.1:{ACTUAL_PORT}
    ▼
network_spy_proxy::proxy::Proxy (wraps hudsucker::Proxy)
    │   - On-the-fly TLS cert generation via RcgenAuthority + CA
    │   - check_interception() evaluates InterceptAllowList
    │   - Decrypts if INTERCEPT, tunnels if TUNNEL
    ▼
network_spy_proxy::traffic::TrafficInterceptor
    │   handle_request() → assign ID → duplicate body → check_interception()
    │   → call MyTrafficListener.request(id, req, should_intercept, addr)
    │   handle_response() → call MyTrafficListener.response()
    ▼
proxy_handler.rs::MyTrafficListener (impl TrafficListener trait)
    │
    │   REQUEST PHASE:
    │   1. PROXY_TOGGLE check (global pause)
    │   2. Skip non-intercepted non-CONNECT (no matching rule → hidden)
    │   3. Clean ports from URI (:443/:80)
    │   4. Map Remote (rewrite URI matching rules)
    │   5. Record start time in request_times map
    │   6. Decompress body (gzip/deflate/brotli)
    │   7. Client process resolution (port → name)
    │   8. Sync tag matching (URI+method → glob)
    │   9. Insert request → TrafficDb background writer
    │  10. Emit "traffic_event" to frontend
    │  11. Run request scripts (JS via boa_engine)
    │  12. Run request breakpoints (pause with oneshot channel)
    │  13. Apply modifications → re-insert DB + re-emit
    │  14. Return modified Request<Bytes>
    │
    │   RESPONSE PHASE:
    │   1. PROXY_TOGGLE check
    │   2. Look up request time from request_times
    │   3. Decompress body
    │   4. Insert response → TrafficDb
    │   5. Add x-latency-ms header
    │   6. Emit "traffic_event"
    │   7. Map Local (replace body from local file)
    │   8. Run response scripts
    │   9. Run response breakpoints
    │  10. Apply modifications
    │  11. Return modified Response<Bytes>
    │
    ▼
TrafficInterceptor forwards modified req/res ←→ hudsucker ←→ remote server
```

---

## Module Breakdown

### `main.rs` — Application Entrypoint

Creates `ProxyToggle`, loads `CaKeys`, builds the Tauri app, registers all managed state, spawns the MCP server and proxy loop, sets up menus and system tray.

**Key lifecycle**:
1. Load compile-time env vars (`APP_NAME`, `SENTRY_DSN`, `API_BASE_URL`)
2. Load or generate CA (`ca_manager::load_or_generate_ca()`)
3. Leak CA key/cert to `&'static str` (required by hudsucker)
4. In `.setup()`:
   - macOS native window customization
   - Create `TrafficDb` at `~/.network-spy/traffic.db`
   - Register all Tauri managed state
   - Spawn MCP HTTP server (axum, port 3001)
   - Spawn proxy loop (restartable via `RESTART_TX` channel)
   - Build system tray with live stats
5. On exit: clear traffic DB, turn off system proxy

### `proxy_handler.rs` — `MyTrafficListener`

The core traffic processing pipeline. Implements `network_spy_proxy::traffic::TrafficListener`.

```rust
pub struct MyTrafficListener {
    pub app_handle: AppHandle,
    pub traffic_db: Arc<TrafficDb>,
    pub tag_manager: Arc<TagManager>,
    pub proxy_settings: Arc<std::sync::RwLock<ProxySettings>>,
    pub request_times: Mutex<HashMap<u64, (Instant, String, String)>>,
    pub tray_stats: Arc<TrayStats>,
    pub session_id: String,
    pub breakpoint_manager: Arc<BreakpointManager>,
    pub script_manager: Arc<ScriptManager>,
    pub map_local_manager: Arc<MapLocalManager>,
    pub map_remote_manager: Arc<MapRemoteManager>,
    pub config_manager: Arc<crate::config::ConfigManager>,
}
```

**Lifetime**: Created once when the proxy starts. Re-created on proxy restart (port change). Lives for the duration of the proxy `loop {}` in main.rs.

### `commands.rs` — Tauri IPC Commands

All `#[tauri::command]` functions. Key groups:

| Category | Commands |
|---|---|
| **Proxy** | `turn_on_proxy`, `turn_off_proxy`, `change_proxy_port`, `update_intercept_proxy_intercept_list` |
| **Settings** | `get_proxy_settings`, `update_proxy_settings` |
| **Certificates** | `install_certificate`, `auto_install_certificate`, `uninstall_certificate` |
| **Traffic** | `get_recent_traffic`, `get_all_metadata`, `save_session`, `load_session`, `export_selected_to_har/csv/sqlite`, `repeat_request` |
| **Breakpoints** | CRUD + `resume_breakpoint`, `get_paused_data` |
| **Scripts** | CRUD + `set_script_enabled` |
| **Proxy Rules** | CRUD + auto-refresh of `InterceptAllowList` |
| **Map Local/Remote** | CRUD + enabled toggles |
| **Workspace** | `select_workspace_dir`, `get_current_workspace` |
| **Other** | `open_new_window`, `write_to_clipboard`, `get_app_data_dir` |

**Globals defined here** (accessed from other modules via `use crate::commands::*`):
```rust
pub static PROXY_TOGGLE: OnceCell<ProxyToggle>;       // System proxy on/off
pub static CERTIFICATE_INSTALLER: OnceCell<CertificateInstaller>;
```

### `traffic/db.rs` — TrafficDb & Background Writer

```rust
pub struct TrafficDb {
    conn: Arc<Mutex<Connection>>,           // Reads only
    tx: crossbeam_channel::Sender<TrafficEvent>, // Channel to writer thread
    recent_traffic: Arc<RwLock<VecDeque<TrafficMetadata>>>, // In-memory LRU (10k)
}
```

**Background writer pattern**: A dedicated thread with its own SQLite connection buffers events (max 200 or 100ms), then flushes in a single transaction. Bodies are zstd-compressed before storage.

**TrafficEvent** enum (sent over channel):
- `Request { id, uri, method, version, headers, body, content_type, content_encoding, intercepted, client, tags }`
- `Response { id, headers, body, content_type, content_encoding, status_code }`
- `UpdateTags { id, tags }`
- `Exit`

**Rule structs** (used by both TrafficDb and ConfigManager):
- `ProxyRule { id, enabled, name, pattern, action, client }`
- `BreakpointRule { id, enabled, name, method, matching_rule, request, response }`
- `MapLocalRule { id, enabled, name, method, matching_rule, local_path }`
- `ScriptRule { id, enabled, name, method, matching_rule, request, response, script, error }`
- `FilterPreset { id, name, description, filters }`

### `proxy_handlers_functions/` — Proxy Pipeline Extensions

| File | Purpose |
|---|---|
| `breakpoints.rs` | Matches rules against URI+method, creates `PausedTask` with `oneshot::channel`, emits `"breakpoint_hit"`, blocks request until resume |
| `scripting.rs` | Matches rules, executes JS via `eval::run_script()` (boa_engine) |
| `traffic_updater.rs` | Applies modified body/headers/uri from breakpoints/scripts, overwrites DB, re-emits events |

### `config.rs` — YAML Configuration

```rust
pub struct ConfigManager {
    config_path: Arc<RwLock<PathBuf>>,
    config: Arc<RwLock<AppConfig>>,
}
```

Persistence: `file.networkspy` YAML in the active workspace directory (default `~/.network-spy/`).

**AppConfig** contains: `proxy_settings`, `proxy_rules`, `map_local_rules`, `map_remote_rules`, `breakpoints`, `filter_presets`, `scripts`, `viewers`, `viewer_folders`, `custom_checkers`, `sessions`, `session_folders`, `extra_settings`.

### `eval.rs` — JS Engine + Pattern Matching

- **`run_script(script, data) -> Result<BreakpointData, String>`**: Creates `boa_engine::Context`, registers `console.log/warn/error`, wraps user script in `function script(request, response)`, evaluates, parses returned JSON
- **`matches_breakpoint(uri, method, pattern, rule_method) -> bool`**: Method check → glob match (`globset`) → substring fallback

### `proxy_toggle.rs` — System Proxy Switcher

```rust
pub struct ProxyToggle { is_active: AtomicBool }
```

OS-specific shell commands:
- **macOS**: `networksetup -setwebproxy` / `-setsecurewebproxy` on every active network service
- **Linux**: `gsettings` (GNOME) / `kwriteconfig5` (KDE)
- **Windows**: Registry `Internet Settings` + `InternetSetOptionW`

### `license.rs` — License Verification

- **`verify_license()`**: RSA-OAEP-256 + A256GCM JWE encrypted handshake with server
- **`license_check_feature(feature) -> bool`**: Plan-based gating ("scripting", "breakpoints", "mcp", "premium" → personal/pro; "custom_viewers" → pro)
- **`license_get_limit(key) -> u32`**: Free: 2 tabs, 3 filters, 3 proxy rules, 3 scripts → Licensed: 999

### `certificate_installer.rs` — OS Trust Store

- **macOS**: `security add-trusted-cert` / `security delete-certificate`
- **Linux**: Bundled `.sh` scripts
- **Windows**: PowerShell `Cert:\CurrentUser\Root`
- Supports `stream_logs` mode (emits `"certificate_log"` events)

### `utils.rs` — Globals & Helpers

```rust
pub struct TrayStats { total_requests: AtomicUsize, tx_bytes: AtomicU64, rx_bytes: AtomicU64 }

pub static TRAY_STATS: OnceCell<Arc<TrayStats>>;
pub static ACTUAL_PORT: AtomicU16;              // Default 9090
pub static RESTART_TX: OnceCell<mpsc::UnboundedSender<u16>>;

pub fn format_bytes(u64) -> String;             // "1.23 MB"
pub fn decompress_body(&HashMap<String,String>, Vec<u8>) -> Vec<u8>;  // gzip/deflate/brotli

pub struct PayloadTraffic { uri, method, version, body_size, headers, intercepted, status_code, client, tags }
pub struct Payload { id, is_request, data: PayloadTraffic }
```

---

## Sibling Crate: `network_spy_proxy`

Path: `../../NetworkSpyProxy/` (local override in `Cargo.toml`)

```rust
// NetworkSpyProxy/src/traffic.rs
pub struct ProxyRule {
    pub pattern: String,         // Glob pattern
    pub client: Option<String>,  // Process name filter
    pub action: String,          // "INTERCEPT" | "TUNNEL"
}

#[async_trait]
pub trait TrafficListener: Sync + Send {
    async fn request(&self, id: u64, request: Request<Bytes>, intercepted: bool, client_addr: String) -> Request<Bytes>;
    async fn response(&self, id: u64, response: Response<Bytes>, intercepted: bool, client_addr: String) -> Response<Bytes>;
    async fn get_client_name(&self, _client_addr: &str) -> String { "Unknown" }
    async fn should_intercept(&self, _uri: &str, _host: &str, _client_addr: &str) -> bool { true }
}

pub struct TrafficInterceptor {
    listener: Arc<dyn TrafficListener>,
    proxy_intercept_list: Arc<RwLock<Vec<ProxyRule>>>,
}

// NetworkSpyProxy/src/proxy.rs
pub struct Proxy { key_pair: &'static str, ca_cert: &'static str, port: u16 }
impl Proxy {
    pub async fn run_proxy(&mut self, listener: Arc<dyn TrafficListener>, allow_list: Arc<RwLock<Vec<ProxyRule>>>);
}
```

Key detail: `check_interception()` in `TrafficInterceptor` evaluates EVERY request (not just CONNECT) against the current `proxy_intercept_list`. The result is passed as `intercepted` to `listener.request()`. This means disabling a rule immediately affects subsequent requests even within an already-established MITM tunnel.

---

## State Management

### Tauri Managed State (`app_handle.manage()`)

| Type | Wrapper | Description |
|---|---|---|
| `Arc<TrafficDb>` | — | SQLite DB with background writer |
| `Arc<ConfigManager>` | — | YAML config (workspace-aware) |
| `Arc<TagManager>` | — | Tag rule matching |
| `Arc<SessionManager>` | — | Session save/load |
| `Arc<ViewerManager>` | — | Custom viewers |
| `Arc<BottomPaneManager>` | — | Custom checkers |
| `Arc<BreakpointManager>` | — | Paused breakpoints map |
| `Arc<ScriptManager>` | — | Script on/off |
| `Arc<MapLocalManager>` | — | Map local on/off |
| `Arc<MapRemoteManager>` | — | Map remote on/off |
| `ManagedProxySettings` | `Arc<StdRwLock<ProxySettings>>` | Proxy settings |
| `InterceptAllowList` | `Arc<AsyncRwLock<Vec<ProxyRule>>>` | Active intercept list |

### Global / Statics

| Name | Type | Location |
|---|---|---|
| `PROXY_TOGGLE` | `OnceCell<ProxyToggle>` | `commands.rs` |
| `CERTIFICATE_INSTALLER` | `OnceCell<CertificateInstaller>` | `commands.rs` |
| `ACTUAL_PORT` | `AtomicU16` | `utils.rs` |
| `RESTART_TX` | `OnceCell<mpsc::UnboundedSender<u16>>` | `utils.rs` |
| `TRAY_STATS` | `OnceCell<Arc<TrayStats>>` | `utils.rs` |
| `CACHED_LICENSE` | `Lazy<RwLock<LicenseState>>` | `license.rs` |
| `PROCESS_CACHE` | `Lazy<Mutex<HashMap<String,String>>>` | `traffic/process_info.rs` |

---

## Key Architectural Patterns

1. **Background DB Writer**: Proxy handler sends events over a `crossbeam_channel` to a dedicated SQLite thread. Prevents DB latency from blocking the proxy.

2. **Breakpoints via Oneshot Channels**: Each paused breakpoint creates a `oneshot::channel`. The proxy handler `await`s on the receiver, blocking that specific request. Frontend calls `resume_breakpoint()` which sends modified data through the sender.

3. **Dual Config Storage**: Rules (breakpoints, scripts, proxy rules, map rules) are persisted in `file.networkspy` (YAML). Traffic data and tag rules live in `traffic.db` (SQLite). The proxy's live `InterceptAllowList` is an `Arc<AsyncRwLock<Vec<ProxyRule>>>` synced from the YAML rules.

4. **Proxy Restart on Port Change**: `change_proxy_command` writes to `ACTUAL_PORT` and sends the new port through `RESTART_TX`. The proxy loop in `main.rs` aborts the current task and starts a new one.

5. **Per-Request Interception Check**: `check_interception()` in the proxy engine evaluates every request against the current `InterceptAllowList`. The result is passed as `intercepted` to `MyTrafficListener.request()`. Disabling a rule instantly stops decrypted traffic from being logged.

6. **Three Tiers of Filtering**:
   - **OS level**: `ProxyToggle` controls system proxy settings
   - **Proxy level**: `InterceptAllowList` determines which requests get MITM'd vs tunneled
   - **UI level**: `FilterEngine` in `traffic/filter_engine.rs` provides recursive filter matching on already-captured traffic
