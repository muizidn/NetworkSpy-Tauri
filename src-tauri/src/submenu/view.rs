use tauri::{AppHandle, CustomMenuItem, Menu, Submenu, WindowMenuEvent};

use super::create_window::create_window;

pub fn create_view_submenu() -> Submenu {
    let log = CustomMenuItem::new("log".to_string(), "Log");
    let resource_bar = CustomMenuItem::new("resource_bar".to_string(), "Resource Bar");

    let view_menu = Menu::new()
        .add_item(log)
        .add_item(resource_bar);

    Submenu::new("View", view_menu)
}

pub fn handle_view_menu_event(
    event_id: &str,
    event: &WindowMenuEvent,
    app_handle: &AppHandle,
) {
    let window = event.window().clone();
    match event_id {
        "log" => {
            create_window(
                window.clone(),
                "log",
                "Log",
                "/log",
            );
        }
        "resource_bar" => {
            create_window(
                window.clone(),
                "resource_bar",
                "Resource Bar",
                "/edit-log",
            )
        }
        _ => {}
    }
}
