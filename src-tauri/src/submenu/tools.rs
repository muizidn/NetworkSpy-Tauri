use tauri::{AppHandle, CustomMenuItem, Menu, Submenu, WindowMenuEvent};

use super::create_window::create_window;

pub fn create_tools_submenu() -> Submenu {
    let tag = CustomMenuItem::new("tag".to_string(), "Tag");
    let map_local = CustomMenuItem::new("map_local".to_string(), "Map Local");
    let map_remote = CustomMenuItem::new("map_remote".to_string(), "Map Remote");
    let breakpoint = CustomMenuItem::new("breakpoint".to_string(), "Breakpoint");
    let block_list = CustomMenuItem::new("block_list".to_string(), "Block List");
    let proxy_intercept_list = CustomMenuItem::new("proxy_intercept_list".to_string(), "Allow List");

    let tools_menu = Menu::new()
        .add_item(tag)
        .add_item(map_local)
        .add_item(map_remote)
        .add_item(breakpoint)
        .add_item(block_list)
        .add_item(proxy_intercept_list);

    Submenu::new("Tools", tools_menu)
}

pub fn handle_tools_menu_event(
    event_id: &str,
    event: &WindowMenuEvent,
    _app_handle: &AppHandle,
) {
    let window = event.window().clone();
    match event_id {
        "tag" => {
            create_window(
                window.clone(),
                "tag",
                "Tag",
                "/tag",
            );
        }
        "map_local" => {
            create_window(
                window.clone(),
                "map_local_window",
                "Map Local",
                "/map-local",
            );
        }
        "map_remote" => {
            create_window(
                window.clone(),
                "map_remote_window",
                "Map Remote",
                "/map-remote",
            );
        }
        "breakpoint" => {
            create_window(
                window.clone(),
                "breakpoint_window",
                "Breakpoint",
                "/breakpoint",
            );
        }
        "block_list" => {
            create_window(
                window.clone(),
                "block_list_window",
                "Block List",
                "/block-list",
            );
        }
        "proxy_intercept_list" => {
            create_window(
                window.clone(),
                "proxy_intercept_list_window",
                "Allow List",
                "/allow-list",
            );
        }
        _ => {}
    }
}
