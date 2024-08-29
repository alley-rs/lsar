use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
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

    pub(crate) fn to_str(&self) -> &str {
        self.into()
    }
}

impl TryFrom<i64> for Platform {
    type Error = &'static str;

    fn try_from(value: i64) -> Result<Self, Self::Error> {
        match value {
            0 => Ok(Platform::Douyu),
            1 => Ok(Platform::Huya),
            2 => Ok(Platform::Douyin),
            3 => Ok(Platform::Bilibili),
            _ => Err("Invalid platform value"),
        }
    }
}

impl From<Platform> for &'static str {
    fn from(platform: Platform) -> Self {
        match platform {
            Platform::Douyu => "douyu",
            Platform::Huya => "huya",
            Platform::Douyin => "douyin",
            Platform::Bilibili => "bilibili",
        }
    }
}

impl From<&Platform> for &'static str {
    fn from(platform: &Platform) -> Self {
        match platform {
            Platform::Douyu => "douyu",
            Platform::Huya => "huya",
            Platform::Douyin => "douyin",
            Platform::Bilibili => "bilibili",
        }
    }
}
