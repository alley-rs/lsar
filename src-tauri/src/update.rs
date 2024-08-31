use tauri_plugin_updater::UpdaterExt;

use crate::error::LsarResult;

pub async fn update(app: tauri::AppHandle) -> LsarResult<()> {
    debug!("Checking for updates");

    let updater = app.updater().map_err(|e| {
        error!("Failed to get updater: {:?}", e);
        e
    })?;

    match updater.check().await {
        Ok(Some(update)) => {
            info!(
                "Update available: current {}, latest {}",
                update.current_version, update.version
            );

            let mut downloaded: usize = 0;

            update
                .download_and_install(
                    move |chunk_length, content_length| {
                        downloaded += chunk_length;
                        trace!("downloaded {downloaded} from {content_length:?}");
                    },
                    || {
                        info!("Download finished, preparing to install");
                    },
                )
                .await
                .map_err(|e| {
                    error!("Failed to download and install update: {:?}", e);
                    e
                })?;

            info!("Update installed successfully, restarting application");
            app.restart();
        }
        Ok(None) => {
            info!("Application is up to date");
        }
        Err(e) => {
            error!("Failed to check for updates: {:?}", e);
            return Err(e.into());
        }
    }

    Ok(())
}
