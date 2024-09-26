export const INVALID_INPUT = Error("无法从链接中获取房间号");
export const WRONG_SECOND_LEVEL_DOMAIN = Error("域名不匹配");

export const getSecondLevelDomain = (url: string) => {
  const domainPart = url.split("?")[0].split("://")[1];

  const domainParts = domainPart.split(".");

  // 如果域名部分少于两段，返回 null
  //if (domainParts.length < 2) {
  //  return null;
  //}

  return domainParts[domainParts.length - 2];
};

export const parseRoomID = (input: string | number): number | Error => {
  if (typeof input === "number") return input;

  try {
    const url = new URL(input);
    const basepath = url.pathname.slice(1);
    const n = Number(basepath);
    return Number.isNaN(n) ? INVALID_INPUT : n;
  } catch {
    return INVALID_INPUT;
  }
};
