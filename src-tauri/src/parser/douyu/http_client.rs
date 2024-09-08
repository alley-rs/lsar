use reqwest::Client;
use serde::de::DeserializeOwned;

use crate::error::{LsarError, LsarResult};

#[derive(Clone)]
pub struct HttpClient {
    client: Client,
}

impl HttpClient {
    pub fn new() -> Self {
        HttpClient {
            client: Client::new(),
        }
    }

    pub async fn get(&self, url: &str) -> LsarResult<String> {
        self.client
            .get(url)
            .send()
            .await
            .map_err(|e| LsarError::Http(e.into()))?
            .text()
            .await
            .map_err(|e| LsarError::Http(e.into()))
    }

    pub async fn get_json<T: DeserializeOwned>(&self, url: &str) -> LsarResult<T> {
        self.client
            .get(url)
            .send()
            .await
            .map_err(|e| LsarError::Http(e.into()))?
            .json()
            .await
            .map_err(|e| LsarError::Http(e.into()))
    }

    // NOTE: http client 之后给其他解析器用，这里的 post_json 方法一定会用到，暂时占位
    #[allow(dead_code)]
    pub async fn post_json<T: DeserializeOwned>(&self, url: &str, body: &str) -> LsarResult<T> {
        self.client
            .post(url)
            .body(body.to_string())
            .send()
            .await
            .map_err(|e| LsarError::Http(e.into()))?
            .json()
            .await
            .map_err(|e| LsarError::Http(e.into()))
    }
}
