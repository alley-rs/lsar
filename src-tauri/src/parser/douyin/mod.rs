mod models;
mod utils;

use reqwest::header::{COOKIE, UPGRADE_INSECURE_REQUESTS};

use crate::error::{LsarResult, RoomStateError};
use crate::parser::ParsedResult;
use crate::platform::Platform;

use self::models::{Resolution, RoomInfo};
use self::utils::{get_ac_nonce, get_ttwid};

use super::http_client::HttpClient;
use super::Parser;

pub struct DouyinParser {
    room_id: u64,
    room_url: String,
    client: HttpClient,
}

impl DouyinParser {
    pub fn new(room_id: u64) -> Self {
        DouyinParser {
            room_id,
            room_url: format!("https://live.douyin.com/{}", room_id),
            client: HttpClient::new(),
        }
    }

    async fn setup_headers(&mut self) -> LsarResult<()> {
        debug!("Setting up headers");

        self.client.insert_header(UPGRADE_INSECURE_REQUESTS, "1")?;

        let ac_nonce = get_ac_nonce(&self.client, &self.room_url).await?;

        let cookie = format!("__ac_nonce={}", ac_nonce);
        self.client.insert_header(COOKIE, &cookie)?;
        let ttwid = get_ttwid(&self.client, &self.room_url).await?;

        let cookie = format!("__ac_nonce={}; ttwid={}", ac_nonce, ttwid);

        self.client.insert_header(COOKIE, &cookie)?;
        debug!("Headers set up successfully");
        Ok(())
    }

    async fn get_room_info(&self) -> LsarResult<RoomInfo> {
        let url = format!(
            "https://live.douyin.com/webcast/room/web/enter/?aid=6383&app_name=douyin_web&live_id=1&device_platform=web&language=zh-CN&enter_from=web_live&cookie_enabled=true&screen_width=1728&screen_height=1117&browser_language=zh-CN&browser_platform=MacIntel&browser_name=Chrome&browser_version=116.0.0.0&web_rid={}",
            self.room_id
        );

        trace!("Constructed room info URL: {}", url);
        info!("Sending GET request to fetch room info");
        let room_info: RoomInfo = self.client.get_json(&url).await?;
        debug!("Room info fetched successfully");
        Ok(room_info)
    }

    fn parse_room_info(&self, info: RoomInfo) -> LsarResult<ParsedResult> {
        trace!("Entering parse_room_info method");
        let room_data = &info.data.data[0];
        let user = &info.data.user;
        let partition = &info.data.partition_road_map;

        debug!("Room status: {}", room_data.status);
        if room_data.stream_url.is_none() {
            info!("Stream is not live for room ID: {}", self.room_id);
            return Err(RoomStateError::Offline.into());
        }

        trace!("Extracting stream URLs");
        let stream_url = room_data.stream_url.as_ref().unwrap();
        let flv_url = stream_url
            .flv_pull_url
            .get(&Resolution::FullHd1)
            .or_else(|| stream_url.flv_pull_url.get(&Resolution::Hd1));
        let hls_url = stream_url
            .hls_pull_url_map
            .get(&Resolution::FullHd1)
            .or_else(|| stream_url.hls_pull_url_map.get(&Resolution::Hd1));

        debug!("FLV URL found: {}", flv_url.is_some());
        debug!("HLS URL found: {}", hls_url.is_some());

        trace!("Determining stream category");

        let category = partition
            .sub_partition
            .as_ref()
            .map(|sp| sp.partition.title.clone())
            .or_else(|| partition.partition.as_ref().map(|p| p.title.clone()))
            .unwrap_or_else(|| {
                warn!("No category found for room ID: {}", self.room_id);
                String::new()
            });

        debug!("Stream category: {}", category);

        let result = ParsedResult {
            platform: Platform::Douyin,
            anchor: user.nickname.clone(),
            title: room_data.title.clone(),
            links: vec![
                flv_url.cloned().unwrap_or_default(),
                hls_url.cloned().unwrap_or_default(),
            ],
            room_id: self.room_id,
            category,
        };

        info!("Room info parsed successfully");
        Ok(result)
    }
}

impl Parser for DouyinParser {
    async fn parse(&mut self) -> LsarResult<ParsedResult> {
        info!("Starting parsing process for room ID: {}", self.room_id);
        trace!("Attempting to set up headers");
        self.setup_headers().await?;
        trace!("Headers set up successfully, fetching room info");
        let room_info = self.get_room_info().await?;
        debug!("Room info fetched, proceeding to parse");
        self.parse_room_info(room_info)
    }
}

#[tauri::command]
pub async fn parse_douyin(room_id: u64) -> LsarResult<ParsedResult> {
    info!("Parsing Douyin stream. Room ID: {}", room_id);
    let mut douyin = DouyinParser::new(room_id);
    let result = douyin.parse().await;
    match &result {
        Ok(_) => info!("Successfully parsed Douyin stream"),
        Err(e) => error!("Failed to parse Douyin stream: {}", e),
    }
    result
}
