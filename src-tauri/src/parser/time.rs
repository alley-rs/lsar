use std::time::{Duration, SystemTime, UNIX_EPOCH};

use crate::error::{LsarError, LsarResult};

pub(super) fn now() -> LsarResult<Duration> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(LsarError::SystemTime)
}
