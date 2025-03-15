use tauri::{Menu, Submenu, MenuItem};

pub fn create_edit_submenu() -> Submenu {
    Submenu::new("Edit", Menu::new().add_native_item(MenuItem::Copy))
}
