import { error } from "~/command";
import bilibili from "./bilibili";
import douyin from "./douyin";
import douyu from "./douyu";
import huya from "./huya";

export const NOT_LIVE = Error("当前直播间未开播");

export const platforms = {
  douyu: {
    label: "斗鱼",
    roomBaseURL: "https://www.douyu.com/",
    parser: douyu,
  },
  huya: {
    label: "虎牙",
    roomBaseURL: "https://www.huya.com/",
    parser: huya,
  },
  bilibili: {
    label: "B 站",
    roomBaseURL: "https://live.bilibili.com/",
    parser: bilibili,
  },
  douyin: {
    label: "抖音",
    roomBaseURL: "https://live.douyin.com/",
    parser: douyin,
  },
} as const;
//   {
//     value: "douyu",
//     label: "斗鱼",
//     roomBaseURL: "https://www.douyu.com/",
//     parser: Douyu,
//   },
//   { value: "huya", label: "虎牙" },
//   { value: "douyin", label: "抖音" },
//   { value: "bilibili", label: "B 站" },
// ];

export const handleParsingError = (platform: Platform, e: unknown): Error => {
  const errorMessage = String(e);
  switch (errorMessage) {
    case "http error: Connect":
      return new Error("网络连接异常");
    case "http error: Timeout":
      return new Error("网络连接超时");
    case "http error: Decode":
      return new Error("解码响应失败");
    case "http error: Other":
      return new Error(
        "其他网络错误，请将日志上传到 https://github.com/alley-rs/lsar/issues",
      );
    default:
      error(platform, errorMessage);
      return e as Error;
  }
};

export const parse = async (
  platform: Platform,
  input: string,
  config: Config,
  setShowBilibiliCookieEditor: Setter<boolean>,
  setToast: AppContext[1]["setToast"],
  setParsedResult: AppContext[3]["setParsedResult"],
) => {
  // 解析前先清空原有的解析结果
  setParsedResult(null);

  let result: ParsedResult | Error | null = null;

  try {
    if (platform === "bilibili") {
      if (!config.platform.bilibili.cookie.length) {
        setShowBilibiliCookieEditor(true);
      } else {
        result = await platforms.bilibili.parser(
          input,
          config.platform.bilibili.cookie,
        );
      }
    } else {
      result = await platforms[platform!].parser(input);
    }
  } catch (e) {
    result = handleParsingError(platform, e);
  }

  if (result instanceof Error) {
    setToast({ type: "error", message: result.message });
  } else if (result) {
    setParsedResult(result);
  }
};
