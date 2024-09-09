import LiveStreamParser from "../base";
import { parseRoomID } from "../utils";
import { invoke } from "@tauri-apps/api/core";

class DouyinParser extends LiveStreamParser {
  constructor(roomID: number) {
    super(roomID, "https://live.douyin.com/");
  }

  async parse(): Promise<ParsedResult | Error> {
    try {
      const result = await invoke<ParsedResult>("parse_douyin", {
        roomId: this.roomID,
      });
      return result;
    } catch (e) {
      return Error(String(e));
    }
  }
}

export default function createDouyinParser(input: string | number) {
  const roomID = parseRoomID(input);
  if (roomID instanceof Error) return roomID;

  return new DouyinParser(roomID);
}
