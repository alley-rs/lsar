use serde::{Serialize, Serializer};

pub(super) type LsarResult<T> = std::result::Result<T, LsarError>;

#[derive(Debug, thiserror::Error)]
pub(super) enum LsarError {
    #[error(transparent)]
    Sqlite(#[from] sqlx::Error),
    #[error(transparent)]
    Http(#[from] reqwest::Error),
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
