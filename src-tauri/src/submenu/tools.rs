use tauri::{AppHandle, CustomMenuItem, Menu, Submenu};
use tauri::Manager;

pub fn create_tools_submenu() -> Submenu {
    let tools_item = CustomMenuItem::new("tools_item".to_string(), "Tools Item");
    Submenu::new("Tools", Menu::new().add_item(tools_item))
}

pub fn handle_tools_menu_event(event_id: &str, event: &tauri::WindowMenuEvent, app_handle: &AppHandle) {
    match event_id {
        "tools_item" => {
            // Handle tools item action here
            println!("Tools item selected!");
        },
        _ => {}
    }
}
