import LiveStreamParser from "../base";
import { invoke } from "@tauri-apps/api/core";

class HuyaParser extends LiveStreamParser {
  baseURL = "https://m.huya.com/";
  url: string;

  constructor(roomID: number, url = "") {
    super(roomID, "https://m.huya.com/");
    this.url = url;
  }

  async parse(): Promise<ParsedResult | Error> {
    try {
      const result = await invoke<ParsedResult>("parse_huya", {
        roomId: this.roomID || null,
        url: this.url,
      });
      return result;
    } catch (error) {
      return error instanceof Error ? error : new Error(String(error));
    }
  }
}

export default function createHuyaParser(
  input: string | number,
): HuyaParser | Error {
  let roomID: number | undefined = undefined;
  let url: string | undefined = undefined;

  if (typeof input === "number") roomID = input;
  else url = input;

  return new HuyaParser(roomID || 0, url);
}
