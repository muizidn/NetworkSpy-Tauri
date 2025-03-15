use tauri::{Menu, CustomMenuItem, Submenu};

pub fn create_scripting_submenu() -> Submenu {
    let script_list = CustomMenuItem::new("script_list".to_string(), "Script List ...");
    Submenu::new("Scripting", Menu::new().add_item(script_list))
}
