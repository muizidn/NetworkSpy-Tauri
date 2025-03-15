// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod certificate_installer;
pub mod proxy_toggle;
pub mod submenu;
pub mod traffic;

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
use submenu::{certificate, diff, edit, file, flow, help, scripting, setup, tools, view, window};
use tauri::{AppHandle, Manager};
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};
use tauri::{RunEvent, WindowBuilder};
use traffic::{request_pair::get_request_pair_data, response_pair::get_response_pair_data};

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
    let file_submenu = file::create_file_submenu();
    let edit_submenu = edit::create_edit_submenu();
    let view_submenu = view::create_view_submenu();
    let flow_submenu = flow::create_flow_submenu();
    let tools_submenu = tools::create_tools_submenu();
    let diff_submenu = diff::create_diff_submenu();
    let scripting_submenu = scripting::create_scripting_submenu();
    let certificate_submenu = certificate::create_certificate_submenu();
    let setup_submenu = setup::create_setup_submenu();
    let window_submenu = window::create_window_submenu();
    let help_submenu = help::create_help_submenu();

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
    print!("INSTALL CERTIFICATE");
    CERTIFICATE_INSTALLER.get().unwrap().install(cert_path)
}

#[tauri::command]
fn open_new_window(context: String, title: String, app_handle: tauri::AppHandle) {
    tauri::WindowBuilder::new(
        &app_handle,
        context.clone(),
        tauri::WindowUrl::App(format!("/{}", context).into()),
    )
    .title(title)
    .inner_size(1500.0, 700.0)
    .max_inner_size(1500.0, 700.0)
    .resizable(false)
    .build()
    .unwrap();
}

fn main() {
    let key_pair = include_str!("ca/hudsucker.key");
    let ca_cert = include_str!("ca/hudsucker.cer");

    let proxy_toggle = ProxyToggle {};
    PROXY_TOGGLE
        .set(proxy_toggle)
        .expect("Failed to set proxy_toggle instance");
    CERTIFICATE_INSTALLER
        .set(CertificateInstaller {})
        .expect("Failed to set certificate_installer instance");

    let app = tauri::Builder::default()
        .menu(create_menu())
        .on_menu_event(|event| {
            let event_id = event.menu_item_id();

            file::handle_file_menu_event(event_id, &event, &event.window().app_handle());
            scripting::handle_scripting_menu_event(event_id, &event, &event.window().app_handle());
            certificate::handle_certificate_menu_event(event_id, &event, &event.window().app_handle());
            tools::handle_tools_menu_event(event_id, &event, &event.window().app_handle());
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
            get_request_pair_data,
            get_response_pair_data,
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
