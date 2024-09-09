use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct RoomInfo {
    pub error: Option<i32>,
    pub msg: String,
    pub data: RoomData,
}

#[derive(Debug, Deserialize)]
pub struct RoomData {
    pub rtmp_url: String,
    pub rtmp_live: Option<String>,
}
