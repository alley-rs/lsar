use regex::Regex;

use crate::{error::LsarResult, parser::http_client::HttpClient};

pub async fn get_set_cookie(client: &HttpClient, url: &str) -> LsarResult<String> {
    trace!("Entering get_set_cookie function");
    let resp = client.get(url).await?;
    let cookies = resp
        .headers()
        .get("set-cookie")
        .ok_or_else(|| {
            error!("Set-Cookie header not found in response");
            "Set-Cookie header not found"
        })?
        .to_str()
        .unwrap()
        .to_string();
    debug!("Set-Cookie header fetched successfully: {}", cookies);
    Ok(cookies)
}

pub async fn get_ac_nonce(client: &HttpClient, url: &str) -> LsarResult<String> {
    trace!("Entering get_ac_nonce function");
    let cookies = get_set_cookie(client, url).await?;

    trace!("Extracting __ac_nonce from cookies");
    let re = Regex::new(r"__ac_nonce=(.*?);")?;
    let ac_nonce = re
        .captures(&cookies)
        .ok_or_else(|| {
            error!("__ac_nonce not found in cookies");
            "__ac_nonce not found in cookies"
        })?
        .get(1)
        .ok_or_else(|| {
            error!("__ac_nonce capture group not found");
            "__ac_nonce capture group not found"
        })?
        .as_str()
        .to_string();
    debug!("__ac_nonce extracted successfully");
    Ok(ac_nonce)
}

pub async fn get_ttwid(client: &HttpClient, url: &str) -> LsarResult<String> {
    trace!("Entering get_ttwid function");
    let cookies = get_set_cookie(client, url).await?;
    let re = Regex::new(r"ttwid=(.*?);")?;
    let ttwid = re
        .captures(&cookies)
        .ok_or_else(|| {
            error!("ttwid not found in cookies");
            "ttwid not found in cookies"
        })?
        .get(1)
        .ok_or_else(|| {
            error!("ttwid capture group not found");
            "ttwid capture group not found"
        })?
        .as_str()
        .to_string();
    debug!("ttwid extracted successfully");
    Ok(ttwid)
}

pub fn parse_room_id(input: &str) -> LsarResult<u64> {
    debug!("Parsing room ID from input: {}", input);
    let room_id = input.parse::<u64>()?;
    debug!("Room ID parsed successfully: {}", room_id);
    Ok(room_id)
}
