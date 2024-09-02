import { debug, get, info } from "~/command";
import { NOT_LIVE, platforms } from "..";

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

class Bilibili {
  private readonly pageURL: string = "";
  private readonly cookie: string;
  private roomID: number;
  private title = "";
  private anchor = "";
  private category = "";

  constructor(cookie: string, roomID = 0, url = "") {
    this.pageURL = url || platforms.bilibili.roomBaseURL + roomID;
    this.cookie = cookie;
    this.roomID = roomID;
  }

  get roomURL(): string {
    return BASE_URL + this.roomID.toString();
  }

  async parse(): Promise<ParsedResult | Error> {
    const username = await this.verifyCookie();
    info(LOG_PREFIX, `验证成功，登录的用户:${username}`);

    const roomInfo = await this.getRoomInfo();
    if (roomInfo instanceof Error) {
      return roomInfo;
    }

    return this.parseRoomInfo(roomInfo);
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
    const html = await this.fetchPageHTML();
    this.parsePageInfo(html);

    const { body } = await get<Response>(this.roomURL, { cookie: this.cookie });
    if (body.code !== 0) {
      // code=0 仅代表请求成功, 不代表请求不合法, 也不代理直播状态
      return Error(body.message);
    }

    return body.data.live_status === 0 ? NOT_LIVE : body;
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

  private parsePageInfo(html: string): void {
    if (!this.roomID) {
      this.roomID = this.parseRoomID(html);
    }
    this.title = this.parseTitle(html);
    this.anchor = this.parseAnchorName(html);
    this.category = this.parseCategory(html);
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

  private parseRoomInfo(res: Response): ParsedResult {
    const links = res.data.playurl_info.playurl.stream.flatMap((s) =>
      s.format.flatMap((fmt) =>
        fmt.codec.flatMap((c) =>
          c.url_info.map((cdn) => cdn.host + c.base_url + cdn.extra),
        ),
      ),
    );

    return {
      roomID: this.roomID,
      title: this.title,
      anchor: this.anchor,
      category: this.category,
      links,
      platform: "bilibili",
    };
  }
}

export default function bilibili(
  input: string,
  cookie: string,
): Promise<ParsedResult | Error> {
  const roomID = Number.parseInt(input);
  // TODO: 正则验证链接合法性
  const url = Number.isNaN(roomID) ? input : undefined;
  const instance = new Bilibili(cookie, roomID || 0, url);
  return instance.parse();
}
