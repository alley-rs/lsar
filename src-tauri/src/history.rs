use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

use crate::platform::Platform;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct HistoryItem {
    id: i64,
    platform: Platform,
    room_id: i64,
    anchor: String,
    category: String,
    last_title: String,
    #[serde(with = "time::serde::rfc3339")]
    last_play_time: OffsetDateTime,
}

impl HistoryItem {
    pub fn new(
        id: i64,
        platform: Platform,
        room_id: i64,
        anchor: String,
        category: String,
        last_title: String,
        last_play_time: OffsetDateTime,
    ) -> Self {
        Self {
            id,
            platform,
            room_id,
            anchor,
            category,
            last_title,
            last_play_time,
        }
    }

    // pub fn id(&self) -> i64 {
    //     self.id
    // }

    pub fn platform(&self) -> &Platform {
        &self.platform
    }

    pub fn room_id(&self) -> i64 {
        self.room_id
    }

    pub fn anchor(&self) -> &str {
        &self.anchor
    }

    pub fn category(&self) -> &str {
        &self.category
    }

    pub fn last_title(&self) -> &str {
        &self.last_title
    }

    pub fn last_play_time(&self) -> OffsetDateTime {
        self.last_play_time
    }
}

impl TryFrom<(i64, i64, i64, String, String, String, OffsetDateTime)> for HistoryItem {
    type Error = &'static str;

    fn try_from(
        (id, platform, room_id, anchor, category, last_title, last_play_time): (
            i64,
            i64,
            i64,
            String,
            String,
            String,
            OffsetDateTime,
        ),
    ) -> Result<HistoryItem, Self::Error> {
        Ok(Self::new(
            id,
            platform.try_into()?,
            room_id,
            anchor,
            category,
            last_title,
            last_play_time,
        ))
    }
}
