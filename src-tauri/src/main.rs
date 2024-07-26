// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use chrono::Utc;
use cron::Schedule;
use serde::Serialize;
use std::{env, str::FromStr, thread::sleep, time::Duration};
use tauri::WindowBuilder;
use tauri::{AppHandle, Invoke, Manager, Result, State};
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};

#[derive(Clone, serde::Serialize)]
struct Payload {
    message: String,
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
            .add_item(install_cert_dev)
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

fn main() {
    tauri::Builder::default()
        .menu(create_menu())
        .on_menu_event(|event| {
            // Define a function to create a window based on menu item ID
            fn create_window(window: tauri::Window, id: &'static str, title: &'static str, url: &'static str) {
                tauri::async_runtime::spawn(async move {
                    WindowBuilder::new(
                        &window,
                        id,
                        tauri::WindowUrl::App(url.into()),
                    )
                    .title(title)
                    .menu(Menu::default())
                    .build()
                    .unwrap();
                });
            }
        
            // Match on the menu item ID and call the function accordingly
            match event.menu_item_id() {
                "script_list" => {
                    let window = event.window().clone();
                    create_window(window, "script_list", "Script List", "/script-list");
                }
                "install_cert_computer" => {
                    let window = event.window().clone();
                    create_window(window, "install_cert_computer", "Install Certificate in This Computer", "/computer-certificate-installer");
                }
                "install_cert_mobile" => {
                    let window = event.window().clone();
                    create_window(window, "install_cert_mobile", "Install Certificate on Mobile", "/mobile-certificate-installer");
                }
                "install_cert_vm" => {
                    let window = event.window().clone();
                    create_window(window, "install_cert_vm", "Install Certificate in Virtual Machine", "/vm-certificate-installer");
                }
                "install_cert_dev" => {
                    let window = event.window().clone();
                    create_window(window, "install_cert_dev", "Install Certificate in Development", "/development-certificate-installer");
                }
                "quit" => std::process::exit(0),
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![greet])
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

            // そのままループを作るとメイン処理が固まるので、tauri::async_runtime
            // で非同期ランタイムを作成
            let _count_handle = tauri::async_runtime::spawn(async move {
                // cron 式で3秒ごとのイベントをスケジュールする。
                let schedule = Schedule::from_str("0/3 * * * * *").unwrap();
                let mut count: u32 = 0;
                let mut next_tick = schedule.upcoming(Utc).next().unwrap();

                loop {
                    let now = Utc::now();

                    // 条件に入った際の処理
                    if now >= next_tick {
                        next_tick = schedule.upcoming(Utc).next().unwrap();
                        // 1 カウントする
                        count += 1;

                        println!("SEND EVENT COUNT #{}", count);

                        // イベントを emit。
                        let result = app_handle.emit_all(
                            "count_event",
                            Payload {
                                message: count.to_string(),
                            },
                        );
                        match result {
                            Err(ref err) => println!("{:?}", err),
                            _ => (),
                        }
                    }

                    sleep(Duration::from_secs(std::cmp::min(
                        (next_tick - now).num_seconds() as u64,
                        60,
                    )));
                }
            });

            Ok(())
        })
        .plugin(tauri_plugin_context_menu::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
