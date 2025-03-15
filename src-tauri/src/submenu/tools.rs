use tauri::{Menu, CustomMenuItem, Submenu};

pub fn create_tools_submenu() -> Submenu {
    let tools_item = CustomMenuItem::new("tools_item".to_string(), "Tools Item");
    Submenu::new("Tools", Menu::new().add_item(tools_item))
}
