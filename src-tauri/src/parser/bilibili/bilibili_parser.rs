use reqwest::Client;

use crate::error::LsarResult;
use crate::parser::ParsedResult;
use crate::platform::Platform;

use super::cookie_verifier::CookieVerifier;
use super::html_fetcher::HTMLFetcher;
use super::link_parser::LinkParser;
use super::room_info_fetcher::RoomInfoFetcher;
use super::room_play_info_fetcher::RoomPlayInfoFetcher;

pub struct BilibiliParser {
    room_id: u64,
    page_url: String,
    cookie: String,
    client: Client,
}

impl BilibiliParser {
    pub fn new(cookie: String, room_id: u64, url: Option<String>) -> Self {
        let page_url = url.unwrap_or_else(|| format!("https://live.bilibili.com/{}", room_id));
        let client = reqwest::Client::new();

        BilibiliParser {
            room_id,
            page_url,
            cookie,
            client,
        }
    }

    pub async fn parse(&mut self) -> LsarResult<ParsedResult> {
        trace!("Starting parsing process for room ID: {}", self.room_id);

        let cookie_verifier = CookieVerifier::new(&self.client, &self.cookie);
        match cookie_verifier.verify().await {
            Ok(username) => {
                info!(
                    "Cookie verification successful. Logged in user: {}",
                    username
                );
            }
            Err(e) => {
                error!("Cookie verification failed. Error: {}. Details: {:?}", e, e);
                return Err(e);
            }
        };

        if self.room_id == 0 {
            let html_fetcher = HTMLFetcher::new(&self.client, &self.page_url);
            let html = match html_fetcher.fetch().await {
                Ok(html) => {
                    debug!(
                        "Fetched page HTML successfully. Length: {} characters",
                        html.len()
                    );
                    html
                }
                Err(e) => {
                    error!("Failed to fetch page HTML. Error: {}. Details: {:?}", e, e);
                    return Err(e);
                }
            };

            self.room_id = self.parse_room_id(&html)?;
        }

        let room_info_fetcher = RoomInfoFetcher::new(&self.client, self.room_id, &self.cookie);
        let page_info = match room_info_fetcher.fetch().await {
            Ok(info) => {
                debug!(
                    "Fetched room info successfully. Title: {}, Anchor: {}, Category: {}",
                    info.0, info.1, info.2
                );
                info
            }
            Err(e) => {
                error!("Failed to fetch room info. Error: {}. Details: {:?}", e, e);
                return Err(e);
            }
        };

        let room_play_info_fetcher =
            RoomPlayInfoFetcher::new(&self.client, self.room_id, &self.cookie);
        let room_play_info = match room_play_info_fetcher.fetch().await {
            Ok(info) => {
                debug!("Fetched room play info successfully");
                info
            }
            Err(e) => {
                error!(
                    "Failed to fetch room play info. Error: {}. Details: {:?}",
                    e, e
                );
                return Err(e);
            }
        };

        let link_parser = LinkParser::new();
        let links = link_parser.parse(&room_play_info);
        debug!("Parsed {} stream links", links.len());

        let parsed_result = ParsedResult {
            title: page_info.0,
            anchor: page_info.1,
            category: page_info.2,
            platform: Platform::Bilibili,
            links,
            room_id: self.room_id,
        };

        info!(
            "Parsing completed successfully for room ID: {}",
            self.room_id
        );
        Ok(parsed_result)
    }

    fn parse_room_id(&self, html: &str) -> LsarResult<u64> {
        trace!("Parsing room ID from HTML");
        let room_id = html
            .split(r#""defaultRoomId":""#)
            .nth(1)
            .and_then(|s| s.split('"').next())
            .or_else(|| {
                html.split(r#""roomid":"#)
                    .nth(1)
                    .and_then(|s| s.split(',').next())
            })
            .or_else(|| {
                html.split(r#""roomId":"#)
                    .nth(1)
                    .and_then(|s| s.split(',').next())
            })
            .and_then(|s| s.parse::<u64>().ok())
            .ok_or_else(|| {
                let err_msg = "Failed to parse room ID";
                error!("{}", err_msg);
                err_msg
            })?;

        debug!("Parsed room ID: {}", room_id);
        Ok(room_id)
    }
}
