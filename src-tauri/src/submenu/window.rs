use tauri::{Menu, Submenu};

pub fn create_window_submenu() -> Submenu {
    Submenu::new("Window", Menu::new())
}
