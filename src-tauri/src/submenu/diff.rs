use tauri::{Menu, MenuItem, Submenu};

pub fn create_diff_submenu() -> Submenu {
    Submenu::new("Diff", Menu::new().add_native_item(MenuItem::Copy))
}
