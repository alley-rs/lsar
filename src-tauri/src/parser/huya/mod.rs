mod anticode_parser;
mod html_parser;
mod login_request;
mod models;
mod url;
mod uuid;

use reqwest::header::USER_AGENT;
use serde_json::Value;
use url::UrlParser;

use self::anticode_parser::AnticodeParser;
use self::html_parser::HtmlParser;
use self::login_request::LoginRequest;
use self::uuid::UuidGenerator;

use crate::{
    error::{LsarError, LsarResult, MissKeyFieldError, RoomStateError},
    parser::time::now,
    platform::Platform,
    utils::md5,
};

use super::{http_client::HttpClient, ParsedResult, Parser};

use self::models::{BaseSteamInfo, CacheProfile};

const BASE_URL: &str = "https://m.huya.com/";

struct HuyaParser {
    room_id: Option<u64>,
    page_url: String,
    client: HttpClient,
}

impl HuyaParser {
    fn new(room_id: Option<u64>, page_url: String) -> Self {
        let mut client = HttpClient::new();
        client.insert_header(USER_AGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36");

        HuyaParser {
            room_id,
            page_url,
            client,
        }
    }

    async fn get_final_room_id(&self) -> LsarResult<u64> {
        info!("Fetching final room ID");
        let url = if let Some(id) = self.room_id {
            format!("{}{}", BASE_URL, id)
        } else {
            self.page_url.clone()
        };

        debug!("Fetching HTML from URL: {}", url);
        let html = self.client.get(&url).await.map_err(|e| {
            error!("Failed to fetch HTML: {}", e);
            e
        })?;

        let stream_str = HtmlParser::extract_stream_info(&html).map_err(|e| {
            error!("Failed to extract stream info: {}", e);
            e
        })?;
        debug!("Extracted stream info: {}", stream_str);

        let stream: Value = serde_json::from_str(&stream_str).map_err(|e| {
            error!("Failed to parse stream info JSON: {}", e);
            e
        })?;

        let room_id = stream["data"][0]["gameLiveInfo"]["profileRoom"]
            .as_u64()
            .ok_or_else(|| {
                error!("Failed to extract room ID");
                MissKeyFieldError::RoomId
            })?;

        info!("Real room ID: {}", room_id);
        Ok(room_id)
    }

    async fn get_room_profile(&self, room_id: u64) -> LsarResult<Value> {
        info!("Fetching room profile for room ID: {}", room_id);
        let url = format!(
            "https://mp.huya.com/cache.php?m=Live&do=profileRoom&roomid={}",
            room_id
        );
        let profile_bytes = self.client.get_bytes(&url).await.map_err(|e| {
            error!("Failed to fetch room profile: {}", e);
            e
        })?;
        let profile_value: Value = serde_json::from_slice(&profile_bytes).map_err(|e| {
            error!("Failed to parse room profile JSON: {}", e);
            e
        })?;
        debug!("Received profile: {}", profile_value);

        let status = profile_value["status"].as_i64().unwrap_or(0);

        if status != 200 {
            warn!("Profile status is not 200: {}", status);

            if status == 422 {
                error!("Streamer does not exist (status 422)");
                return Err(RoomStateError::NotExists.into());
            }

            let error_message = profile_value["message"].as_str().unwrap_or("Unknown error");
            error!("Error fetching room profile: {}", error_message);
            return Err(error_message.into());
        }

        Ok(profile_value)
    }

    async fn process_profile(&self, profile: Value, room_id: u64) -> LsarResult<ParsedResult> {
        trace!("Processing room profile");
        let live_status = profile["data"]["liveStatus"].as_str().unwrap();
        match live_status {
            "OFF" => {
                info!("Room is offline");
                Err(RoomStateError::Offline.into())
            }
            "REPLAY" => {
                info!("Room is in replay mode");
                Err(RoomStateError::IsReplay.into())
            }
            "ON" => {
                info!("Room is online");
                let profile: CacheProfile = serde_json::from_value(profile)?;

                let uid = self.get_anonymous_uid().await?;
                let links = self
                    .get_stream_links(&profile.data.stream.base_steam_info_list, &uid)
                    .await?;

                Ok(ParsedResult {
                    platform: Platform::Huya,
                    links,
                    title: profile.data.live_data.introduction,
                    anchor: profile.data.live_data.nick,
                    room_id,
                    category: profile.data.live_data.game_full_name,
                })
            }
            _ => unreachable!(),
        }
    }

    async fn get_anonymous_uid(&self) -> LsarResult<String> {
        info!("Getting anonymous UID");
        let login_request = LoginRequest::new();

        let response: Value = self
            .client
            .post_json("https://udblgn.huya.com/web/anonymousLogin", &login_request)
            .await
            .map_err(|e| {
                error!("Failed to perform anonymous login: {}", e);
                e
            })?;

        let uid = response["data"]["uid"]
            .as_str()
            .ok_or_else(|| {
                let err = LsarError::from("Failed to extract UID from response".to_owned());
                error!("{}", err);
                err
            })?
            .to_string();

        debug!("Retrieved anonymous UID: {}", uid);
        Ok(uid)
    }

    async fn get_stream_links(
        &self,
        base_steam_info_list: &[BaseSteamInfo],
        uid: &str,
    ) -> LsarResult<Vec<String>> {
        info!("Getting stream links");
        let mut links = Vec::new();

        for (index, item) in base_steam_info_list.iter().enumerate() {
            debug!("Processing steam info item {}", index);
            if !item.s_flv_anti_code.is_empty() {
                match self
                    .parse_anticode(&item.s_flv_anti_code, uid, &item.s_stream_name)
                    .await
                {
                    Ok(anticode) => {
                        let url = format!(
                            "{}/{}.{}?{}",
                            item.s_flv_url, item.s_stream_name, item.s_flv_url_suffix, anticode
                        );
                        debug!("Added FLV stream link: {}", url);
                        links.push(url);
                    }
                    Err(e) => error!("Failed to parse FLV anticode: {}", e),
                }
            }
            if !item.s_hls_anti_code.is_empty() {
                match self
                    .parse_anticode(&item.s_hls_anti_code, uid, &item.s_stream_name)
                    .await
                {
                    Ok(anticode) => {
                        let url = format!(
                            "{}/{}.{}?{}",
                            item.s_hls_url, item.s_stream_name, item.s_hls_url_suffix, anticode
                        );
                        debug!("Added HLS stream link: {}", url);
                        links.push(url);
                    }
                    Err(e) => error!("Failed to parse HLS anticode: {}", e),
                }
            }
        }

        if links.is_empty() {
            warn!("No stream links were generated");
        }

        Ok(links)
    }

    async fn parse_anticode(&self, code: &str, uid: &str, stream_name: &str) -> LsarResult<String> {
        debug!("Parsing anticode for stream: {}", stream_name);
        let mut query = UrlParser::parse_query(code).map_err(|e| {
            error!("Failed to parse anticode query: {}", e);
            e
        })?;

        query.insert("ver".to_string(), vec!["1".to_string()]);
        query.insert("sv".to_string(), vec!["2110211124".to_string()]);

        let seq_id = format!("{}", uid.parse::<u128>().unwrap() + now()?.as_millis());
        query.insert("seqid".to_string(), vec![seq_id.clone()]);
        debug!("Generated seqid: {}", seq_id);

        query.insert("uid".to_string(), vec![uid.to_string()]);

        let uuid = UuidGenerator::new_uuid().map_err(|e| {
            error!("Failed to generate UUID: {}", e);
            e
        })?;
        query.insert("uuid".to_string(), vec![uuid.to_string()]);
        debug!("Generated uuid: {}", uuid);

        let ss = md5(format!(
            "{}|{}|{}",
            seq_id, query["ctype"][0], query["t"][0]
        ))
        .await;
        debug!("Generated ss: {}", ss);

        let fm =
            AnticodeParser::parse_fm(&query["fm"][0], uid, stream_name, &ss, &query["wsTime"][0])
                .map_err(|e| {
                error!("Failed to parse FM: {}", e);
                e
            })?;

        let ws_secret = md5(fm).await;
        query.insert("wsSecret".to_string(), vec![ws_secret.clone()]);
        debug!("Generated wsSecret: {}", ws_secret);

        query.remove("fm");
        query.remove("txyp");

        Ok(query
            .into_iter()
            .map(|(k, v)| format!("{}={}", k, v[0]))
            .collect::<Vec<String>>()
            .join("&"))
    }
}

impl Parser for HuyaParser {
    async fn parse(&mut self) -> LsarResult<ParsedResult> {
        info!("Starting Huya parsing process");
        let room_id = self.get_final_room_id().await?;
        let profile = self.get_room_profile(room_id).await?;
        let result = self.process_profile(profile, room_id).await;
        info!("Huya parsing process completed");
        result
    }
}

#[tauri::command]
pub async fn parse_huya(room_id: Option<u64>, url: String) -> LsarResult<ParsedResult> {
    info!("Parsing Huya stream. Room ID: {:?}, URL: {}", room_id, url);
    let mut huya = HuyaParser::new(room_id, url);
    let result = huya.parse().await;
    match &result {
        Ok(_) => info!("Successfully parsed Huya stream"),
        Err(e) => error!("Failed to parse Huya stream: {}", e),
    }
    result
}
