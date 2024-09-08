use super::constants::{INVALID_REQUEST, ROOM_OFFLINE_STATE};
use super::models::RoomInfo;
use crate::error::{LsarResult, RequestError, RoomStateError};
use crate::parser::http_client::HttpClient;

pub struct RoomInfoFetcher {
    http_client: HttpClient,
}

impl RoomInfoFetcher {
    pub fn new(http_client: HttpClient) -> Self {
        RoomInfoFetcher { http_client }
    }

    pub async fn fetch(&self, room_id: u64, params: &str) -> LsarResult<RoomInfo> {
        let url = format!(
            "https://playweb.douyu.com/lapi/live/getH5Play/{}?{}",
            room_id, params
        );
        debug!("Fetching room info from URL: {}", url);

        let room_info: RoomInfo = self.http_client.get_json(&url).await?;

        self.validate_room_info(&room_info)?;

        Ok(room_info)
    }

    fn validate_room_info(&self, room_info: &RoomInfo) -> LsarResult<()> {
        if let Some(error) = room_info.error {
            if error != 0 {
                warn!("Room info error: {}", room_info.msg);
                if room_info.msg == ROOM_OFFLINE_STATE {
                    return Err(RoomStateError::Offline.into());
                }
                if room_info.msg == INVALID_REQUEST {
                    return Err(RequestError::BadRequest.into());
                }
            }
        }
        Ok(())
    }
}
