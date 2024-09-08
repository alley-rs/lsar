use regex::Regex;

use super::models::RoomInfo;
use crate::error::{LsarResult, MissKeyFieldError, RoomStateError};
use crate::parser::ParsedResult;
use crate::platform::Platform;

pub struct StreamInfoParser {}

impl StreamInfoParser {
    pub fn new() -> Self {
        StreamInfoParser {}
    }

    pub fn extract_final_room_id(&self, html: &str) -> LsarResult<u64> {
        trace!("Extracting final room ID from HTML");

        if html.contains("<span><p>该房间目前没有开放</p></span>") {
            return Err(RoomStateError::NotExists.into());
        }

        let re = Regex::new(r"\$ROOM\.room_id = ?(\d+);")?;
        let captures = re.captures(html).ok_or_else(|| {
            error!("Failed to extract final room ID");
            MissKeyFieldError::RoomId
        })?;

        let room_id = captures[1].parse().map_err(|_| {
            error!("Failed to parse final room ID");
            MissKeyFieldError::RoomId
        })?;

        debug!("Extracted final room ID: {}", room_id);
        Ok(room_id)
    }

    pub async fn parse(&self, room_info: RoomInfo, html: &str) -> LsarResult<ParsedResult> {
        trace!("Parsing stream info");

        if room_info.error != Some(-15) && room_info.data.rtmp_live.is_none() {
            warn!("Room is offline");
            return Err(RoomStateError::Offline.into());
        }

        let stream_url = format!(
            "{}/{}",
            room_info.data.rtmp_url,
            room_info.data.rtmp_live.unwrap()
        );

        let parsed_result = ParsedResult {
            platform: Platform::Douyu,
            title: self.parse_stream_title(html)?,
            anchor: self.parse_anchor_name(html)?,
            room_id: self.extract_final_room_id(html)?,
            category: self.parse_stream_category(html),
            links: vec![stream_url],
        };

        info!("Stream info parsed successfully");
        Ok(parsed_result)
    }

    fn parse_anchor_name(&self, html: &str) -> LsarResult<String> {
        trace!("Parsing anchor name");

        let re = Regex::new(r#"<div class="Title-anchorName" title="(.+?)">"#)?;
        re.captures(html)
            .and_then(|cap| cap.get(1))
            .map(|m| m.as_str().to_string())
            .ok_or_else(|| {
                error!("Failed to parse anchor name");
                MissKeyFieldError::AnchorName.into()
            })
    }

    fn parse_stream_category(&self, html: &str) -> String {
        trace!("Parsing stream category");

        let re = Regex::new(r#"<span class="Title-categoryArrow"></span><a class="Title-categoryItem" href=".+?" target="_blank" title="(.+?)">"#).unwrap();
        let category = re
            .captures(html)
            .and_then(|cap| cap.get(1))
            .map(|m| m.as_str().to_string())
            .unwrap_or_default();

        debug!("Parsed stream category: {}", category);
        category
    }

    fn parse_stream_title(&self, html: &str) -> LsarResult<String> {
        trace!("Parsing stream title");

        let re = Regex::new(r#"<h3 class="Title-header">(.+?)</h3>"#)?;
        re.captures(html)
            .and_then(|cap| cap.get(1))
            .map(|m| m.as_str().to_string())
            .ok_or_else(|| {
                error!("Failed to parse stream title");
                MissKeyFieldError::Title.into()
            })
    }
}
