use std::{env, path::PathBuf};

use crate::error::LsarResult;

#[tauri::command]
pub fn get_player_paths() -> LsarResult<Vec<PathBuf>> {
    let commands = ["mpv"];
    debug!("Searching for player commands: {:?}", commands);

    let mut player_paths = Vec::new();

    let paths = env::var("PATH").map_err(|e| {
        error!("Failed to get PATH environment variable: {}", e);
        e
    })?;

    debug!("PATH environment variable found");

    for path_entry in paths.split(':') {
        debug!("Searching in PATH entry: {}", path_entry);
        for cmd in &commands {
            let path = PathBuf::from(path_entry).join(cmd);
            if path.exists() && path.is_file() {
                info!("Found player: {}", path.display());
                player_paths.push(path);
            }
        }
    }

    if player_paths.is_empty() {
        warn!("No player paths found");
    } else {
        info!("Found {} player paths", player_paths.len());
    }

    Ok(player_paths)
}
