use std::collections::HashMap;

use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all(serialize = "camelCase"))]
pub(super) struct LoginRequest {
    app_id: i32,
    by_pass: i32,
    context: String,
    version: String,
    data: HashMap<String, String>,
}

impl LoginRequest {
    pub(super) fn new() -> Self {
        trace!("Creating new LoginRequest");
        LoginRequest {
            app_id: 5002,
            by_pass: 3,
            context: "".to_string(),
            version: "2.4".to_string(),
            data: HashMap::new(),
        }
    }
}
