use std::collections::HashMap;

use reqwest::header::{HeaderMap, HeaderName, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use tauri::http::HeaderValue;

use crate::error::LsarResult;

#[derive(Debug, Serialize)]
pub struct Response {
    status: u16,
    headers: Map<String, Value>,
    body: Value,
}

fn header_to_map(value: &HeaderMap) -> Map<String, Value> {
    Map::from_iter(
        value
            .into_iter()
            .map(|(k, v)| (k.to_string(), Value::String(v.to_str().unwrap().to_owned()))),
    )
}

async fn handle_response(resp: reqwest::Response) -> LsarResult<Response> {
    let status = resp.status().as_u16();
    let headers = resp.headers().clone();
    if let Some(ct) = resp.headers().get("content-type") {
        if ct.to_str().unwrap().contains("json") {
            let v: Value = resp.json().await.map_err(|e| {
                error!(message = "获取 json 响应时失败", error = ?e);
                e
            })?;

            return Ok(Response {
                status,
                headers: header_to_map(&headers),
                body: v,
            });
        }
    };

    let text = resp.text().await.map_err(|e| {
        error!(message = "获取文本响应时失败", error = ?e);
        e
    })?;

    Ok(Response {
        status,
        headers: header_to_map(&headers),
        body: Value::String(text),
    })
}

#[tauri::command]
pub async fn get(url: String, headers: HashMap<String, String>) -> LsarResult<Response> {
    debug!(message = "发送 GET 请求", url = url);

    let client = reqwest::Client::new();

    let mut header = HeaderMap::new();
    headers.into_iter().for_each(|(k, v)| {
        header.insert(k.parse::<HeaderName>().unwrap(), v.parse().unwrap());
    });

    let resp = client.get(url).headers(header).send().await.map_err(|e| {
        error!(message = "发送请求时失败", error = ?e);
        e
    })?;

    handle_response(resp).await
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PostContentType {
    Json,
    Form,
}

impl Into<HeaderValue> for PostContentType {
    fn into(self) -> HeaderValue {
        match self {
            Self::Json => "application/json".parse().unwrap(),
            Self::Form => "application/x-www-form-urlencoded".parse().unwrap(),
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

    let resp = client
        .post(url)
        .body(body)
        .header(CONTENT_TYPE, content_type)
        .send()
        .await?;

    handle_response(resp).await
}
