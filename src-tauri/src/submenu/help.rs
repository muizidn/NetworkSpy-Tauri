use tauri::{Menu, Submenu};

pub fn create_help_submenu() -> Submenu {
    Submenu::new("Help", Menu::new())
}
