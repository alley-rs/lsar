use bytes::Bytes;
use reqwest::Client;
use serde::{de::DeserializeOwned, Serialize};
use tauri::http::{HeaderMap, HeaderName};

use crate::error::{LsarError, LsarResult};

#[derive(Clone)]
pub struct HttpClient {
    client: Client,
    headers: HeaderMap,
}

impl HttpClient {
    pub fn new() -> Self {
        HttpClient {
            client: Client::new(),
            headers: HeaderMap::default(),
        }
    }

    pub fn insert_header(&mut self, name: HeaderName, value: &str) {
        self.headers.insert(name, value.parse().unwrap());
    }

    pub async fn get(&self, url: &str) -> LsarResult<String> {
        self.client
            .get(url)
            .headers(self.headers.clone())
            .send()
            .await
            .map_err(|e| LsarError::Http(e.into()))?
            .text()
            .await
            .map_err(|e| LsarError::Http(e.into()))
    }

    pub async fn get_bytes(&self, url: &str) -> LsarResult<Bytes> {
        self.client
            .get(url)
            .headers(self.headers.clone())
            .send()
            .await
            .map_err(|e| LsarError::Http(e.into()))?
            .bytes()
            .await
            .map_err(|e| LsarError::Http(e.into()))
    }

    pub async fn get_json<T: DeserializeOwned>(&self, url: &str) -> LsarResult<T> {
        self.client
            .get(url)
            .headers(self.headers.clone())
            .send()
            .await
            .map_err(|e| LsarError::Http(e.into()))?
            .json()
            .await
            .map_err(|e| LsarError::Http(e.into()))
    }

    pub async fn post_json<T: DeserializeOwned, S: Serialize>(
        &self,
        url: &str,
        body: S,
    ) -> LsarResult<T> {
        self.client
            .post(url)
            .json(&body)
            .send()
            .await
            .map_err(|e| LsarError::Http(e.into()))?
            .json()
            .await
            .map_err(|e| LsarError::Http(e.into()))
    }
}
