use serde::{Deserialize, Serialize};

use crate::platform::Platform;

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct HistoryItem {
    id: i64,
    platform: Platform,
    room_id: i64,
    anchor: String,
    category: String,
    last_title: String,
    #[serde(with = "time::serde::rfc3339")]
    last_play_time: time::OffsetDateTime,
}

impl HistoryItem {
    pub(crate) fn platform(&self) -> &Platform {
        &self.platform
    }

    pub(crate) fn room_id(&self) -> i64 {
        self.room_id
    }

    pub(crate) fn anchor(&self) -> &str {
        &self.anchor
    }

    pub(crate) fn category(&self) -> &str {
        &self.category
    }

    pub(crate) fn last_title(&self) -> &str {
        &self.last_title
    }

    pub(crate) fn last_play_time(&self) -> time::OffsetDateTime {
        self.last_play_time
    }
}

impl From<(i64, i8, i64, String, String, String, time::OffsetDateTime)> for HistoryItem {
    fn from(value: (i64, i8, i64, String, String, String, time::OffsetDateTime)) -> Self {
        Self {
            id: value.0,
            platform: value.1.into(),
            room_id: value.2,
            anchor: value.3,
            category: value.4,
            last_title: value.5,
            last_play_time: value.6,
        }
    }
}
