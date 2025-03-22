use tauri::{AppHandle, CustomMenuItem, Menu, Submenu, WindowMenuEvent};

use super::create_window::create_window;

pub fn create_flow_submenu() -> Submenu {
    let repeat = CustomMenuItem::new("repeat".to_string(), "Repeat");
    let edit_and_repeat = CustomMenuItem::new("edit_repeat".to_string(), "Edit Repeat");

    let flow_menu = Menu::new()
        .add_item(repeat)
        .add_item(edit_and_repeat);

    Submenu::new("Flow", flow_menu)
}

pub fn handle_flow_menu_event(
    event_id: &str,
    event: &WindowMenuEvent,
    app_handle: &AppHandle,
) {
    let window = event.window().clone();
    match event_id {
        "repeat" => {
            create_window(
                window.clone(),
                "repeat",
                "Repeat",
                "/repeat",
            );
        }
        "edit_and_repeat" => {
            create_window(
                window.clone(),
                "edit_repeat",
                "Edit Repeat",
                "/edit-repeat",
            )
        }
        _ => {}
    }
}
