import douyu from "./douyu";
import huya from "./huya";

export const platforms: Record<
  Platform,
  {
    label: string;
    roomBaseURL: string;
    parser: (input: string) => Promise<Error | ParsedResult | undefined>;
  }
> = {
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
};
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
