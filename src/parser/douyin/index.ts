import { get } from "~/command";

type Resolution = "FULL_HD1" | "HD1" | "SD1" | "SD2";

interface RoomInfo {
  data: {
    data: {
      status: 1 | 2;
      title: string;
      stream_url: {
        flv_pull_url: Record<Resolution, string>;
        hls_pull_url_map: Record<Resolution, string>;
      };
    }[];
    user: {
      nickname: string;
    };
    partition_road_map: {
      partition: { title: string };
      sub_partition?: {
        partition: { title: string };
      };
    };
  };
}

export class Douyin {
  baseURL = "https://live.douyin.com/";

  headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
    "Upgrade-Insecure-Requests": "1",
  };
  roomID: number;

  constructor(roomID: number) {
    this.roomID = roomID;
  }

  get roomURL(): string {
    return this.baseURL + this.roomID.toString();
  }

  private async getSetCookie() {
    const resp = await get(this.roomURL, this.headers);
    const respHeader = resp.headers as Record<string, string>;

    const setCookie = respHeader["set-cookie"];
    if (!setCookie) {
      return Error("未获取到 cookie");
    }

    return setCookie;
  }

  private async getAcNonce() {
    const cookie = await this.getSetCookie();
    if (cookie instanceof Error) {
      return cookie;
    }

    const acNonceRegex = /^__ac_nonce=(.*?);/;
    const acNonce = acNonceRegex.exec(cookie);
    if (!acNonce) {
      return Error("cookie 中未获取到 __ac_nonce");
    }

    return acNonce[1];
  }

  private async getTtwid() {
    const cookie = await this.getSetCookie();
    if (cookie instanceof Error) {
      return cookie;
    }

    const ttwidRegex = /^ttwid=(.*?);/;
    const ttwid = ttwidRegex.exec(cookie);
    if (!ttwid) {
      return Error("cookie 中未获取到 ttwid");
    }

    return ttwid[1];
  }

  private async getRoomInfo(): Promise<RoomInfo> {
    const url = `https://live.douyin.com/webcast/room/web/enter/?aid=6383&app_name=douyin_web&live_id=1&device_platform=web&language=zh-CN&enter_from=web_live&cookie_enabled=true&screen_width=1728&screen_height=1117&browser_language=zh-CN&browser_platform=MacIntel&browser_name=Chrome&browser_version=116.0.0.0&web_rid=${this.roomID}`;

    const resp = await get<RoomInfo>(url, this.headers);
    return resp.body;
  }

  async parse() {
    const acNonce = await this.getAcNonce();
    if (acNonce instanceof Error) {
      return acNonce;
    }

    this.headers.cookie = `__ac_nonce=${acNonce}`;

    const ttwid = await this.getTtwid();
    if (ttwid instanceof Error) {
      return ttwid;
    }

    this.headers.cookie = `ttwid=${ttwid}`;
    this.headers.Accept = "*/*";
    this.headers.Host = "live.douyin.com";
    this.headers.Connection = "keep-alive";
    delete this.headers["Upgrade-Insecure-Requests"];

    const {
      data: { user, data, partition_road_map },
    } = await this.getRoomInfo();

    const { flv_pull_url, hls_pull_url_map } = data[0].stream_url;

    const parsedResult: ParsedResult = {
      platform: "douyin",
      anchor: user.nickname,
      title: data[0].title,
      links: [flv_pull_url.FULL_HD1, hls_pull_url_map.FULL_HD1], // NOTE: FULL_HD1 日目前已知的最高清, 不确定 2K 和 4K 的标识
      roomID: this.roomID,
      category:
        partition_road_map.sub_partition?.partition.title ||
        partition_road_map.partition.title,
    };

    return parsedResult;
  }
}

export default function douyin(input: string) {
  let roomID: number;
  const value = Number.parseInt(input.trim());
  if (Number.isNaN(value)) {
    const u = new URL(input);
    const basepath = u.pathname.slice(1);
    const rid = Number.parseInt(basepath);
    roomID = rid;
  } else {
    roomID = value;
  }

  const p = new Douyin(roomID);
  return p.parse();
}
