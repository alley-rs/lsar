use crate::error::{LsarError, LsarResult};

pub(super) struct HtmlParser;

impl HtmlParser {
    pub(super) fn extract_stream_info(html: &str) -> LsarResult<String> {
        trace!("Extracting stream info from HTML");
        html.split("stream: ")
            .nth(1)
            .and_then(|s| s.split_once(",\"iFrameRate\""))
            .map(|(json, _)| format!("{}}}", json))
            .ok_or_else(|| LsarError::from("Failed to extract stream info"))
    }
}
