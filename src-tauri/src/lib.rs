mod config;
mod db;
mod error;
mod global;
mod history;
mod http;
mod log;
mod platform;
#[cfg(desktop)]
mod update;
mod utils;

#[macro_use]
extern crate tracing;

use error::LsarResult;
use tauri::Manager;
use time::macros::{format_description, offset};
use tracing::Level;
use tracing_subscriber::fmt::time::OffsetTime;

use crate::config::{read_config_file, write_config_file};
use crate::db::{delete_a_history_by_id, get_all_history, insert_a_history};
#[cfg(all(desktop, not(debug_assertions)))]
use crate::global::APP_CONFIG_DIR;
use crate::http::{get, post};
use crate::log::{debug, error, info, trace, warn};
#[cfg(desktop)]
use crate::update::update;
use crate::utils::md5;

#[tauri::command]
async fn play(url: String) -> LsarResult<()> {
    read_config_file().await?.play(url)
}

#[tauri::command]
async fn open(url: String) -> LsarResult<()> {
    open::that(url).map_err(Into::into)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let fmt = if cfg!(debug_assertions) {
        format_description!("[hour]:[minute]:[second].[subsecond digits:3]")
    } else {
        format_description!("[year]-[month]-[day] [hour]:[minute]:[second].[subsecond digits:3]")
    };

    let timer = OffsetTime::new(offset!(+8), fmt);

    #[cfg(all(desktop, not(debug_assertions)))]
    // NOTE: _guard must be a top-level variable
    let (writer, _guard) = {
        let file_appender = tracing_appender::rolling::never(&*APP_CONFIG_DIR, "lsar.log");
        tracing_appender::non_blocking(file_appender)
    };

    #[cfg(any(debug_assertions, mobile))]
    let writer = std::io::stderr;

    let builder = tracing_subscriber::fmt()
        .with_max_level(Level::TRACE)
        .with_file(true)
        .with_line_number(true)
        .with_env_filter("lsar_lib")
        .with_target(false)
        .with_timer(timer)
        .with_writer(writer);

    if cfg!(debug_assertions) {
        builder.init();
    } else {
        builder.json().init();
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(w) = app.get_webview_window("main") {
                info!(message = "本程序已有窗口运行，自动聚焦到此窗口");
                w.set_focus().unwrap();
            }
        }))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(setup)
        .invoke_handler(tauri::generate_handler![
            get_all_history,
            insert_a_history,
            delete_a_history_by_id,
            md5,
            trace,
            debug,
            info,
            warn,
            error,
            get,
            post,
            play,
            open,
            read_config_file,
            write_config_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(desktop)]
    app.handle()
        .plugin(tauri_plugin_updater::Builder::new().build())?;

    #[cfg(any(target_os = "macos", target_os = "windows"))]
    {
        let window = app.get_webview_window("main").unwrap();

        #[cfg(target_os = "macos")]
        {
            use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
            apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
                .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");
        }

        #[cfg(target_os = "windows")]
        {
            use window_vibrancy::apply_acrylic;
            apply_acrylic(&window, Some((18, 18, 18, 125)))
                .expect("Unsupported platform! 'apply_blur' is only supported on Windows");
        }
    }

    #[cfg(desktop)]
    {
        let handle = app.handle().clone();
        tauri::async_runtime::spawn(async move {
            if let Err(e) = update(handle).await {
                error!("Failed to check for updates: {:?}", e);
            }
        });
    }

    Ok(())
}
