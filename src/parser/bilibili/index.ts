import { debug, get, info } from "~/command";
import { NOT_LIVE, platforms } from "..";
import LiveStreamParser from "../base";

interface CDNItem {
  host: string;
  extra: string;
}

interface CodecItem {
  accept_qn: number[];
  base_url: string;
  current_qn: number;
  url_info: CDNItem[];
}

interface FormatItem {
  codec: CodecItem[];
  format_name: string;
}

interface StreamItem {
  format: FormatItem[];
}

interface Response {
  code: number;
  message: string;
  data: {
    live_status: 0 | 1; // 0 未播, 1 正在直播
    playurl_info: {
      playurl: {
        stream: StreamItem[];
      };
    };
  };
}

interface VerifyFailedResult {
  code: -101;
  message: string;
  data: {
    isLogin: false;
  };
}

interface VerifySuccessResult {
  code: 0;
  message: string;
  data: {
    isLogin: true;
    uname: string;
  };
}

type VerifyResult = VerifyFailedResult | VerifySuccessResult;

const LOG_PREFIX = "bilibili";
const BASE_URL =
  "https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo?protocol=0,1&format=0,1,2&codec=0,1&qn=10000&platform=web&ptype=8&dolby=5&panorama=1&room_id=";
const VERIFY_URL = "https://api.bilibili.com/x/web-interface/nav";

class BilibiliParser extends LiveStreamParser {
  private readonly pageURL: string = "";
  private readonly cookie: string;

  constructor(cookie: string, roomID = 0, url = "") {
    super(roomID, BASE_URL);
    this.pageURL = url || platforms.bilibili.roomBaseURL + roomID;
    this.cookie = cookie;
  }

  async parse(): Promise<ParsedResult | Error> {
    const username = await this.verifyCookie();
    info(LOG_PREFIX, `验证成功，登录的用户:${username}`);

    const html = await this.fetchPageHTML();
    const pageInfo = this.parsePageInfo(html);

    const roomInfo = await this.getRoomInfo();
    if (roomInfo instanceof Error) {
      return roomInfo;
    }

    return this.parseRoomInfo(pageInfo, roomInfo);
  }

  private async verifyCookie() {
    debug(LOG_PREFIX, "验证 cookie");
    const { body: data } = await get<VerifyResult>(VERIFY_URL, {
      cookie: this.cookie,
    });
    if (data.code !== 0) {
      return Error(data.message);
    }

    return data.data.uname;
  }

  private async getRoomInfo() {
    const { body } = await get<Response>(this.roomURL, { cookie: this.cookie });
    if (body.code !== 0) {
      // code=0 仅代表请求成功, 不代表请求不合法, 也不代理直播状态
      return Error(body.message);
    }

    return body.data.live_status === 0 ? NOT_LIVE : body;
  }

  private parsePageInfo(html: string): {
    title: string;
    anchor: string;
    category: string;
  } {
    if (!this.roomID) {
      this.roomID = this.parseRoomID(html);
    }

    return {
      title: this.parseTitle(html),
      anchor: this.parseAnchorName(html),
      category: this.parseCategory(html),
    };
  }

  private async fetchPageHTML(): Promise<string> {
    const { body: html } = await get<string>(this.pageURL, {
      Host: "live.bilibili.com",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:102.0) Gecko/20100101 Firefox/102.0",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "zh-CN",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      DNT: "1",
      "Sec-GPC": "1",
    });
    return html;
  }

  private parseRoomInfo(
    pageInfo: {
      title: string;
      anchor: string;
      category: string;
    },
    info: Response,
  ): ParsedResult {
    const links = this.parseLinks(info);
    return {
      ...pageInfo,
      platform: "bilibili",
      links,
      roomID: this.roomID,
    };
  }

  private parseLinks(info: Response): string[] {
    const {
      data: {
        playurl_info: {
          playurl: { stream },
        },
      },
    } = info;

    const links = stream.flatMap((s) =>
      s.format.flatMap((fmt) =>
        fmt.codec.flatMap((c) =>
          c.url_info.map((cdn) => cdn.host + c.base_url + cdn.extra),
        ),
      ),
    );

    return links;
  }

  private parseRoomID(html: string) {
    const findResult =
      html.match(/"defaultRoomId":"(\d+)"/) || html.match(/"roomid":(\d+)/);
    if (!findResult) throw Error("未找到房间 id");
    return Number(findResult[1]);
  }

  private parseTitle(html: string) {
    const findResult = html.match(/"title":"(.+?)"/);
    if (!findResult) throw Error("未找到标题");
    return findResult[1];
  }

  private parseAnchorName(html: string) {
    const findResult = html.match(/\{"uname":"(.+?)"/);
    if (!findResult) throw Error("未找到主播名");
    return findResult[1];
  }

  private parseCategory(html: string) {
    const findResult = html.match(/"area_name":"(.+?)"/);
    if (!findResult) throw Error("未找到分类");
    return findResult[1];
  }
}

export default function createBilibiliParser(
  input: string,
  cookie: string,
): BilibiliParser {
  const roomID = Number.parseInt(input);
  // TODO: 正则验证链接合法性
  const url = Number.isNaN(roomID) ? input : undefined;
  return new BilibiliParser(cookie, roomID || 0, url);
}
