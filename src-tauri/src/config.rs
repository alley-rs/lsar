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

#[tauri::command]
pub async fn read_config_file() -> LsarResult<Config> {
    // 防止用户在启动程序后删除配置文件引发异常
    if !CONFIG_FILE_PATH.exists() {
        let default_config = Config::default();
        let config = toml::to_string(&default_config).map_err(|e| {
            error!(message = "序列化配置失败", error = ?e);
            e
        })?;
        fs::write(&*CONFIG_FILE_PATH, config).await.map_err(|e| {
            error!(message = "写入配置文件失败", error = ?e);
            e
        })?;

        return Ok(default_config);
    }

    let data = fs::read_to_string(&*CONFIG_FILE_PATH).await.map_err(|e| {
        error!(message = "读取配置文件失败", error = ?e);
        e
    })?;
    let config: Config = toml::from_str(&data).map_err(|e| {
        error!(message = "反序列化配置文件失败", error = ?e);
        e
    })?;

    Ok(config)
}

#[tauri::command]
pub async fn write_config_file(config: Config) -> LsarResult<()> {
    debug!(message = "写入新配置", config = ?config);

    let data = toml::to_string(&config).map_err(|e| {
        error!(message = "序列化配置失败", error = ?e);
        e
    })?;
    fs::write(&*CONFIG_FILE_PATH, data).await.map_err(|e| {
        error!(message = "写入配置文件失败", error = ?e);
        e
    })?;

    info!(message = "已写入新配置");

    Ok(())
}
