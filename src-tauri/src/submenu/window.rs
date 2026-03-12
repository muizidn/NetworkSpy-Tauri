use tauri::{CustomMenuItem, Menu, Submenu, WindowMenuEvent, AppHandle};

// Function to create the Window submenu
pub fn create_window_submenu() -> Submenu {
    let stay_on_top = CustomMenuItem::new("stay_on_top".to_string(), "Stay on Top");
    let minimize = CustomMenuItem::new("minimize".to_string(), "Minimize");
    let zoom = CustomMenuItem::new("zoom".to_string(), "Zoom");
    let tile_window_left = CustomMenuItem::new("tile_window_left".to_string(), "Tile Window Left");
    let tile_window_right = CustomMenuItem::new("tile_window_right".to_string(), "Tile Window Right");

    let window_menu = Menu::new()
        .add_item(stay_on_top)
        .add_item(minimize)
        .add_item(zoom)
        .add_item(tile_window_left)
        .add_item(tile_window_right);

    Submenu::new("Window", window_menu)
}

// Function to handle events from the Window submenu
pub fn handle_window_menu_event(
    event_id: &str,
    event: &WindowMenuEvent,
    _app_handle: &AppHandle,
) {
    let window = event.window();
    match event_id {
        "stay_on_top" => {
            // Toggle the window's "always on top" state
            // let is_on_top = window.is_always_on_top().unwrap_or(false);
            // window.set_always_on_top(!is_on_top).unwrap();
        }
        "minimize" => {
            // Minimize the window
            window.minimize().unwrap();
        }
        "zoom" => {
            // Toggle between maximized and original size
            let is_maximized = window.is_maximized().unwrap_or(false);
            if is_maximized {
                window.unmaximize().unwrap();
            } else {
                window.maximize().unwrap();
            }
        }
        "tile_window_left" => {
            // Logic to tile the window to the left half of the screen
            // This might require custom logic based on your window manager
            println!("Tile Window Left selected");
            // Implement custom logic here
        }
        "tile_window_right" => {
            // Logic to tile the window to the right half of the screen
            // This might require custom logic based on your window manager
            println!("Tile Window Right selected");
            // Implement custom logic here
        }
        _ => {}
    }
}
