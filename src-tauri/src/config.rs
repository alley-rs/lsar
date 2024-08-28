use std::{path::PathBuf, process::Command, sync::LazyLock};

use serde::{Deserialize, Serialize};
use tokio::fs;

use crate::{error::LsarResult, global::APP_CONFIG_DIR};

#[derive(Serialize, Deserialize)]
struct Player {
    path: PathBuf,
    args: Vec<String>,
}

impl Default for Player {
    fn default() -> Self {
        Self {
            path: Default::default(),
            args: Default::default(),
        }
    }
}

#[derive(Serialize, Deserialize)]
struct Bilibili {
    cookie: String,
}

impl Default for Bilibili {
    fn default() -> Self {
        Self {
            cookie: Default::default(),
        }
    }
}

#[derive(Serialize, Deserialize)]
struct Platform {
    bilibili: Bilibili,
}

impl Default for Platform {
    fn default() -> Self {
        Self {
            bilibili: Default::default(),
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct Config {
    player: Player,
    platform: Platform,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            player: Default::default(),
            platform: Default::default(),
        }
    }
}

impl Config {
    pub fn play(&self, url: String) -> LsarResult<()> {
        Command::new(&self.player.path)
            .args(&self.player.args)
            .arg(url)
            .spawn()
            .map_err(|e| {
                error!(message = "创建播放器子进程失败", error = ?e);
                e
            })?;

        Ok(())
    }
}

static CONFIG_FILE_PATH: LazyLock<PathBuf> = LazyLock::new(|| APP_CONFIG_DIR.join("lsar.toml"));

pub async fn init_config_file() -> LsarResult<()> {
    if !CONFIG_FILE_PATH.exists() {
        let default_config = Config::default();
        let config = toml::to_string(&default_config)?;
        fs::write(&*CONFIG_FILE_PATH, config).await?;
    }

    Ok(())
}

#[tauri::command]
pub async fn read_config_file() -> LsarResult<Config> {
    let data = fs::read_to_string(&*CONFIG_FILE_PATH).await?;
    let config: Config = toml::from_str(&data)?;

    Ok(config)
}

#[tauri::command]
pub async fn write_config_file(config: Config) -> LsarResult<()> {
    if !CONFIG_FILE_PATH.exists() {
        let data = toml::to_string(&config)?;
        fs::write(&*CONFIG_FILE_PATH, data).await?;
    }

    Ok(())
}
