use reqwest::Client;
use serde::Deserialize;
use serde_json::Value;

use crate::error::{LsarResult, RoomStateError};

const BASE_URL: &str = "https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo?protocol=0,1&format=0,1,2&codec=0,1&qn=10000&platform=web&ptype=8&dolby=5&panorama=1&room_id=";

#[derive(Debug, Deserialize)]
pub struct CDNItem {
    pub host: String,
    pub extra: String,
}

#[derive(Debug, Deserialize)]
pub struct CodecItem {
    pub base_url: String,
    pub url_info: Vec<CDNItem>,
}

#[derive(Debug, Deserialize)]
pub struct FormatItem {
    pub codec: Vec<CodecItem>,
}

#[derive(Debug, Deserialize)]
pub struct StreamItem {
    pub format: Vec<FormatItem>,
}

#[derive(Debug, Deserialize)]
pub(super) struct PlayUrlInfo {
    pub playurl: PlayUrl,
}

#[derive(Debug, Deserialize)]
pub struct PlayUrl {
    pub stream: Vec<StreamItem>,
}

#[derive(Debug, Deserialize)]
pub(super) struct ResponseData {
    live_status: i32,
    pub playurl_info: PlayUrlInfo,
}

#[derive(Debug, Deserialize)]
pub struct Response {
    code: i32,
    message: String,
    pub data: ResponseData,
}

pub struct RoomPlayInfoFetcher<'a> {
    client: &'a Client,
    room_id: u64,
    cookie: &'a str,
}

impl<'a> RoomPlayInfoFetcher<'a> {
    pub fn new(client: &'a Client, room_id: u64, cookie: &'a str) -> Self {
        RoomPlayInfoFetcher {
            client,
            room_id,
            cookie,
        }
    }

    pub async fn fetch(&self) -> LsarResult<Response> {
        debug!("Fetching room play info for room ID: {}", self.room_id);
        let url = format!("{}{}", BASE_URL, self.room_id);
        let response_value = self
            .client
            .get(&url)
            .header("Cookie", self.cookie)
            .send()
            .await
            .map_err(|e| {
                let err_msg = format!("Failed to send request: {}", e);
                error!("{}", err_msg);
                err_msg
            })?
            .json::<Value>()
            .await
            .map_err(|e| {
                let err_msg = format!("Failed to parse response JSON: {}", e);
                error!("{}", err_msg);
                err_msg
            })?;

        debug!("Room play info response: {}", response_value);

        let live_status = response_value["data"]["live_status"].as_i64().unwrap_or(0);
        if live_status == 0 {
            return Err(RoomStateError::Offline.into());
        }

        let response: Response = serde_json::from_value(response_value)?;

        if response.code != 0 {
            let err_msg = format!("Room play info request unsuccessful: {}", response.message);
            warn!("{}", err_msg);
            return Err(err_msg.into());
        }

        if response.data.live_status == 0 {
            let err_msg = "Stream is not live";
            info!("{}", err_msg);
            return Err(err_msg.into());
        }

        debug!("Successfully fetched room play info");
        Ok(response)
    }
}
