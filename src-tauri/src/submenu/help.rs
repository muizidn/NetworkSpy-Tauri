use tauri::{AppHandle, CustomMenuItem, Menu, Submenu, WindowMenuEvent};

use super::create_window::create_window;

pub fn create_help_submenu() -> Submenu {
    let ask_developer = CustomMenuItem::new("ask_developer".to_string(), "Ask Developer");

    let help_menu = Menu::new()
        .add_item(ask_developer);

    Submenu::new("Help", help_menu)
}

pub fn handle_help_menu_event(
    event_id: &str,
    event: &WindowMenuEvent,
    app_handle: &AppHandle,
) {
    let window = event.window().clone();
    
    match event_id {
        "ask_developer" => {
            // create_window(
            //     window.clone(),
            //     "tag_window",
            //     "Copy as cURL",
            //     "/ask_developer",
            // );
        }
        _ => {}
    }
}
