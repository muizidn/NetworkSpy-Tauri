use tauri::{Menu, CustomMenuItem, Submenu};

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
