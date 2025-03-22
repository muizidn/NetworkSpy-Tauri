use tauri::{AppHandle, CustomMenuItem, Menu, Submenu};

use super::create_window::create_window;

pub fn create_scripting_submenu() -> Submenu {
    let script_list = CustomMenuItem::new("script_list".to_string(), "Script List ...");
    Submenu::new("Scripting", Menu::new().add_item(script_list))
}

pub fn handle_scripting_menu_event(event_id: &str, event: &tauri::WindowMenuEvent, app_handle: &AppHandle) {
    match event_id {
        "script_list" => {
            let window = event.window().clone();
            // Create new window when script_list is selected
            create_window(window, "script_list_window", "Script List", "/script-list");
        },
        _ => {}
    }
}