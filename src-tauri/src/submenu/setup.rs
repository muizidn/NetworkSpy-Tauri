use tauri::{AppHandle, CustomMenuItem, Menu, Submenu, WindowMenuEvent};

use super::create_window::create_window;

pub fn create_setup_submenu() -> Submenu {
    let automatic = CustomMenuItem::new("automatic".to_string(), "Automatic...");
    let manual = CustomMenuItem::new("manual".to_string(), "Manual...");

    let setup_menu = Menu::new().add_item(automatic).add_item(manual);

    Submenu::new("Setup", setup_menu)
}

pub fn handle_setup_menu_event(event_id: &str, event: &WindowMenuEvent, app_handle: &AppHandle) {
    let window = event.window().clone();
    match event_id {
        "automatic" => {
            create_window(window.clone(), "automatic_window", "Automatic...", "/automatic");
        }
        "manual" => {
            create_window(
                window.clone(),
                "map_local_window",
                "Manual...",
                "/map-local",
            );
        }
        _ => {}
    }
}
