mod douyu;

use serde::Serialize;

pub use self::douyu::parse_douyu;

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
