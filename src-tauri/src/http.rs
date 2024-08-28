use std::collections::HashMap;

use reqwest::header::{HeaderMap, HeaderName, CONTENT_TYPE};
use serde::Deserialize;
use serde_json::Value;
use tauri::http::HeaderValue;

use crate::error::LsarResult;

#[tauri::command]
pub async fn get(url: String, headers: HashMap<String, String>) -> LsarResult<Value> {
    let client = reqwest::Client::new();

    let mut header = HeaderMap::new();
    headers.into_iter().for_each(|(k, v)| {
        header.insert(k.parse::<HeaderName>().unwrap(), v.parse().unwrap());
    });

    let resp = client.get(url).headers(header).send().await?;
    if let Some(ct) = resp.headers().get("content-type") {
        if ct.to_str().unwrap().contains("json") {
            let v: Value = resp.json().await.map_err(|e| {
                error!(message = "获取 json 响应时失败", error = ?e);
                e
            })?;

            return Ok(v);
        }
    };

    let text = resp.text().await.map_err(|e| {
        error!(message = "获取文本响应时失败", error = ?e);
        e
    })?;

    Ok(Value::String(text))
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
pub async fn post(url: String, body: String, content_type: PostContentType) -> LsarResult<Value> {
    let client = reqwest::Client::new();

    let resp = client
        .post(url)
        .body(body)
        .header(CONTENT_TYPE, content_type)
        .send()
        .await?;

    if let Some(ct) = resp.headers().get("content-type") {
        if ct.to_str().unwrap().contains("json") {
            let v: Value = resp.json().await.map_err(|e| {
                error!(message = "获取 json 响应时失败", error = ?e);
                e
            })?;

            return Ok(v);
        }
    };

    let text = resp.text().await.map_err(|e| {
        error!(message = "获取文本响应时失败", error = ?e);
        e
    })?;

    Ok(Value::String(text))
}
