import LiveStreamParser from "../base";
import { invoke } from "@tauri-apps/api/core";

class BilibiliParser extends LiveStreamParser {
  cookie: string;
  url: string;
  constructor(cookie: string, roomID = 0, url = "") {
    super(roomID, "");
    this.cookie = cookie;
    this.url = url;
  }

  async parse(): Promise<ParsedResult | Error> {
    try {
      const result = await invoke<ParsedResult>("parse_bilibili", {
        roomId: this.roomID,
        cookie: this.cookie,
        url: this.url || null,
      });
      return result;
    } catch (e) {
      return Error(String(e));
    }
  }
}

export default function createBilibiliParser(
  input: string | number,
  cookie: string,
) {
  let roomID: number | undefined = undefined;
  let url: string | undefined = undefined;

  if (typeof input === "number") roomID = input;
  else url = input;

  return new BilibiliParser(cookie, roomID, url);
}
