import {
  computeMD5,
  debug,
  error,
  get,
  info,
  post,
  trace,
  warn,
} from "~/command";
import { NOT_LIVE } from "..";
import LiveStreamParser from "../base";

const LOG_PREFIX = "douyu";
const DID = "10000000000000000000000000001501";
const NOT_LIVING_STATE = "房间未开播";
const INVALID_REQUEST = "非法请求";

interface Info {
  error?: number;
  msg: string;
  data: {
    rtmp_url: string;
    rtmp_live?: string;
  };
}

interface MobileResponse {
  error: number;
  msg: string;
  data: {
    url: string;
  };
}

class DouyuParser extends LiveStreamParser {
  private isPost = true;
  private ub98484234Reg = new RegExp(
    /var vdwdae325w_64we.*?function ub98484234\(.*?return eval\(strc\)\(.*?\);\}/,
  );

  private finalRoomID = 0;
  private signFunc = "";
  private anchor = "";
  private title = "";
  private category = "";

  constructor(roomID: string) {
    super(parseRoomID(roomID), "https://www.douyu.com/");
  }

  async parse(): Promise<ParsedResult | typeof NOT_LIVE | Error> {
    try {
      const params = await this.getRequestParams();
      if (params instanceof Error) return params;

      const info = await this.getRoomInfo(params);
      return this.parseRoomInfo(info);
    } catch (error) {
      return error instanceof Error ? error : new Error(String(error));
    }
  }

  async getRoomInfo(params: string): Promise<Info | null | Error> {
    let url = "";
    let resp: HTTPResponse<Info>;
    if (this.isPost) {
      url = `https://www.douyu.com/lapi/live/getH5Play/${this.finalRoomID}`;
      resp = await post(url, params);

      if (!resp) {
        warn(LOG_PREFIX, "POST 请求未功能获得响应，更换 GET 请求重试");
        return null;
      }
    } else {
      url = `https://playweb.douyu.com/lapi/live/getH5Play/${this.finalRoomID}?${params}`;
      resp = await get(url);
      if (!resp) {
        warn(LOG_PREFIX, "GET 请求未功能获得响应，更换 POST 请求重试");
        return null;
      }
    }

    const info = resp.body;

    if ("error" in resp) {
      if (info.msg === NOT_LIVING_STATE) {
        error(LOG_PREFIX, `${this.roomID} ${NOT_LIVING_STATE}`);
        return Error(`${this.roomID} ${NOT_LIVING_STATE}`);
      }

      if (info.msg === INVALID_REQUEST) {
        error(LOG_PREFIX, INVALID_REQUEST);
      }
    }

    return info;
  }

  private createParams(ts: number): string {
    const signFunc = `${this.signFunc}(${this.finalRoomID},"${DID}",${ts})`;
    return eval(signFunc) as string;
  }

  private async getRequestParams(): Promise<string | Error> {
    if (!this.signFunc) {
      const html = await this.getRoomPage();

      const r = html.match(/\$ROOM.room_id = ?(\d+);/);
      if (r) {
        this.finalRoomID = Number(r[1]);
        info(LOG_PREFIX, `在网页中解析到最终房间 id：${this.finalRoomID}`);
      } else {
        const closed = html.match(
          /<span><p>您观看的房间已被关闭，请选择其他直播进行观看哦！<\/p><\/span>/,
        );
        if (closed) {
          return Error("您观看的房间已被关闭，请选择其他直播进行观看哦！");
        }
      }

      const signFunc = await this.matchSignFunc(html);
      if (signFunc instanceof Error) {
        return signFunc;
      }

      this.signFunc = signFunc;

      this.anchor = this.parseAnchorName(html);
      this.title = this.parseTitle(html);
      this.category = this.parseCategory(html);
    }

    const ts = Math.floor(new Date().getTime() / 1e3);
    const params = this.createParams(ts);
    debug(LOG_PREFIX, `请求参数：${params}`);
    return params;
  }

  private async matchSignFunc(html: string) {
    const matchResult = html.match(this.ub98484234Reg);
    if (matchResult == null) {
      if (html.indexOf('<div class="error">') > -1) {
        const errorMatch = html.match(/<span><p>(.+?)<\/p><\/span>/);
        if (errorMatch) {
          return Error(errorMatch[1]);
        }
      }

      throw Error("没找到函数 ub98484234");
    }

    let ub98484234 = matchResult[0];
    ub98484234 = ub98484234.replace(/eval\(strc\)\(\w+,\w+,.\w+\);/, "strc;");
    const ts = Math.floor(new Date().getTime() / 1e3);
    const ub98484234Call = `ub98484234(${this.finalRoomID}, ${DID}, ${ts})`;
    let signFunc = "";
    try {
      signFunc = eval(ub98484234 + ub98484234Call) as string;
    } catch (e) {
      const slices = (e as Error).message.split(" ");
      if (slices[slices.length - 1] === "defined") {
        const lossStr = `/var ${slices[0]}=.*?];/`;
        const lossReg = new RegExp(eval(lossStr) as string);
        const matchResult = html.match(lossReg);
        if (matchResult == null) throw Error("没找到函数 ub98484234");

        signFunc = eval(ub98484234 + matchResult[0] + ub98484234Call) as string;
      }
    }

    if (!signFunc) {
      return Error(`此房间未获取到 signFunc, 可能未直播: ${this.roomID}`);
    }

    const v = signFunc.match(/\w{12}/)!;

    const md5 = await computeMD5(`${this.finalRoomID}${DID}${ts}${v[0]}`);
    signFunc = signFunc.replace(
      /CryptoJS\.MD5\(cb\)\.toString\(\)/,
      `"${md5}"`,
    );
    signFunc = `${signFunc.split("return rt;})")[0]}return rt;})`;
    trace(LOG_PREFIX, signFunc);
    return signFunc;
  }

  private async parseRoomInfo(
    info: Info | null | Error,
  ): Promise<ParsedResult | Error> {
    if (info instanceof Error) {
      throw info;
    }

    if (
      !info ||
      (info && info.error !== -15 && info.data.rtmp_live === undefined)
    ) {
      error(LOG_PREFIX, `${this.finalRoomID} 房间未开播`);
      return NOT_LIVE;
    }

    const links = [`${info!.data.rtmp_url}/${info!.data.rtmp_live}`];

    const mobileStreamUrl = await this.getMobileStream(
      this.createParams(Math.floor(Date.now() / 1000)),
    );
    if (mobileStreamUrl) {
      links.push(mobileStreamUrl);
    }

    return {
      platform: "douyu",
      title: this.title,
      anchor: this.anchor,
      roomID: this.finalRoomID,
      category: this.category,
      links,
    };
  }

  private parseAnchorName(html: string): string {
    const anchor = html.match(/<div class="Title-anchorName" title="(.+?)">/);
    if (!anchor) {
      throw Error("未找到主播名");
    }
    return anchor[1];
  }

  private parseCategory(html: string): string {
    const category = html.match(
      /<span class="Title-categoryArrow"><\/span><a class="Title-categoryItem" href=".+?" target="_blank" title="(.+?)">/,
    );
    if (!category) {
      return "";
    }
    return category[1];
  }

  private parseTitle(html: string): string {
    const title = html.match(/<h3 class="Title-header">(.+?)<\/h3>/);
    if (!title) {
      throw Error("未找到标题");
    }
    return title[1];
  }

  async params(): Promise<string | Error> {
    if (!this.signFunc) {
      const html = await this.getRoomPage();

      const r = html.match(/\$ROOM.room_id = ?(\d+);/); // 有的房间号前有1个空格, 有的无空格
      if (r) {
        debug(LOG_PREFIX, `正则查找房间 id 结果：${r[1]}`);
        this.finalRoomID = Number(r[1]);

        info(LOG_PREFIX, `在网页中解析到最终房间 id：${this.finalRoomID}`);
      } else {
        const closed = html.match(
          /<span><p>您观看的房间已被关闭，请选择其他直播进行观看哦！<\/p><\/span>/,
        );
        if (closed) {
          return Error("您观看的房间已被关闭，请选择其他直播进行观看哦！");
        }
      }

      const signFunc = await this.matchSignFunc(html);
      if (signFunc instanceof Error) {
        return signFunc;
      }

      this.signFunc = signFunc;

      const anchor = html.match(/<div class="Title-anchorName" title="(.+?)">/);
      this.anchor = anchor![1];

      const title = html.match(/<h3 class="Title-header">(.+?)<\/h3>/);
      this.title = title![1];

      const category = html.match(
        /<span class="Title-categoryArrow"><\/span><a class="Title-categoryItem" href=".+?" target="_blank" title="(.+?)">/,
      );
      this.category = category![1];
    }

    const ts = Math.floor(new Date().getTime() / 1e3);
    const params = this.createParams(ts);
    debug(LOG_PREFIX, `请求参数：${params}`);

    return params;
  }

  private async getRoomPage() {
    debug("当前房间链接：", this.roomURL);

    const resp = await get<string>(this.roomURL, {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0",
    });

    return resp.body;
  }

  private async getMobileStream(params: string): Promise<string | undefined> {
    const url = "https://m.douyu.com/hgapi/livenc/room/getStreamUrl";
    const { body: mr } = await post<MobileResponse>(
      url,
      `${params}&rid=${String(this.finalRoomID)}&rate=-1`,
    );
    if (!mr) {
      return;
    }

    if (mr.error !== 0) {
      error("获取手机播放流出错：", mr.msg);
      return;
    }

    return mr.data.url;
  }
}

const parseRoomID = (input: string): number => {
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
};

export default function createDouyuParser(input: string) {
  return new DouyuParser(input);
}
