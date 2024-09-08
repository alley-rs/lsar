use std::fmt;

use serde::{Serialize, Serializer};

use crate::eval::EvalError;

pub(super) type LsarResult<T> = std::result::Result<T, LsarError>;

#[derive(Debug, thiserror::Error)]
pub(super) enum LsarError {
    #[error(transparent)]
    Sqlite(#[from] sqlx::Error),
    #[error("http error: {0}")]
    Http(#[from] HTTPError),
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    TomlSerialize(#[from] toml::ser::Error),
    #[error(transparent)]
    TomlDeserialize(#[from] toml::de::Error),
    #[error(transparent)]
    Update(#[from] tauri_plugin_updater::Error),
    #[error(transparent)]
    Regex(#[from] regex::Error),
    #[error(transparent)]
    SystemTime(#[from] std::time::SystemTimeError),
    #[error(transparent)]
    RoomState(#[from] RoomStateError),
    #[error(transparent)]
    Request(#[from] RequestError),
    #[error(transparent)]
    MissKeyField(#[from] MissKeyFieldError),
    #[error(transparent)]
    UrlParse(#[from] url::ParseError),
    #[error(transparent)]
    Eval(#[from] EvalError),
    #[error(transparent)]
    SerdeJSON(#[from] serde_json::Error),
    #[error("{0}")]
    Other(String),
}

impl Serialize for LsarError {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

#[derive(Debug, Serialize)]
enum HTTPErrorKind {
    Connect,
    Timeout,
    Decode,
    Other,
}

#[derive(Debug, thiserror::Error, Serialize)]
pub struct HTTPError {
    kind: HTTPErrorKind,
}

impl fmt::Display for HTTPError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self.kind)
    }
}

// { kind: Request, url: "https://www.douyu.com/100", source: hyper_util::client::legacy::Error(Connect, ConnectError("dns error", Os { code: 11001, kind: Uncategorized, message: "不知道这样的主机。" })) }
impl From<reqwest::Error> for HTTPError {
    fn from(value: reqwest::Error) -> Self {
        if value.is_connect() {
            Self {
                kind: HTTPErrorKind::Connect,
            }
        } else if value.is_timeout() {
            Self {
                kind: HTTPErrorKind::Timeout,
            }
        } else if value.is_decode() {
            Self {
                kind: HTTPErrorKind::Decode,
            }
        } else {
            Self {
                kind: HTTPErrorKind::Other,
            }
        }
    }
}

#[derive(Debug, Serialize, thiserror::Error)]
pub(super) enum RoomStateError {
    Offline,
    NotExists,
    IsClosed,
    IsReplay,
}

impl fmt::Display for RoomStateError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let string = match self {
            RoomStateError::Offline => "该房间未开播",
            RoomStateError::NotExists => "房间号不存在",
            RoomStateError::IsClosed => "该房间已被关闭",
            RoomStateError::IsReplay => "该房间正在重播",
        };
        write!(f, "{}", string)
    }
}

#[derive(Debug, Serialize, thiserror::Error)]
pub(super) enum RequestError {
    BadRequest,
}

impl fmt::Display for RequestError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

#[derive(Debug, Serialize, thiserror::Error)]
pub(super) enum MissKeyFieldError {
    Title,
    AnchorName,
    SignatureFunction,
    RandomNumber,
    RoomId,
}

impl fmt::Display for MissKeyFieldError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl From<&str> for LsarError {
    fn from(value: &str) -> Self {
        LsarError::Other(value.to_owned())
    }
}

impl From<String> for LsarError {
    fn from(value: String) -> Self {
        LsarError::Other(value)
    }
}
