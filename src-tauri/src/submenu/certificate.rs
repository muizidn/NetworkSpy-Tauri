use tauri::{AppHandle, CustomMenuItem, Menu, Submenu};

use super::create_window::create_window;

pub fn create_certificate_submenu() -> Submenu {
    let install_cert_computer = CustomMenuItem::new(
        "install_cert_computer".to_string(),
        "Install Certificate on This Computer...",
    );
    let install_cert_mobile = CustomMenuItem::new(
        "install_cert_mobile".to_string(),
        "Install Certificate on Mobile...",
    );
    let install_cert_vm = CustomMenuItem::new(
        "install_cert_vm".to_string(),
        "Install Certificate on VM...",
    );
    let install_cert_dev = CustomMenuItem::new(
        "install_cert_dev".to_string(),
        "Install Certificate on Development...",
    );

    Submenu::new(
        "Certificate",
        Menu::new()
            .add_item(install_cert_computer)
            .add_item(install_cert_mobile)
            .add_item(install_cert_vm)
            .add_item(install_cert_dev),
    )
}

pub fn handle_certificate_menu_event(
    event_id: &str,
    event: &tauri::WindowMenuEvent,
    _app_handle: &AppHandle,
) {
    match event_id {
        "install_cert_computer" => {
            let window = event.window().clone();
            create_window(
                window,
                "install_cert_computer",
                "Install Certificate on This Computer",
                "/computer-certificate-installer",
            );
        }
        "install_cert_mobile" => {
            let window = event.window().clone();
            create_window(
                window,
                "install_cert_mobile",
                "Install Certificate on Mobile",
                "/mobile-certificate-installer",
            );
        }
        _ => {}
    }
}
