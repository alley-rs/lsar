import bilibili from "./bilibili";
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
