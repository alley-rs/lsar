import { evalResult } from "~/command";
import LiveStreamParser from "../base";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import {
  INVALID_INPUT,
  parseRoomID,
  WRONG_SECOND_LEVEL_DOMAIN,
} from "../utils";

class DouyuParser extends LiveStreamParser {
  constructor(roomID: number) {
    super(roomID, "https://www.douyu.com/");
  }

  async parse(): Promise<ParsedResult | Error> {
    const unlisten = await listen<string>("JS-EVAL", async (e) => {
      const result = eval(e.payload);
      await evalResult(result);
    });

    try {
      const result = await invoke<ParsedResult>("parse_douyu", {
        roomId: this.roomID,
      });
      return result;
    } catch (e) {
      return Error(String(e));
    } finally {
      unlisten();
    }
  }
}

export default function createDouyuParser(
  input: string | number,
): DouyuParser | Error {
  let roomID = parseRoomID(input);
  // 斗鱼的房间号可能在查询参数 rid 中
  if (roomID instanceof Error) {
    if (roomID === WRONG_SECOND_LEVEL_DOMAIN) return roomID;

    const url = new URL(input as string); // roomID 是 NaN，input 一定是字符串
    const rid = url.searchParams.get("rid");
    if (!rid) return roomID;

    roomID = Number(rid);
    if (Number.isNaN(roomID)) return INVALID_INPUT;
  }

  return new DouyuParser(roomID);
}
