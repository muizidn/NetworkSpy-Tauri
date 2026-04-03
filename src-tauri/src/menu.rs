use tauri::menu::{MenuItemBuilder, Submenu, SubmenuBuilder};
use tauri::Manager;

pub fn create_tools_submenu<R: tauri::Runtime>(manager: &impl Manager<R>) -> tauri::Result<Submenu<R>> {
    SubmenuBuilder::new(manager, "Tools")
        .item(&MenuItemBuilder::with_id("install_cert", "Install Root Certificate").build(manager)?)
        .separator()
        .item(&MenuItemBuilder::with_id("tools_tag", "Tagging Rules").build(manager)?)
        .separator()
        .item(&MenuItemBuilder::with_id("saved_sessions", "Saved Sessions").build(manager)?)
        .item(&MenuItemBuilder::with_id("traffic_filters", "Traffic Filters").build(manager)?)
        .separator()
        .item(&MenuItemBuilder::with_id("breakpoints", "Traffic Breakpoints").build(manager)?)
        .item(&MenuItemBuilder::with_id("scripting", "Custom Scripting").build(manager)?)
        .build()
}
