use std::{fmt, sync::Arc};

use serde::Serialize;
use tokio::sync::{oneshot, Mutex};

use crate::error::LsarResult;

#[derive(Debug, Serialize, thiserror::Error)]
pub enum EvalError {
    ChannelReceiveError,
    ChannelSendError(String),
}

impl fmt::Display for EvalError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

pub const EVAL_EVENT: &str = "JS-EVAL";

pub type EvalSender = Arc<Mutex<Option<oneshot::Sender<String>>>>;

#[derive(Clone)]
pub struct EvalChannel {
    pub sender: EvalSender,
}

#[tauri::command]
pub async fn eval_result(
    result: String,
    eval_channel: tauri::State<'_, EvalChannel>,
) -> LsarResult<()> {
    if let Some(sender) = eval_channel.sender.lock().await.take() {
        sender.send(result).map_err(EvalError::ChannelSendError)?;
        info!("已发送 eval 结果");
    }
    Ok(())
}
