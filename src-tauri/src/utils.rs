use md5::{Digest, Md5};

#[tauri::command]
pub async fn md5(text: String) -> String {
    let mut hasher = Md5::new();
    hasher.update(&text);
    let result = hasher.finalize();
    // let bytes: &[u8] = &result[..];
    // debug!("md5 bytes: {:?}", bytes);
    //     bytes
    //         .iter()
    //         .map(|b| format!("{:02x}", b).to_string())
    //         .collect::<String>()
    format!("{:x}", result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_md5() {
        let text = "Hello world".to_string();
        let expected_hash = "3e25960a79dbc69b674cd4ec67a72c62";
        assert_eq!(md5(text).await, expected_hash);
    }
}
