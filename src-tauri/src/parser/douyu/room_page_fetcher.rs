use crate::{error::LsarResult, parser::http_client::HttpClient};

pub struct RoomPageFetcher {
    http_client: HttpClient,
}

impl RoomPageFetcher {
    pub fn new(http_client: HttpClient) -> Self {
        RoomPageFetcher { http_client }
    }

    pub async fn fetch(&self, room_id: u64) -> LsarResult<String> {
        let url = format!("https://www.douyu.com/{}", room_id);
        debug!("Fetching room page from URL: {}", url);

        let html = self.http_client.get(&url).await?;

        trace!("Room page fetched successfully");
        Ok(html)
    }
}
