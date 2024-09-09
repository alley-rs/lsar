use super::room_play_info_fetcher::Response;

pub struct LinkParser;

impl LinkParser {
    pub fn new() -> Self {
        LinkParser
    }

    pub fn parse(&self, info: &Response) -> Vec<String> {
        trace!("Starting to parse stream links");
        let mut links = Vec::new();

        for (stream_index, stream) in info.data.playurl_info.playurl.stream.iter().enumerate() {
            for (format_index, format) in stream.format.iter().enumerate() {
                for (codec_index, codec) in format.codec.iter().enumerate() {
                    for (url_index, url_info) in codec.url_info.iter().enumerate() {
                        let link = format!("{}{}{}", url_info.host, codec.base_url, url_info.extra);
                        trace!(
                            "Parsed link: {} (Stream: {}, Format: {}, Codec: {}, URL: {})",
                            link,
                            stream_index,
                            format_index,
                            codec_index,
                            url_index
                        );
                        links.push(link);
                    }
                }
            }
        }

        debug!("Parsed {} stream links", links.len());
        links
    }
}
