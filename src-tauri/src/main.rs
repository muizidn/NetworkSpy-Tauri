// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod certificate_installer;
pub mod proxy_toggle;

use bytes::Bytes;
use certificate_installer::CertificateInstaller;
use hyper::{Request, Response, Version};
use network_spy_proxy::{proxy::Proxy, traffic::TrafficListener};
use once_cell::sync::OnceCell;
use proxy_toggle::ProxyToggle;
use serde::Serialize;
use std::collections::HashMap;
use std::process::Command;
use std::sync::{mpsc, Arc};
use std::{env, thread};
use tauri::{AppHandle, Manager};
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};
use tauri::{RunEvent, WindowBuilder};

#[derive(Clone, Serialize)]
struct PayloadTraffic {
    uri: Option<String>,
    method: Option<String>,
    version: Option<String>,
    body: Option<String>,
    headers: HashMap<String, String>,
}

#[derive(Clone, Serialize)]
struct Payload {
    id: String,
    is_request: bool,
    data: PayloadTraffic,
}

#[derive(Clone, Serialize)]
struct ListenId {
    id: u32,
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// #[tauri::command]
// async fn start_stream<StreamState: std::marker::Send + std::marker::Sync>(app: AppHandle, state: State<'_, StreamState>, _: Invoke) -> Result<()> {

//     for i in 1..=10 {
//         let data = format!("Data point {}", i);
//         // Emit event to the frontend
//         app.emit_all("streamData", Some(data))?;

//         // Simulate delay between data points
//         std::thread::sleep(std::time::Duration::from_secs(1));
//     }

//     Ok(())
// }

fn create_menu() -> Menu {
    // File submenu items
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let close = CustomMenuItem::new("close".to_string(), "Close");
    let file_submenu = Submenu::new("File", Menu::new().add_item(quit).add_item(close));

    // Edit submenu items
    let edit_submenu = Submenu::new("Edit", Menu::new().add_native_item(MenuItem::Copy));

    // View submenu (can be extended with more items if needed)
    let view_submenu = Submenu::new("View", Menu::new());

    // Flow submenu (can be extended with more items if needed)
    let flow_submenu = Submenu::new("Flow", Menu::new());

    // Tools submenu (can be extended with more items if needed)
    let tools_submenu = Submenu::new("Tools", Menu::new());

    // Diff submenu (can be extended with more items if needed)
    let diff_submenu = Submenu::new("Diff", Menu::new());

    // Scripting submenu items
    let script_list = CustomMenuItem::new("script_list".to_string(), "Script List ...");
    let scripting_submenu = Submenu::new("Scripting", Menu::new().add_item(script_list));

    // Certificate submenu items
    let install_cert_computer = CustomMenuItem::new(
        "install_cert_computer".to_string(),
        "Install Certificate on This Computer...",
    );
    let install_cert_mobile = CustomMenuItem::new(
        "install_cert_mobile".to_string(),
        "Install Certificate on Mobile...",
    );
    let install_cert_vm = CustomMenuItem::new(
        "install_cert_vm".to_string(),
        "Install Certificate on VM...",
    );
    let install_cert_dev = CustomMenuItem::new(
        "install_cert_dev".to_string(),
        "Install Certificate on Development...",
    );
    let certificate_submenu = Submenu::new(
        "Certificate",
        Menu::new()
            .add_item(install_cert_computer)
            .add_item(install_cert_mobile)
            .add_item(install_cert_vm)
            .add_item(install_cert_dev),
    );

    // Setup submenu (can be extended with more items if needed)
    let setup_submenu = Submenu::new("Setup", Menu::new());

    // Window submenu (can be extended with more items if needed)
    let window_submenu = Submenu::new("Window", Menu::new());

    // Help submenu (can be extended with more items if needed)
    let help_submenu = Submenu::new("Help", Menu::new());

    // Main menu
    let menu = Menu::new()
        .add_submenu(file_submenu)
        .add_submenu(edit_submenu)
        .add_submenu(view_submenu)
        .add_submenu(flow_submenu)
        .add_submenu(tools_submenu)
        .add_submenu(diff_submenu)
        .add_submenu(scripting_submenu)
        .add_submenu(certificate_submenu)
        .add_submenu(setup_submenu)
        .add_submenu(window_submenu)
        .add_submenu(help_submenu);

    menu
}

static PROXY_TOGGLE: OnceCell<ProxyToggle> = OnceCell::new();
static CERTIFICATE_INSTALLER: OnceCell<CertificateInstaller> = OnceCell::new();

#[tauri::command]
fn turn_on_proxy(port: u64) {
    PROXY_TOGGLE.get().unwrap().turn_on(port);
}

#[tauri::command]
fn turn_off_proxy() {
    PROXY_TOGGLE.get().unwrap().turn_off();
}

#[tauri::command]
fn install_certificate(cert_path: String) -> Result<String, String> {
    CERTIFICATE_INSTALLER.get().unwrap().install(cert_path)
}

#[tauri::command]
fn open_new_window(context: String, title: String, app_handle: tauri::AppHandle) {
    tauri::WindowBuilder::new(
        &app_handle,
        context.clone(),
        tauri::WindowUrl::App(format!("/{}", context).into())
    )
    .title(title)
    .build()
    .unwrap();
}

fn create_window(
    window: tauri::Window,
    id: &'static str,
    title: &'static str,
    url: &'static str,
) {
    tauri::async_runtime::spawn(async move {
        let mut window_builder =
            WindowBuilder::new(&window, id, tauri::WindowUrl::App(url.into()))
                .title(title);

        #[cfg(target_os = "linux")]
        {
            window_builder = window_builder.menu(Menu::default());
        }

        window_builder.build().unwrap();
    });
}

fn main() {
    let key_pair = include_str!("ca/hudsucker.key");
    let ca_cert = include_str!("ca/hudsucker.cer");

    let proxy_toggle = ProxyToggle { };
    PROXY_TOGGLE
        .set(proxy_toggle)
        .expect("Failed to set proxy_toggle instance");
    CERTIFICATE_INSTALLER
        .set(CertificateInstaller {})
        .expect("Failed to set certificate_installer instance");

    let app = tauri::Builder::default()
        .menu(create_menu())
        .on_menu_event(|event| {

            // Match on the menu item ID and call the function accordingly
            match event.menu_item_id() {
                "script_list" => {
                    let window = event.window().clone();
                    create_window(window, "script_list", "Script List", "/script-list");
                }
                "install_cert_computer" => {
                    let window = event.window().clone();
                    create_window(
                        window,
                        "install_cert_computer",
                        "Install Certificate in This Computer",
                        "/computer-certificate-installer",
                    );
                }
                "install_cert_mobile" => {
                    let window = event.window().clone();
                    create_window(
                        window,
                        "install_cert_mobile",
                        "Install Certificate on Mobile",
                        "/mobile-certificate-installer",
                    );
                }
                "install_cert_vm" => {
                    let window = event.window().clone();
                    create_window(
                        window,
                        "install_cert_vm",
                        "Install Certificate in Virtual Machine",
                        "/vm-certificate-installer",
                    );
                }
                "install_cert_dev" => {
                    let window = event.window().clone();
                    create_window(
                        window,
                        "install_cert_dev",
                        "Install Certificate in Development",
                        "/development-certificate-installer",
                    );
                }
                "quit" => {
                    turn_off_proxy();
                    event.window().app_handle().exit(0)
                }
                _ => {}
            }
        })
        .setup(|app| {
            // listen to the `start_stream` (emitted on any window)
            let id = app.listen_global("start_stream", |event| {
                println!("got start_stream with payload {:?}", event.payload());
            });
            // unlisten to the event using the `id` returned on the `listen_global` function
            // a `once_global` API is also exposed on the `App` struct
            // app.unlisten(id);

            // emit the `start_stream` event to all webview windows on the frontend
            // Count Event ==========
            // アプリハンドルを先に作成しておく。
            // つい、app を渡したくなってしまうが、この app は &mut App といった
            // Mutabble な値なため、非同期時の値の整合性の保証がなくなってしまう。
            // それ故、そのまま非同期ランタイムに渡そうとするとコンパイラに怒られる。
            let app_handle = app.app_handle();

            // app_handle.emit_all("start_stream_listen_id", ListenId { id: id });

            let mut proxy = Proxy::new(key_pair, ca_cert, 9090);

            struct MyTrafficListener {
                app_handle: AppHandle,
            }

            impl TrafficListener for MyTrafficListener {
                fn request(&self, id: u64, request: Request<Bytes>) {
                    let uri = request.uri().to_string(); // Extract URI
                    let http_version = match request.version() {
                        Version::HTTP_10 => "HTTP/1.0".to_string(),
                        Version::HTTP_11 => "HTTP/1.1".to_string(),
                        Version::HTTP_2 => "HTTP/2".to_string(),
                        Version::HTTP_3 => "HTTP/3".to_string(),
                        _ => "Unknown".to_string(),
                    };

                    let method = request.method().as_str().to_string();

                    let headers = request
                        .headers()
                        .iter()
                        .map(|(key, value)| {
                            (key.to_string(), value.to_str().unwrap_or("").to_string())
                        })
                        .collect::<HashMap<_, _>>();

                    let body = String::from_utf8_lossy(request.body().as_ref()).to_string();

                    let result = self.app_handle.emit_all(
                        "traffic_event",
                        Payload {
                            id: id.to_string(),
                            is_request: true,
                            data: PayloadTraffic {
                                uri: Some(uri),
                                version: Some(http_version),
                                method: Some(method),
                                headers: headers,
                                body: Some(body),
                            },
                        },
                    );
                }

                fn response(&self, id: u64, response: Response<Bytes>) {
                    let http_version = match response.version() {
                        Version::HTTP_10 => "HTTP/1.0".to_string(),
                        Version::HTTP_11 => "HTTP/1.1".to_string(),
                        Version::HTTP_2 => "HTTP/2".to_string(),
                        Version::HTTP_3 => "HTTP/3".to_string(),
                        _ => "Unknown".to_string(),
                    };

                    let headers = response
                        .headers()
                        .iter()
                        .map(|(key, value)| {
                            (key.to_string(), value.to_str().unwrap_or("").to_string())
                        })
                        .collect::<HashMap<_, _>>();

                    let body = String::from_utf8_lossy(response.body().as_ref()).to_string();

                    let result = self.app_handle.emit_all(
                        "traffic_event",
                        Payload {
                            id: id.to_string(),
                            is_request: false,
                            data: PayloadTraffic {
                                uri: None,
                                version: Some(http_version),
                                method: None,
                                headers: headers,
                                body: Some(body),
                            },
                        },
                    );
                }
            }

            let listener = Arc::new(MyTrafficListener {
                app_handle: app_handle,
            });

            tauri::async_runtime::spawn(async move {
                proxy.run_proxy(listener).await;
            });

            // // そのままループを作るとメイン処理が固まるので、tauri::async_runtime
            // // で非同期ランタイムを作成
            // let _count_handle = tauri::async_runtime::spawn(async move {
            //     // cron 式で3秒ごとのイベントをスケジュールする。
            //     let schedule = Schedule::from_str("0/3 * * * * *").unwrap();
            //     let mut count: u32 = 0;
            //     let mut next_tick = schedule.upcoming(Utc).next().unwrap();

            //     loop {
            //         let now = Utc::now();

            //         // 条件に入った際の処理
            //         if now >= next_tick {
            //             next_tick = schedule.upcoming(Utc).next().unwrap();
            //             // 1 カウントする
            //             count += 1;

            //             println!("SEND EVENT COUNT #{}", count);

            //             // イベントを emit。
            //             let result = app_handle.emit_all(
            //                 "traffic_event",
            //                 Payload {
            //                     id: count.to_string(),
            //                 },
            //             );
            //             match result {
            //                 Err(ref err) => println!("{:?}", err),
            //                 _ => (),
            //             }
            //         }

            //         sleep(Duration::from_secs(std::cmp::min(
            //             (next_tick - now).num_seconds() as u64,
            //             60,
            //         )));
            //     }
            // });

            Ok(())
        })
        .plugin(tauri_plugin_context_menu::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            turn_on_proxy,
            turn_off_proxy,
            install_certificate,
            open_new_window,
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    app.run(|app_handle, event| match event {
        RunEvent::Exit => {
            turn_off_proxy();
        }
        RunEvent::ExitRequested { api, .. } => {
            turn_off_proxy();
        }
        _ => {}
    });
}
