use tauri::{Menu, Submenu};

pub fn create_flow_submenu() -> Submenu {
    Submenu::new("Flow", Menu::new())
}
