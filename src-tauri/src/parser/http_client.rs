use bytes::Bytes;
use reqwest::{header::CONTENT_TYPE, Client};
use serde::{de::DeserializeOwned, Serialize};
use tauri::http::{HeaderMap, HeaderName, HeaderValue};

use crate::error::{LsarError, LsarResult};

#[derive(Clone)]
pub struct HttpClient {
    client: Client,
    headers: HeaderMap,
}

impl HttpClient {
    pub fn new() -> Self {
        trace!("Creating new HttpClient instance");
        let client = HttpClient {
            client: Client::new(),
            headers: HeaderMap::default(),
        };
        debug!("HttpClient instance created with default headers");
        client
    }

    pub fn insert_header(&mut self, name: HeaderName, value: &str) -> LsarResult<()> {
        trace!("Inserting header: {:?} = {}", name, value);
        let header_value = HeaderValue::from_str(value).map_err(|e| {
            error!("Failed to create header value: {}", e);
            LsarError::from(e.to_string())
        })?;
        self.headers.insert(name, header_value);
        debug!("Header inserted successfully");
        Ok(())
    }

    async fn send_request(
        &self,
        request: reqwest::RequestBuilder,
    ) -> LsarResult<reqwest::Response> {
        request
            .headers(self.headers.clone())
            .send()
            .await
            .map_err(|e| {
                error!("HTTP request failed: {}", e);
                LsarError::Http(e.into())
            })
    }

    pub async fn get(&self, url: &str) -> LsarResult<String> {
        info!("Sending GET request to: {}", url);
        let response = self.send_request(self.client.get(url)).await?;

        debug!("GET request successful, status: {}", response.status());
        let body = response.text().await.map_err(|e| {
            error!("Failed to read response body: {}", e);
            LsarError::Http(e.into())
        })?;

        trace!("Response body received, length: {} bytes", body.len());
        Ok(body)
    }

    pub async fn get_bytes(&self, url: &str) -> LsarResult<Bytes> {
        info!("Sending GET request for bytes to: {}", url);
        let response = self.send_request(self.client.get(url)).await?;

        debug!(
            "GET request for bytes successful, status: {}",
            response.status()
        );
        let bytes = response.bytes().await.map_err(|e| {
            error!("Failed to read response bytes: {}", e);
            LsarError::Http(e.into())
        })?;

        trace!("Response bytes received, length: {} bytes", bytes.len());
        Ok(bytes)
    }

    pub async fn get_json<T: DeserializeOwned>(&self, url: &str) -> LsarResult<T> {
        info!("Sending GET request for JSON to: {}", url);
        let response = self.send_request(self.client.get(url)).await?;

        debug!(
            "GET request for JSON successful, status: {}",
            response.status()
        );
        let json = response.json().await.map_err(|e| {
            error!("Failed to parse JSON response: {}", e);
            LsarError::Http(e.into())
        })?;

        trace!("JSON response parsed successfully");
        Ok(json)
    }

    pub async fn post<T: DeserializeOwned>(&self, url: &str, body: &str) -> LsarResult<T> {
        info!("Sending POST request with body to: {}", url);
        let response = self
            .send_request(
                self.client
                    .post(url)
                    .body(body.to_string())
                    .header(CONTENT_TYPE, "application/x-www-form-urlencoded"),
            )
            .await?;

        debug!("POST request successful, status: {}", response.status());
        let json = response.json().await.map_err(|e| {
            error!("Failed to parse JSON response from POST request: {}", e);
            LsarError::Http(e.into())
        })?;

        trace!("JSON response from POST request parsed successfully");
        Ok(json)
    }

    pub async fn post_json<T: DeserializeOwned, S: Serialize + ?Sized>(
        &self,
        url: &str,
        body: &S,
    ) -> LsarResult<T> {
        info!("Sending POST request with JSON body to: {}", url);
        let response = self.send_request(self.client.post(url).json(body)).await?;

        debug!("POST request successful, status: {}", response.status());
        let json = response.json().await.map_err(|e| {
            error!("Failed to parse JSON response from POST request: {}", e);
            LsarError::Http(e.into())
        })?;

        trace!("JSON response from POST request parsed successfully");
        Ok(json)
    }
}
