// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use chrono::Utc;
use cron::Schedule;
use serde::Serialize;
use std::{env, str::FromStr, thread::sleep, time::Duration};
use tauri::{AppHandle, Invoke, Manager, Result, State};

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

fn main() {
    tauri::Builder::default()
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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
