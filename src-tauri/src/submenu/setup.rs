use tauri::{Menu, Submenu};

pub fn create_setup_submenu() -> Submenu {
    Submenu::new("Setup", Menu::new())
}
