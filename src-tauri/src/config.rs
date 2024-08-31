use std::{path::PathBuf, process::Command, sync::LazyLock};

use serde::{Deserialize, Serialize};
use tokio::fs;

use crate::{error::LsarResult, global::APP_CONFIG_DIR};

#[derive(Debug, Serialize, Deserialize, Default)]
struct Player {
    path: PathBuf,
    args: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
struct Bilibili {
    cookie: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
struct Platform {
    bilibili: Bilibili,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Config {
    player: Player,
    platform: Platform,
}

impl Config {
    pub fn play(&self, url: String) -> LsarResult<()> {
        debug!("Attempting to play URL: {}", url);
        let result = Command::new(&self.player.path)
            .args(&self.player.args)
            .arg(&url)
            .spawn();

        match result {
            Ok(child) => {
                info!(
                    "Successfully spawned player process with PID: {}",
                    child.id()
                );
                Ok(())
            }
            Err(e) => {
                error!("Failed to create player subprocess: {:?}", e);
                Err(e.into())
            }
        }
    }
}

static CONFIG_FILE_PATH: LazyLock<PathBuf> = LazyLock::new(|| APP_CONFIG_DIR.join("lsar.toml"));

#[tauri::command]
pub async fn read_config_file() -> LsarResult<Config> {
    // 防止用户在启动程序后删除配置文件引发异常
    if !CONFIG_FILE_PATH.exists() {
        debug!("Config file not found, creating default config");
        let default_config = Config::default();
        let config = toml::to_string(&default_config).map_err(|e| {
            error!("Failed to serialize default config: {:?}", e);
            e
        })?;
        fs::write(&*CONFIG_FILE_PATH, config).await.map_err(|e| {
            error!("Failed to write default config file: {:?}", e);
            e
        })?;
        info!("Created and wrote default config file");
        return Ok(default_config);
    }

    debug!("Reading config file from: {:?}", *CONFIG_FILE_PATH);
    let data = fs::read_to_string(&*CONFIG_FILE_PATH).await.map_err(|e| {
        error!("Failed to read config file: {:?}", e);
        e
    })?;

    let config: Config = toml::from_str(&data).map_err(|e| {
        error!("Failed to deserialize config file: {:?}", e);
        e
    })?;

    info!("Successfully read and parsed config file");

    Ok(config)
}

#[tauri::command]
pub async fn write_config_file(config: Config) -> LsarResult<()> {
    debug!("Writing new config: {:?}", config);
    let data = toml::to_string(&config).map_err(|e| {
        error!("Failed to serialize config: {:?}", e);
        e
    })?;

    fs::write(&*CONFIG_FILE_PATH, data).await.map_err(|e| {
        error!("Failed to write config file: {:?}", e);
        e
    })?;

    info!("Successfully wrote new config to file");

    Ok(())
}
