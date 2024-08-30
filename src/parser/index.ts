import bilibili from "./bilibili";
import douyin from "./douyin";
import douyu from "./douyu";
import huya from "./huya";

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

export const handleParsingError = (error: unknown): Error => {
  const errorMessage = String(error);
  switch (errorMessage) {
    case "http error: Connect":
      return new Error("网络连接异常");
    case "http error: Timeout":
      return new Error("网络连接超时");
    case "http error: Decode":
      return new Error("解码响应失败");
    default:
      return new Error(
        "其他网络错误，请将日志上传到 https://github.com/alley-rs/lsar/issues",
      );
  }
};
