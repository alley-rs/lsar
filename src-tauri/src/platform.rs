use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub(crate) enum Platform {
    Douyu = 0,
    Huya,
    Douyin,
    Bilibili,
}

impl Platform {
    pub(crate) fn as_i64(&self) -> i64 {
        match self {
            Platform::Douyu => 0,
            Platform::Huya => 1,
            Platform::Douyin => 2,
            Platform::Bilibili => 3,
        }
    }
}

impl From<i8> for Platform {
    fn from(value: i8) -> Self {
        match value {
            0 => Platform::Douyu,
            1 => Platform::Huya,
            2 => Platform::Douyin,
            3 => Platform::Bilibili,
            _ => unreachable!(),
        }
    }
}

impl Into<&'static str> for Platform {
    fn into(self) -> &'static str {
        match self {
            Platform::Douyu => "douyu",
            Platform::Huya => "huya",
            Platform::Douyin => "douyin",
            Platform::Bilibili => "bilibili",
        }
    }
}
