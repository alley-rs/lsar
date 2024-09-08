use std::collections::HashMap;

use url::Url;

use crate::error::LsarResult;

pub(super) struct UrlParser;

impl UrlParser {
    pub(super) fn parse_query(code: &str) -> LsarResult<HashMap<String, Vec<String>>> {
        trace!("Parsing URL query");
        Ok(Url::parse(&format!("http://example.com?{}", code))?
            .query_pairs()
            .into_iter()
            .map(|(k, v)| (k.into_owned(), vec![v.into_owned()]))
            .collect())
    }
}
