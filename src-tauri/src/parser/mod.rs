mod douyin;
mod douyu;
mod http_client;
mod huya;
mod time;

use serde::Serialize;

pub use self::douyin::parse_douyin;
pub use self::douyu::parse_douyu;
pub use self::huya::parse_huya;

use crate::{error::LsarResult, platform::Platform};

#[derive(Debug, Serialize)]
pub struct ParsedResult {
    platform: Platform,
    title: String,
    anchor: String,
    #[serde(rename(serialize = "roomID"))]
    room_id: u64,
    category: String,
    links: Vec<String>,
}

trait Parser {
    async fn parse(&mut self) -> LsarResult<ParsedResult>;
}
