use reqwest::Client;
use serde::Deserialize;

use crate::error::LsarResult;

#[derive(Debug, Deserialize)]
struct RoomInfoData {
    anchor_info: AnchorInfo,
    room_info: RoomInfo,
}

#[derive(Debug, Deserialize)]
struct AnchorInfo {
    base_info: BaseInfo,
}

#[derive(Debug, Deserialize)]
struct BaseInfo {
    //face: String, // 头像，如果以后需要的话再使用
    uname: String,
}

#[derive(Debug, Deserialize)]
struct RoomInfo {
    area_name: String,
    title: String,
}

#[derive(Debug, Deserialize)]
struct RoomInfoResponse {
    data: RoomInfoData,
}

pub struct RoomInfoFetcher<'a> {
    client: &'a Client,
    room_id: u64,
    cookie: &'a str,
}

impl<'a> RoomInfoFetcher<'a> {
    pub fn new(client: &'a Client, room_id: u64, cookie: &'a str) -> Self {
        RoomInfoFetcher {
            client,
            room_id,
            cookie,
        }
    }

    pub async fn fetch(&self) -> LsarResult<(String, String, String)> {
        debug!("Fetching room info for room ID: {}", self.room_id);
        let url = format!(
            "https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByRoom?room_id={}",
            self.room_id
        );
        let response = self
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
            .json::<RoomInfoResponse>()
            .await
            .map_err(|e| {
                let err_msg = format!("Failed to parse response JSON: {}", e);
                error!("{}", err_msg);
                err_msg
            })?;

        let data = response.data;
        debug!(
            "Successfully fetched room info. Title: {}, Anchor: {}, Category: {}",
            data.room_info.title, data.anchor_info.base_info.uname, data.room_info.area_name
        );

        Ok((
            data.room_info.title,
            data.anchor_info.base_info.uname,
            data.room_info.area_name,
        ))
    }
}
