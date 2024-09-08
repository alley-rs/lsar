use regex::Regex;
use tauri::AppHandle;
use tauri::Emitter;

use super::constants::DEVICE_ID;
use crate::error::LsarResult;
use crate::eval::EvalError;
use crate::eval::EvalSender;
use crate::eval::EVAL_EVENT;
use crate::parser::time::now;
use crate::utils::md5;

pub struct SignatureGenerator {
    eval_channel_sender: EvalSender,
    app_handle: AppHandle,
}

impl SignatureGenerator {
    pub fn new(eval_channel_sender: EvalSender, app_handle: AppHandle) -> Self {
        SignatureGenerator {
            eval_channel_sender,
            app_handle,
        }
    }

    pub fn extract_signature_function(&self, html: &str) -> LsarResult<String> {
        trace!("Extracting signature function from HTML");

        let re = Regex::new(
            r"var vdwdae325w_64we.*?function ub98484234\(.*?return eval\(strc\)\(.*?\);\}( {4}var .+?=\[.+?\];)?",
        )?;
        let captures = re.captures(html).ok_or_else(|| {
            error!("Failed to extract signature function");
            crate::error::MissKeyFieldError::SignatureFunction
        })?;

        let mut ub98484234 = captures[0].to_string();

        let returned_eval_regex = Regex::new(r"eval\(strc\)\(\w+,\w+,.\w+\);")?;
        ub98484234 = returned_eval_regex
            .replace(&ub98484234, "strc;")
            .to_string();

        debug!("Signature function extracted successfully");
        Ok(ub98484234)
    }

    pub async fn generate_params(
        &self,
        room_id: u64,
        signature_function: &str,
    ) -> LsarResult<String> {
        trace!("Generating signature params");

        let timestamp = now()?.as_secs();

        let x = format!(
            "{}ub98484234({}, {}, {})",
            signature_function, room_id, DEVICE_ID, timestamp
        );
        let eval_result = self.wait_eval_result(&x).await?;

        // FIXME: 这里的数字可能是日期
        let random_number = Regex::new(r"\d{12}")?
            .captures(&eval_result)
            .ok_or_else(|| {
                error!("Failed to extract random number from eval result");
                crate::error::MissKeyFieldError::RandomNumber
            })?[0]
            .to_string();

        let md5_input = format!("{}{}{}{}", room_id, DEVICE_ID, timestamp, random_number);
        let md5_result = md5(md5_input).await;

        let modified_function = eval_result.replace(
            "CryptoJS.MD5(cb).toString()",
            &format!("\"{}\"", md5_result),
        );
        let modified_function =
            modified_function[..modified_function.rfind(')').unwrap() + 1].to_string();

        let signature_call = format!(
            "{}({}, \"{}\", {})",
            modified_function, room_id, DEVICE_ID, timestamp
        );
        let signature_params = self.wait_eval_result(&signature_call).await?;

        debug!("Signature params generated successfully");
        Ok(signature_params)
    }

    async fn wait_eval_result(&self, x: &str) -> LsarResult<String> {
        trace!("Waiting for eval result");

        let (tx, rx) = tokio::sync::oneshot::channel();

        {
            let mut sender = self.eval_channel_sender.lock().await;
            *sender = Some(tx);
        }

        self.app_handle
            .emit(EVAL_EVENT, x)
            .expect("failed to emit event");

        let result = rx.await.map_err(|e| {
            error!("Failed to receive eval result: {}", e);
            EvalError::ChannelReceiveError
        })?;

        trace!("Eval result received successfully");
        Ok(result)
    }
}
