use bilibili_parser::BilibiliParser;

use crate::error::LsarResult;

use super::ParsedResult;

mod bilibili_parser;
mod cookie_verifier;
mod html_fetcher;
mod link_parser;
mod room_info_fetcher;
mod room_play_info_fetcher;

#[tauri::command]
pub async fn parse_bilibili(
    room_id: u64,
    cookie: String,
    url: Option<String>,
) -> LsarResult<ParsedResult> {
    let mut parser = BilibiliParser::new(cookie, room_id, url);

    match parser.parse().await {
        Ok(result) => {
            info!(target: "main", "Parsing successful. Result: {:?}", result);
            Ok(result)
        }
        Err(e) => {
            error!(target: "main", "Parsing failed: {}. Error details: {:?}", e, e);
            Err(e)
        }
    }
}
