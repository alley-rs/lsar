import { computeMD5, debug, get, info, post } from "~/command";

interface CacheProfileOffData {
  liveStatus: "OFF";
}

interface CacheProfileReplayData {
  liveStatus: "REPLAY";
}

interface CacheProfileOnData {
  liveStatus: "ON";
  stream: {
    baseSteamInfoList: {
      sCdnType: keyof typeof cdn;
      sStreamName: string;
      sFlvUrl: string;
      sFlvAntiCode: string;
      sFlvUrlSuffix: string;
      sHlsUrl: string;
      sHlsAntiCode: string;
      sHlsUrlSuffix: string;
      newCFlvAntiCode: string;
    }[];
  };
}

type CacheProfileData =
  | CacheProfileOffData
  | CacheProfileReplayData
  | CacheProfileOnData;

interface CacheProfile {
  status: number;
  message: string;
  data: CacheProfileData & {
    liveData: {
      nick: string;
      gameFullName: string;
      introduction: string;
    };
  };
}

const cdn = {
  AL: "阿里",
  AL13: "阿里13",
  TX: "腾讯",
  HW: "华为",
  HS: "火山",
  WS: "网宿",
} as const;

const log_prefix = "huya";

class Huya {
  roomID = 0;
  baseURL = "https://m.huya.com/";
  private pageURL = "";

  constructor(roomID: number, url = "") {
    this.pageURL = url;
    this.roomID = roomID;
  }

  get roomURL(): string {
    return this.baseURL + this.roomID.toString();
  }

  private async getFinalRoomID() {
    let url: string;
    if (this.roomID) {
      url = this.roomURL;
    } else {
      url = this.pageURL;
    }

    const html = await get<string>(url, {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    });

    const ptn = /stream: (\{.+"iFrameRate":\d+\})/;
    const streamStr = ptn.exec(html)![1];
    const stream = JSON.parse(streamStr);
    const roomID = stream.data[0].gameLiveInfo.profileRoom as string;
    info(log_prefix, `真实房间 id：${roomID}`);

    return roomID;
  }

  private async getRoomProfile(roomID: string) {
    const text = await get<string>(
      `https://mp.huya.com/cache.php?m=Live&do=profileRoom&roomid=${roomID}`,
      {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
      }
    );

    const profile = JSON.parse(text) as CacheProfile;

    if (profile.status !== 200) {
      return Error(profile.message);
    }

    console.log(profile);

    const {
      liveStatus,
      liveData: { nick, gameFullName, introduction },
    } = profile.data;

    debug(log_prefix, `房间状态：${liveStatus}`);

    if (liveStatus === "REPLAY") {
      return Error("此间正在重播，本程序不解析重播视频源");
    }

    if (liveStatus === "OFF") {
      return Error("此房间未开播");
    }

    const { baseSteamInfoList } = profile.data.stream;

    const parsedResult: ParsedResult = {
      links: [],
      title: introduction,
      anchor: nick,
      roomID: Number(roomID),
      category: gameFullName,
    };

    const uid = await this.getAnonymousUid();
    for (const item of baseSteamInfoList) {
      if (item.sFlvAntiCode && item.sFlvAntiCode.length > 0) {
        const anticode = await this.parseAnticode(
          item.sFlvAntiCode,
          uid,
          item.sStreamName
        );
        const url = `${item.sFlvUrl}/${item.sStreamName}.${item.sFlvUrlSuffix}?${anticode}`;
        parsedResult.links.push(url);
      }
      if (item.sHlsAntiCode && item.sHlsAntiCode.length > 0) {
        const anticode = await this.parseAnticode(
          item.sHlsAntiCode,
          uid,
          item.sStreamName
        );
        const url = `${item.sHlsUrl}/${item.sStreamName}.${item.sHlsUrlSuffix}?${anticode}`;
        parsedResult.links.push(url);
      }
    }

    return parsedResult;
  }

  private async getAnonymousUid() {
    const url = "https://udblgn.huya.com/web/anonymousLogin";
    const json = {
      appId: 5002,
      byPass: 3,
      context: "",
      version: "2.4",
      data: {},
    };

    const obj = await post<{ data: { uid: string } }>(
      url,
      JSON.stringify(json),
      "json"
    );

    return obj.data.uid;
  }

  private newUuid() {
    const now = new Date().getTime();
    const rand = Math.floor(Math.random() * 1000) | 0;
    return ((now % 10000000000) * 1000 + rand) % 4294967295;
  }

  private async parseAnticode(code: string, uid: string, streamname: string) {
    const q = {} as Record<string, [string]>;
    for (const [k, v] of new URLSearchParams(code)) {
      q[k] = [v];
    }
    q.ver = ["1"];
    q.sv = ["2110211124"];

    q.seqid = [String(Number.parseInt(uid) + new Date().getTime())];
    console.log("seqid", q.seqid);

    q.uid = [uid];
    q.uuid = [String(this.newUuid())];
    console.log("uuid", q.uuid);

    const ss = await computeMD5(`${q.seqid[0]}|${q.ctype[0]}|${q.t[0]}`);
    console.log("ss", ss);

    q.fm[0] = Buffer.from(q.fm[0], "base64")
      .toString("utf-8")
      .replace("$0", q.uid[0])
      .replace("$1", streamname)
      .replace("$2", ss)
      .replace("$3", q.wsTime[0]);

    q.wsSecret[0] = await computeMD5(q.fm[0]);
    console.log("wsSecret", q.wsSecret);

    delete q.fm;
    if ("txyp" in q) {
      delete q.txyp;
    }

    const queryString = Object.entries(q)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value[0])}`
      )
      .join("&");

    return queryString;
  }

  async parse() {
    const roomID = await this.getFinalRoomID();
    const result = await this.getRoomProfile(roomID);

    console.log(result);

    return result;
  }
}

export default function huya(input: string) {
  let roomID = 0;
  let url: string | undefined = undefined;

  const rid = Number.parseInt(input);
  if (Number.isNaN(rid)) {
    // TODO: 正则验证链接合法性
    url = input;
  } else {
    roomID = rid;
  }

  const d = new Huya(roomID, url);
  return d.parse();
}
