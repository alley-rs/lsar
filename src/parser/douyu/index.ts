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

const log_prefix = "douyu";

const did = "10000000000000000000000000001501";

interface Info {
  error?: number;
  msg: string;
  data: {
    rtmp_url: string;
    rtmp_live?: string;
  };
}

// interface MobileResponse {
//   error: number;
//   msg: string;
//   data: {
//     url: string;
//   };
// }

const infoString = (info: Info): string => {
  const {
    error,
    msg,
    data: { rtmp_url, rtmp_live },
  } = info;
  return JSON.stringify({
    error,
    msg,
    rtmp_url,
    rtmp_live,
  });
};

const NOT_LIVING_STATE = "房间未开播";
const INVALID_REQUEST = "非法请求";

class Douyu {
  roomID: string;

  private isPost = true;
  private ub98484234Reg = new RegExp(
    /var vdwdae325w_64we.*?function ub98484234\(.*?return eval\(strc\)\(.*?\);\}/
  );
  private finalRoomID = 0;
  private signFunc = "";

  baseURL = "https://www.douyu.com/";

  anchor = "";
  title = "";
  category = "";

  constructor(input: string) {
    const value = input.trim();
    if (Number.isNaN(Number.parseInt(value))) {
      const u = new URL(input);
      const basepath = u.pathname.slice(1);
      const rid = Number.parseInt(basepath);
      if (Number.isNaN(rid)) {
        this.roomID = u.searchParams.get("rid")!;
      } else {
        this.roomID = basepath;
      }
    } else {
      this.roomID = value;
    }
  }

  get roomURL(): string {
    return this.baseURL + this.roomID;
  }

  async getRoomInfo(params: string): Promise<Info | null | Error> {
    let url = "";
    let resp: object | undefined;
    if (this.isPost) {
      url = `https://www.douyu.com/lapi/live/getH5Play/${this.finalRoomID}`;
      resp = await post<object>(url, params);

      if (!resp) {
        warn(log_prefix, "POST 请求未功能获得响应，更换 GET 请求重试");
        return null;
      }
    } else {
      url = `https://playweb.douyu.com/lapi/live/getH5Play/${this.finalRoomID}?${params}`;
      resp = await get<object>(url);
      if (!resp) {
        warn(log_prefix, "GET 请求未功能获得响应，更换 POST 请求重试");
        return null;
      }
    }

    const info = resp as Info;

    debug("有效响应体：", infoString(info));

    if ("error" in info) {
      if (info.msg === NOT_LIVING_STATE) {
        error(log_prefix, `${this.roomID} ${NOT_LIVING_STATE}`);
        return Error(`${this.roomID} ${NOT_LIVING_STATE}`);
      }

      if (info.msg === INVALID_REQUEST) {
        error(log_prefix, INVALID_REQUEST);
      }
    }

    return info;
  }

  private createParams(ts: number): string {
    const signFunc = `${this.signFunc}(${this.finalRoomID},"${did}",${ts})`;
    return eval(signFunc) as string;
  }

  private async matchSignFunc(html: string) {
    const matchResult = html.match(this.ub98484234Reg);
    if (matchResult == null) throw Error("没找到函数 ub98484234");

    let ub98484234 = matchResult[0];
    ub98484234 = ub98484234.replace(/eval\(strc\)\(\w+,\w+,.\w+\);/, "strc;");
    const ts = Math.floor(new Date().getTime() / 1e3);
    const ub98484234Call = `ub98484234(${this.finalRoomID}, ${did}, ${ts})`;
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
    const v = signFunc.match(/\w{12}/)!;

    const md5 = await computeMD5(`${this.finalRoomID}${did}${ts}${v[0]}`);
    signFunc = signFunc.replace(
      /CryptoJS\.MD5\(cb\)\.toString\(\)/,
      `"${md5}"`
    );
    signFunc = `${signFunc.split("return rt;})")[0]}return rt;})`;
    trace(log_prefix, signFunc);
    return signFunc;
  }

  private async series(params: string) {
    const info = await this.getRoomInfo(params);
    return info;
  }

  async params(): Promise<string | Error> {
    if (!this.signFunc) {
      const html = await this.getRoomPage();

      const r = html.match(/\$ROOM.room_id = ?(\d+);/); // 有的房间号前有1个空格, 有的无空格
      if (r) {
        debug(log_prefix, `正则查找房间 id 结果：${r[1]}`);
        this.finalRoomID = Number(r[1]);

        info(log_prefix, `在网页中解析到最终房间 id：${this.finalRoomID}`);
      } else {
        const closed = html.match(
          /<span><p>您观看的房间已被关闭，请选择其他直播进行观看哦！<\/p><\/span>/
        );
        if (closed) {
          return Error("您观看的房间已被关闭，请选择其他直播进行观看哦！");
        }
      }

      this.signFunc = await this.matchSignFunc(html);

      const anchor = html.match(/<div class="Title-anchorName" title="(.+?)">/);
      this.anchor = anchor![1];

      const title = html.match(/<h3 class="Title-header">(.+?)<\/h3>/);
      this.title = title![1];

      const category = html.match(
        /<span class="Title-categoryArrow"><\/span><a class="Title-categoryItem" href=".+?" target="_blank" title="(.+?)">/
      );
      console.log(category);
      this.category = category![1];
    }

    const ts = Math.floor(new Date().getTime() / 1e3);
    const params = this.createParams(ts);
    debug(log_prefix, `请求参数：${params}`);

    return params;
  }

  async parse() {
    /*
            码率或清晰度
                - 900 高清
                - 2000 超清
                - 4000 蓝光 4 M
                - 更高 主播可以自己设置更高的码率，没有固定值，但是可以获取到具体值，使用flv名不加码率时会自动使用最高码率播放
            添加码率后的文件名为 {name}_{bit}.flv 或 {name}_{bit}.xs，
            不添加码率就会播放最高码率
        */
    const params = await this.params();
    if (params instanceof Error) {
      return params;
    }

    let info = await this.series(params);
    if (info instanceof Error) {
      return info;
    }

    if (info && info.error !== -15) {
      if (info.data.rtmp_live === undefined) {
        error(log_prefix, `${this.finalRoomID} 房间未开播`);
        return Error(`${this.finalRoomID} 房间未开播`);
      }
    } else {
      /*
               斗鱼每个房间获取房间信息的请求方式随机变换，GET 和 POST 都有可能，
               所以这里请求失败时修改，但也只修改一次请求方式，如果仍失败就需要重新执行
            */
      this.isPost = !this.isPost;
      info = await this.series(params);
      if (!info) {
        error(
          log_prefix,
          "更换请求方式、生成新请求参数后仍未得到正确响应，请重新运行几次程序"
        );
        return;
      }

      if (info instanceof Error) {
        return info;
      }

      if (info.data.rtmp_live === undefined) {
        error(log_prefix, `${this.finalRoomID} 房间未开播`);
        return Error(`${this.finalRoomID} 房间未开播`);
      }
    }

    return {
      title: this.title,
      anchor: this.anchor,
      roomID: this.finalRoomID,
      category: this.category,
      links: [`${info!.data.rtmp_url}/${info!.data.rtmp_live}`],
    };
  }

  private async getRoomPage() {
    debug("当前房间链接：", this.roomURL);

    const resp = await get<string>(this.roomURL, {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0",
    });
    return resp;
  }

  //   private async getMobileStream(params: string): Promise<string | undefined> {
  //     const url = "https://m.douyu.com/hgapi/livenc/room/getStreamUrl";
  //     const resp = await post<object>(
  //       url,
  //       `${params}&rid=${String(this.finalRoomID)}&rate=-1`
  //     );
  //     if (!resp) {
  //       return;
  //     }

  //     const mr = resp as MobileResponse;

  //     if (mr.error !== 0) {
  //       error("获取手机播放流出错：", mr.msg);
  //       return;
  //     }

  //     return mr.data.url;
  //   }
}

export default function douyu(input: string) {
  const d = new Douyu(input);
  return d.parse();
}
