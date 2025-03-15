use tauri::{AppHandle, CustomMenuItem, Menu, Submenu};

pub fn create_file_submenu() -> Submenu {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let close = CustomMenuItem::new("close".to_string(), "Close");
    Submenu::new("File", Menu::new().add_item(quit).add_item(close))
}

pub fn handle_file_menu_event(event_id: &str, event: &tauri::WindowMenuEvent, app_handle: &AppHandle) {
    match event_id {
        "quit" => {
            // Handle quit
            app_handle.exit(0);
        }
        "close" => {
            // Handle close action
            event.window().close().unwrap();
        }
        _ => {}
    }
}
