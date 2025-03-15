use tauri::{Menu, CustomMenuItem, Submenu};

pub fn create_file_submenu() -> Submenu {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let close = CustomMenuItem::new("close".to_string(), "Close");
    Submenu::new("File", Menu::new().add_item(quit).add_item(close))
}
