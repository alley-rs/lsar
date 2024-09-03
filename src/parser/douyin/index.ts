import { get } from "~/command";
import { NOT_LIVE } from "..";
import LiveStreamParser from "../base";

type Resolution = "FULL_HD1" | "HD1" | "SD1" | "SD2";

interface RoomInfo {
  data: {
    data: {
      status: 1 | 2;
      title: string;
      stream_url?: {
        flv_pull_url: Record<Resolution, string>;
        hls_pull_url_map: Record<Resolution, string>;
      };
    }[];
    user: {
      nickname: string;
    };
    partition_road_map: {
      // 抖音可能无分类，如 708241921244
      partition?: { title: string };
      sub_partition?: {
        partition: { title: string };
      };
    };
  };
}

class DouyinParser extends LiveStreamParser {
  private headers: Record<string, string>;

  constructor(roomID: number) {
    super(roomID, "https://live.douyin.com/");
    this.headers = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
      "Upgrade-Insecure-Requests": "1",
    };
  }

  async parse(): Promise<ParsedResult | typeof NOT_LIVE | Error> {
    try {
      await this.setupHeaders();
      const info = await this.getRoomInfo();
      return this.parseRoomInfo(info);
    } catch (error) {
      return error instanceof Error ? error : new Error(String(error));
    }
  }

  private async setupHeaders(): Promise<void> {
    const acNonce = await this.getAcNonce();

    this.headers.cookie = `__ac_nonce=${acNonce}`;

    const ttwid = await this.getTtwid();

    this.headers.cookie += `; ttwid=${ttwid}`;
    delete this.headers["Upgrade-Insecure-Requests"];
  }

  private async getAcNonce(): Promise<string> {
    const cookie = await this.getSetCookie();
    const acNonce = cookie.match(/^__ac_nonce=(.*?);/);
    if (!acNonce) throw new Error("cookie 中未获取到 __ac_nonce");
    return acNonce[1];
  }

  private async getTtwid(): Promise<string> {
    const cookie = await this.getSetCookie();
    const ttwid = cookie.match(/^ttwid=(.*?);/);
    if (!ttwid) throw new Error("cookie 中未获取到 ttwid");
    return ttwid[1];
  }

  private async getSetCookie(): Promise<string> {
    const resp = await get(this.roomURL, this.headers);
    const setCookie = (resp.headers as Record<string, string>)["set-cookie"];
    if (!setCookie) throw new Error("未获取到 cookie");
    return setCookie;
  }

  private async getRoomInfo(): Promise<RoomInfo> {
    const url = `https://live.douyin.com/webcast/room/web/enter/?aid=6383&app_name=douyin_web&live_id=1&device_platform=web&language=zh-CN&enter_from=web_live&cookie_enabled=true&screen_width=1728&screen_height=1117&browser_language=zh-CN&browser_platform=MacIntel&browser_name=Chrome&browser_version=116.0.0.0&web_rid=${this.roomID}`;

    const resp = await get<RoomInfo>(url, this.headers);
    return resp.body;
  }

  private parseRoomInfo(info: RoomInfo): ParsedResult | typeof NOT_LIVE {
    const {
      data: { user, data, partition_road_map },
    } = info;

    if (!data[0].stream_url) {
      return NOT_LIVE;
    }

    const { flv_pull_url, hls_pull_url_map } = data[0].stream_url;

    return {
      platform: "douyin",
      anchor: user.nickname,
      title: data[0].title,
      links: [flv_pull_url.FULL_HD1, hls_pull_url_map.FULL_HD1], // NOTE: FULL_HD1 日目前已知的最高清, 不确定 2K 和 4K 的标识
      roomID: this.roomID,
      category:
        partition_road_map.sub_partition?.partition.title ??
        partition_road_map.partition?.title ??
        "",
    };
  }
}

export default function createDouyinParser(input: string): DouyinParser {
  const roomID = parseRoomID(input);
  return new DouyinParser(roomID);
}

function parseRoomID(input: string): number {
  const trimmedInput = input.trim();
  const parsedValue = Number.parseInt(trimmedInput);

  if (!Number.isNaN(parsedValue)) {
    return parsedValue;
  }

  try {
    const url = new URL(trimmedInput);
    const basepath = url.pathname.slice(1);
    return Number.parseInt(basepath);
  } catch {
    throw new Error("Invalid input: not a number or valid URL");
  }
}
