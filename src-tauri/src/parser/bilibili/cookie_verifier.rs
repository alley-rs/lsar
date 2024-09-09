use reqwest::Client;
use serde::Deserialize;
use serde_json::Value;

use crate::error::LsarResult;

const VERIFY_URL: &str = "https://api.bilibili.com/x/web-interface/nav";

#[derive(Debug, Deserialize)]
#[serde(rename_all(deserialize = "camelCase"))]
struct VerifyData {
    uname: Option<String>,
}

#[derive(Debug, Deserialize)]
struct VerifyResponse {
    code: i32,
    message: String,
    data: VerifyData,
}

pub struct CookieVerifier<'a> {
    client: &'a Client,
    cookie: &'a str,
}

impl<'a> CookieVerifier<'a> {
    pub fn new(client: &'a Client, cookie: &'a str) -> Self {
        CookieVerifier { client, cookie }
    }

    pub async fn verify(&self) -> LsarResult<String> {
        debug!("Starting cookie verification process");

        let response_value = self
            .client
            .get(VERIFY_URL)
            .header("Cookie", self.cookie)
            .send()
            .await?
            .json::<Value>()
            .await?;

        debug!("Cookie verification result: {}", response_value);

        let response: VerifyResponse = serde_json::from_value(response_value)?;

        if response.code != 0 {
            let err_msg = format!("Cookie verification failed: {}", response.message);
            error!("{}. Response code: {}", err_msg, response.code);

            // -101 未登录
            if response.code == -101 && response.message == "账号未登录" {
                return Err("账号未登录，cookie 未设置或已失效".into());
            }

            return Err(err_msg.into());
        }

        let username = response.data.uname.ok_or_else(|| {
            let err_msg = "Username not found in verification response";
            error!("{}", err_msg);
            err_msg
        })?;

        debug!("Cookie verification successful for user: {}", username);
        Ok(username)
    }
}
