use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub(super) struct CacheProfile {
    pub(super) data: CacheProfileData,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all(deserialize = "camelCase"))]
pub(super) struct CacheProfileData {
    pub(super) stream: StreamInfo,
    pub(super) live_data: LiveData,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all(deserialize = "camelCase"))]
pub(super) struct StreamInfo {
    pub(super) base_steam_info_list: Vec<BaseSteamInfo>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all(deserialize = "camelCase"))]
pub(super) struct BaseSteamInfo {
    pub(super) s_stream_name: String,
    pub(super) s_flv_url: String,
    pub(super) s_flv_anti_code: String,
    pub(super) s_flv_url_suffix: String,
    pub(super) s_hls_url: String,
    pub(super) s_hls_anti_code: String,
    pub(super) s_hls_url_suffix: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all(deserialize = "camelCase"))]
pub(super) struct LiveData {
    pub(super) nick: String,
    pub(super) game_full_name: String,
    pub(super) introduction: String,
}
