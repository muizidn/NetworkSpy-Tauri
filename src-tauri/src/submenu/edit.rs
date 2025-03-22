use tauri::{AppHandle, CustomMenuItem, Menu, Submenu, WindowMenuEvent};

use super::create_window::create_window;

pub fn create_edit_submenu() -> Submenu {
    let copy_as_curl = CustomMenuItem::new("copy_as_curl".to_string(), "Copy as cURL");

    let edit_menu = Menu::new()
        .add_item(copy_as_curl);

    Submenu::new("Edit", edit_menu)
}

pub fn handle_edit_menu_event(
    event_id: &str,
    event: &WindowMenuEvent,
    app_handle: &AppHandle,
) {
    let window = event.window().clone();
    match event_id {
        "copy_as_curl" => {
            // create_window(
            //     window.clone(),
            //     "tag_window",
            //     "Copy as cURL",
            //     "/copy_as_curl",
            // );
        }
        _ => {}
    }
}
