use std::collections::HashMap;

use reqwest::header::{HeaderMap, HeaderName, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use tauri::http::HeaderValue;

use crate::error::{LsarError, LsarResult};

type JsonMap = Map<String, Value>;

#[derive(Debug, Serialize)]
pub struct Response {
    status: u16,
    headers: JsonMap,
    body: Value,
}

fn header_to_map(value: &HeaderMap) -> JsonMap {
    value
        .into_iter()
        .filter_map(|(k, v)| {
            v.to_str()
                .ok()
                .map(|v_str| (k.to_string(), Value::String(v_str.to_owned())))
        })
        .collect()
}

trait ResponseHandler {
    async fn handle_response(self) -> LsarResult<Response>;
}

impl ResponseHandler for reqwest::Response {
    async fn handle_response(self) -> LsarResult<Response> {
        let status = self.status().as_u16();
        let headers = self.headers().clone();
        let body = if let Some(ct) = self.headers().get("content-type") {
            if ct.to_str().map(|s| s.contains("json")).unwrap_or(false) {
                self.json().await.map_err(|e| {
                    error!(message = "Failed to parse JSON response", error = ?e);
                    LsarError::Http(e.into())
                })?
            } else {
                Value::String(self.text().await.map_err(|e| {
                    error!(message = "Failed to get text response", error = ?e);
                    LsarError::Http(e.into())
                })?)
            }
        } else {
            Value::String(self.text().await.map_err(|e| {
                error!(message = "Failed to get text response", error = ?e);
                LsarError::Http(e.into())
            })?)
        };

        Ok(Response {
            status,
            headers: header_to_map(&headers),
            body,
        })
    }
}

#[tauri::command]
pub async fn get(url: String, headers: HashMap<String, String>) -> LsarResult<Response> {
    debug!(message = "Sending GET request", url = %url);

    let client = reqwest::Client::new();
    let header: HeaderMap = headers
        .into_iter()
        .filter_map(|(k, v)| {
            Some((
                k.parse::<HeaderName>().ok()?,
                v.parse::<HeaderValue>().ok()?,
            ))
        })
        .collect();

    client
        .get(url)
        .headers(header)
        .send()
        .await
        .map_err(|e| {
            error!(message = "Failed to send request", error = ?e);
            LsarError::Http(e.into())
        })?
        .handle_response()
        .await
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PostContentType {
    Json,
    Form,
}

impl From<PostContentType> for HeaderValue {
    fn from(val: PostContentType) -> Self {
        match val {
            PostContentType::Json => HeaderValue::from_static("application/json"),
            PostContentType::Form => HeaderValue::from_static("application/x-www-form-urlencoded"),
        }
    }
}

#[tauri::command]
pub async fn post(
    url: String,
    body: String,
    content_type: PostContentType,
) -> LsarResult<Response> {
    let client = reqwest::Client::new();

    client
        .post(url)
        .body(body)
        .header(CONTENT_TYPE, content_type)
        .send()
        .await
        .map_err(|e| {
            error!(message = "Failed to send request", error = ?e);
            LsarError::Http(e.into())
        })?
        .handle_response()
        .await
}
