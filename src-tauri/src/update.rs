use tauri_plugin_updater::UpdaterExt;

use crate::error::LsarResult;

pub async fn update(app: tauri::AppHandle) -> LsarResult<()> {
    debug!(message = "检测更新");

    if let Some(update) = app
        .updater()
        .map_err(|e| {
            error!(message = "获取更新器失败", error = ?e);
            e
        })?
        .check()
        .await
        .map_err(|e| {
            error!(message = "检查更新失败", error = ?e);
            e
        })?
    {
        let mut downloaded: usize = 0;

        update
            .download_and_install(
                |chunk_length, content_length| {
                    downloaded += chunk_length;
                    trace!("downloaded {downloaded} from {content_length:?}");
                },
                || {
                    debug!("download finished");
                },
            )
            .await
            .map_err(|e| {
                error!(message = "下载更新失败", error = ?e);
                e
            })?;

        info!("更新已安装，即将重启程序");
        app.restart();
    }

    Ok(())
}
