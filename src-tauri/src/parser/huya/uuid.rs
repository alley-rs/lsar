use crate::{error::LsarResult, parser::time::now};

pub(super) struct UuidGenerator;

impl UuidGenerator {
    pub(super) fn new_uuid() -> LsarResult<u128> {
        trace!("Generating new UUID");
        let now = now()?.as_millis();
        let rand = rand::random::<u128>() % 1000;
        Ok(((now % 10_000_000_000) * 1000 + rand) % 4_294_967_295)
    }
}
