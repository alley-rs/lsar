#[tauri::command]
pub async fn trace(prefix: String, msg: String) {
    trace!("{}: {}", prefix, msg);
}

#[tauri::command]
pub async fn debug(prefix: String, msg: String) {
    debug!("{}: {}", prefix, msg);
}

#[tauri::command]
pub async fn info(prefix: String, msg: String) {
    info!("{}: {}", prefix, msg);
}

#[tauri::command]
pub async fn warn(prefix: String, msg: String) {
    warn!("{}: {}", prefix, msg);
}

#[tauri::command]
pub async fn error(prefix: String, msg: String) {
    error!("{}: {}", prefix, msg);
}
