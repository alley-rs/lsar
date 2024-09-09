use reqwest::{header::USER_AGENT, Client};
use tauri::http::{HeaderMap, HeaderValue};

use crate::error::LsarResult;

pub struct HTMLFetcher<'a> {
    client: &'a Client,
    url: &'a str,
}

impl<'a> HTMLFetcher<'a> {
    pub fn new(client: &'a Client, url: &'a str) -> Self {
        HTMLFetcher { client, url }
    }

    pub async fn fetch(&self) -> LsarResult<String> {
        debug!("Fetching page HTML from: {}", self.url);
        let mut headers = HeaderMap::new();
        headers.insert("Host", HeaderValue::from_static("live.bilibili.com"));
        headers.insert(
            USER_AGENT,
            HeaderValue::from_static(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:102.0) Gecko/20100101 Firefox/102.0",
            ),
        );
        headers.insert("Accept", HeaderValue::from_static("text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"));
        headers.insert("Accept-Language", HeaderValue::from_static("zh-CN"));
        headers.insert("Connection", HeaderValue::from_static("keep-alive"));
        headers.insert("Upgrade-Insecure-Requests", HeaderValue::from_static("1"));
        headers.insert("Sec-Fetch-Dest", HeaderValue::from_static("document"));
        headers.insert("Sec-Fetch-Mode", HeaderValue::from_static("navigate"));
        headers.insert("Sec-Fetch-Site", HeaderValue::from_static("none"));
        headers.insert("Sec-Fetch-User", HeaderValue::from_static("?1"));
        headers.insert("DNT", HeaderValue::from_static("1"));
        headers.insert("Sec-GPC", HeaderValue::from_static("1"));

        let response = self
            .client
            .get(self.url)
            .headers(headers)
            .send()
            .await
            .map_err(|e| {
                let err_msg = format!("Failed to send request: {}", e);
                error!("{}", err_msg);
                err_msg
            })?;

        let html = response.text().await.map_err(|e| {
            let err_msg = format!("Failed to get response text: {}", e);
            error!("{}", err_msg);
            err_msg
        })?;

        debug!(
            "Successfully fetched HTML. Length: {} characters",
            html.len()
        );
        Ok(html)
    }
}
