use serde_json::Value;

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

    async fn request(
        &self,
        room_id: u64,
        params: &str,
        is_post_request: bool,
    ) -> LsarResult<Value> {
        let room_info_value: Value = if is_post_request {
            let url = format!("https://www.douyu.com/lapi/live/getH5Play/{}", room_id);
            debug!("Fetching room info from URL: {}, params: {}", url, params);
            self.http_client.post(&url, params).await?
        } else {
            let url = format!(
                "https://playweb.douyu.com/lapi/live/getH5Play/{}?{}",
                room_id, params
            );
            debug!("Fetching room info from URL: {}", url);

            trace!("Sending GET request to fetch room info");
            self.http_client.get_json(&url).await?
        };

        Ok(room_info_value)
    }

    pub async fn fetch(&self, room_id: u64, params: &str) -> LsarResult<RoomInfo> {
        let mut room_info_value = self.request(room_id, params, false).await?;
        debug!("Received response for room info 1/2: {}", room_info_value);

        if room_info_value.to_string().contains("非法请求") {
            room_info_value = self.request(room_id, params, true).await?;
            debug!("Received response for room info 2/2: {}", room_info_value);
        }

        let error_code = room_info_value["error"].as_i64().unwrap_or(0);
        if error_code == -15 {
            return Err(RequestError::BadRequest.into());
        }
        if error_code == -5 {
            return Err(RoomStateError::Offline.into());
        }

        let room_info: RoomInfo = serde_json::from_value(room_info_value)?;

        info!("Successfully fetched room info for room_id: {}", room_id);

        self.validate_room_info(&room_info)?;

        Ok(room_info)
    }

    fn validate_room_info(&self, room_info: &RoomInfo) -> LsarResult<()> {
        trace!("Validating room info");
        if let Some(error) = room_info.error {
            if error != 0 {
                warn!("Room info error: {} (error code: {})", room_info.msg, error);
                if room_info.msg == ROOM_OFFLINE_STATE {
                    error!("Room is offline");
                    return Err(RoomStateError::Offline.into());
                }
                if room_info.msg == INVALID_REQUEST {
                    error!("Invalid request error");
                    return Err(RequestError::BadRequest.into());
                }
            }
        }
        debug!("Room info validation successful");
        Ok(())
    }
}
