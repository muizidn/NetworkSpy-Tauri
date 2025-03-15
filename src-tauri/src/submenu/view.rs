use tauri::{Menu, Submenu};

pub fn create_view_submenu() -> Submenu {
    Submenu::new("View", Menu::new())
}
