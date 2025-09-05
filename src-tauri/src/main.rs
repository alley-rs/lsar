// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod config;
mod data;
mod error;
mod eval;
mod global;
mod http;
mod log;
mod network;
mod parsers;
mod path;
mod platform;
mod setup;
#[cfg(all(desktop, not(debug_assertions)))]
mod update;
mod utils;
#[cfg(windows)]
mod windows;

#[macro_use]
extern crate tracing;

use std::env;

use tauri::{AppHandle, Manager};

use crate::config::{read_config_file, write_config_file};
use crate::data::db::{delete_a_history_by_id, get_all_history, insert_a_history};
use crate::error::LsarResult;
use crate::eval::eval_result;
use crate::http::{get, post};
use crate::log::{debug, error, info, trace, warn};
use crate::parsers::{parse_bigo, parse_bilibili, parse_douyin, parse_douyu, parse_huya};
use crate::path::get_player_paths;
use crate::setup::{setup_app, setup_logging};
use crate::utils::md5;

#[tauri::command]
async fn play(url: String) -> LsarResult<()> {
    info!("Attempting to play URL: {}", url);
    read_config_file().await?.play(url)
}

#[tauri::command]
async fn open(url: String) -> LsarResult<()> {
    info!("Opening external URL: {}", url);
    open::that(url).map_err(Into::into)
}

/// 防止启动时闪白屏
#[tauri::command]
async fn show_main_window(app: AppHandle) {
    debug!("Showing main window");

    let main_window = app.get_webview_window("main").unwrap();

    main_window.show().unwrap();
    main_window.set_focus().unwrap();
}

#[cfg(windows)]
#[tauri::command]
async fn set_titlebar_color_mode(
    window: tauri::WebviewWindow,
    color_mode: crate::windows::ColorMode,
) -> LsarResult<()> {
    let hwnd = window.hwnd()?;

    crate::windows::set_window_color_mode(hwnd, color_mode)?;
    Ok(())
}

fn main() {
    setup_logging();

    info!("Operating System: {}", env::consts::OS);
    info!("OS Version: {}", os_info::get().version());
    info!("Architecture: {}", env::consts::ARCH);

    info!("Initializing application");

    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(w) = app.get_webview_window("main") {
                info!("Application instance already running, focusing existing window");
                w.set_focus().unwrap();
            }
        }))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(setup_app)
        .invoke_handler(tauri::generate_handler![
            show_main_window,
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
            write_config_file,
            eval_result,
            parse_bigo,
            parse_douyu,
            parse_huya,
            parse_douyin,
            parse_bilibili,
            get_player_paths,
            #[cfg(windows)]
            set_titlebar_color_mode
        ])
        .run(tauri::generate_context!())
        .expect("Error while running tauri application");
}
