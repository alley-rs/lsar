use std::fmt;

use serde::{Serialize, Serializer};

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
            return Self {
                kind: HTTPErrorKind::Connect,
            };
        } else if value.is_timeout() {
            return Self {
                kind: HTTPErrorKind::Timeout,
            };
        } else if value.is_decode() {
            return Self {
                kind: HTTPErrorKind::Decode,
            };
        } else {
            return Self {
                kind: HTTPErrorKind::Other,
            };
        }
    }
}
