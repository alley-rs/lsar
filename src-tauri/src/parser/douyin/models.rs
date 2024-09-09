use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct RoomInfo {
    pub data: RoomData,
}

#[derive(Debug, Deserialize)]
pub struct RoomData {
    pub data: Vec<StreamData>,
    pub user: UserInfo,
    pub partition_road_map: PartitionRoadMap,
}

#[derive(Debug, Deserialize)]
pub struct StreamData {
    pub status: u8,
    pub title: String,
    pub stream_url: Option<StreamUrl>,
}

#[derive(Debug, Deserialize)]
pub struct StreamUrl {
    pub flv_pull_url: HashMap<Resolution, String>,
    pub hls_pull_url_map: HashMap<Resolution, String>,
}

#[derive(Debug, Deserialize)]
pub struct UserInfo {
    pub nickname: String,
}

#[derive(Debug, Deserialize)]
pub struct PartitionRoadMap {
    pub partition: Option<Partition>,
    pub sub_partition: Option<SubPartition>,
}

#[derive(Debug, Deserialize)]
pub struct Partition {
    pub title: String,
}

#[derive(Debug, Deserialize)]
pub struct SubPartition {
    pub partition: Partition,
}

#[derive(Debug, Deserialize, Serialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Resolution {
    FullHd1,
    Hd1,
    Sd1,
    Sd2,
}
