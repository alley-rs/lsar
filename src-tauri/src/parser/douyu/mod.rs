use serde_json::Value;
use tauri::AppHandle;

use crate::error::LsarResult;
use crate::eval::{EvalChannel, EvalSender};
use crate::parser::{ParsedResult, Parser};

mod constants;
mod http_client;
mod models;
mod room_info_fetcher;
mod room_page_fetcher;
mod signature_generator;
mod stream_info_parser;

use http_client::HttpClient;
use models::RoomInfo;
use room_info_fetcher::RoomInfoFetcher;
use room_page_fetcher::RoomPageFetcher;
use signature_generator::SignatureGenerator;
use stream_info_parser::StreamInfoParser;

pub struct DouyuParser {
    room_id: u64,
    final_room_id: u64,
    http_client: HttpClient,
    room_page_fetcher: RoomPageFetcher,
    signature_generator: SignatureGenerator,
    room_info_fetcher: RoomInfoFetcher,
    stream_info_parser: StreamInfoParser,
}

impl DouyuParser {
    pub fn new(room_id: u64, eval_channel_sender: EvalSender, app_handle: AppHandle) -> Self {
        let http_client = HttpClient::new();

        DouyuParser {
            room_id,
            final_room_id: 0,
            http_client: http_client.clone(),
            room_page_fetcher: RoomPageFetcher::new(http_client.clone()),
            signature_generator: SignatureGenerator::new(eval_channel_sender, app_handle),
            room_info_fetcher: RoomInfoFetcher::new(http_client.clone()),
            stream_info_parser: StreamInfoParser::new(),
        }
    }

    async fn update_final_room_id(&mut self, html: &str) -> LsarResult<()> {
        self.final_room_id = self.stream_info_parser.extract_final_room_id(html)?;
        info!("Final room ID updated: {}", self.final_room_id);
        Ok(())
    }

    async fn is_replay(&self) -> LsarResult<bool> {
        let url = format!("https://www.douyu.com/betard/{}", self.final_room_id);
        let body: Value = self.http_client.get_json(&url).await?;
        let is_replay = body["room"]["videoLoop"].as_bool().unwrap_or(false);
        info!("Room replay status: {}", is_replay);
        Ok(is_replay)
    }
}

impl Parser for DouyuParser {
    async fn parse(&mut self) -> LsarResult<ParsedResult> {
        trace!("Starting parsing process for Douyu stream");

        let html = self.room_page_fetcher.fetch(self.room_id).await?;
        self.update_final_room_id(&html).await?;

        if self.is_replay().await? {
            warn!("Stream is a replay, not a live stream");
            return Err(crate::error::RoomStateError::IsReplay.into());
        }

        let signature_function = self.signature_generator.extract_signature_function(&html)?;
        let params = self
            .signature_generator
            .generate_params(self.final_room_id, &signature_function)
            .await?;

        let room_info: RoomInfo = self
            .room_info_fetcher
            .fetch(self.final_room_id, &params)
            .await?;
        let parsed_result = self.stream_info_parser.parse(room_info, &html).await?;

        info!("Parsing process completed successfully");
        Ok(parsed_result)
    }
}

#[tauri::command]
pub async fn parse_douyu(
    room_id: u64,
    eval_channel: tauri::State<'_, EvalChannel>,
    app_handle: tauri::AppHandle,
) -> LsarResult<ParsedResult> {
    let mut douyu = DouyuParser::new(room_id, eval_channel.sender.clone(), app_handle);
    douyu.parse().await
}
