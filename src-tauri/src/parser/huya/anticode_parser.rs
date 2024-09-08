use base64::{prelude::BASE64_STANDARD, Engine};

use crate::error::LsarResult;

pub(super) struct AnticodeParser;

impl AnticodeParser {
    pub(super) fn parse_fm(
        fm: &str,
        uid: &str,
        stream_name: &str,
        ss: &str,
        ws_time: &str,
    ) -> LsarResult<String> {
        trace!("Parsing FM");
        Ok(String::from_utf8(BASE64_STANDARD.decode(fm).unwrap())
            .unwrap()
            .replace("$0", uid)
            .replace("$1", stream_name)
            .replace("$2", ss)
            .replace("$3", ws_time))
    }
}
