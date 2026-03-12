use tauri::{AppHandle, CustomMenuItem, Menu, Submenu, WindowMenuEvent, Manager};

pub fn create_view_submenu() -> Submenu {
    let toggle_sidebar_left = CustomMenuItem::new("toggle_sidebar_left".to_string(), "Show Sidebar Left");
    let toggle_sidebar_right = CustomMenuItem::new("toggle_sidebar_right".to_string(), "Show Sidebar Right");
    let toggle_bottom_pane = CustomMenuItem::new("toggle_bottom_pane".to_string(), "Show Bottom Pane");
    let toggle_resource_bar = CustomMenuItem::new("toggle_resource_bar".to_string(), "Show Resource Bar");

    let view_menu = Menu::new()
        .add_item(toggle_sidebar_left)
        .add_item(toggle_sidebar_right)
        .add_item(toggle_bottom_pane)
        .add_item(toggle_resource_bar);

    Submenu::new("View", view_menu)
}

pub fn handle_view_menu_event(
    event_id: &str,
    event: &WindowMenuEvent,
    app_handle: &AppHandle,
) {
    let window = event.window().clone();
    let _menu_item = app_handle.get_window(window.label()).unwrap().menu_handle().get_item(event_id);

    // if let Ok(current_title) = menu_item.title() {
    //     let (new_title, action, new_selected) = if current_title.starts_with("Show") {
    //         (
    //             current_title.replacen("Show", "Hide", 1),
    //             "Showing",
    //             true,
    //         )
    //     } else {
    //         (
    //             current_title.replacen("Hide", "Show", 1),
    //             "Hiding",
    //             false,
    //         )
    //     };

    //     menu_item.set_title(new_title).unwrap();
    //     menu_item.set_selected(new_selected).unwrap(); // Set the checkbox state
    //     println!("{} {}", action, current_title.trim_start_matches("Show ").trim_start_matches("Hide "));
    //     // Implement the actual logic to toggle the component here based on the action
    // }
}
