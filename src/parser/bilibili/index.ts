import { debug, get, info } from "~/command";
import { platforms } from "..";

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
    isLogin: boolean;
    uname: string;
  };
}

type VerifyResult = VerifyFailedResult | VerifySuccessResult;

const log_prefix = "bilibili";

class Bilibili {
  baseURL =
    "https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo?protocol=0,1&format=0,1,2&codec=0,1&qn=10000&platform=web&ptype=8&dolby=5&panorama=1&room_id=";
  private readonly pageURL: string = "";
  private cookie: string;
  roomID: number;
  title = "";
  anchor = "";
  category = "";

  constructor(cookie: string, roomID = 0, url = "") {
    if (url.length) {
      this.pageURL = url;
    } else {
      this.pageURL = platforms.bilibili.roomBaseURL + roomID;
    }

    this.cookie = cookie;
    this.roomID = roomID;
  }

  get roomURL(): string {
    return this.baseURL + this.roomID.toString();
  }

  private async verifyCookie() {
    debug(log_prefix, "验证 cookie");
    const url = "https://api.bilibili.com/x/web-interface/nav";
    const { body: data } = await get<VerifyResult>(url, {
      cookie: this.cookie,
    });
    // const data: VerifyResult = await resp.json();
    if (data.code !== 0) {
      return Error(data.message);
    }

    const { uname } = data.data;

    return uname;
  }

  private parseRoomID(html: string) {
    let findResult = html.match(/"defaultRoomId":"(\d+)"/);
    if (!findResult) {
      findResult = html.match(/"roomid":(\d+)/);
    }

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

  private async getRoomInfo() {
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

    if (!this.roomID) {
      this.roomID = this.parseRoomID(html);
    }

    if (!this.title) {
      this.title = this.parseTitle(html);
    }

    if (!this.anchor) {
      this.anchor = this.parseAnchorName(html);
    }

    if (!this.category) {
      this.category = this.parseCategory(html);
    }

    const { body } = await get<Response>(this.roomURL, { cookie: this.cookie });
    if (body.code !== 0) {
      return Error(body.message);
    }

    return body;
  }

  async parse(): Promise<ParsedResult | Error> {
    const username = await this.verifyCookie();
    info(log_prefix, `验证成功，登录的用户:${username}`);

    const res = await this.getRoomInfo();
    if (res instanceof Error) {
      return res;
    }

    const parsedResult: ParsedResult = {
      roomID: this.roomID,
      title: this.title,
      anchor: this.anchor,
      category: this.category,
      links: [],
      platform: "bilibili",
    };

    for (const s of res.data.playurl_info.playurl.stream) {
      for (const fmt of s.format) {
        for (const c of fmt.codec) {
          for (const cdn of c.url_info) {
            const url = cdn.host + c.base_url + cdn.extra;
            parsedResult.links.push(url);
          }
        }
      }
    }

    return parsedResult;
  }
}

export default function bilibili(input: string, cookie: string) {
  let roomID = 0;
  let url: string | undefined = undefined;

  const rid = Number.parseInt(input);
  if (Number.isNaN(rid)) {
    // TODO: 正则验证链接合法性
    url = input;
  } else {
    roomID = rid;
  }

  const d = new Bilibili(cookie, roomID, url);
  return d.parse();
}
