export const isValidNumberOrHttpsUrl = (
  input: string,
): number | string | Error => {
  const n = Number(input);
  // 检查是否为数字
  if (!Number.isNaN(n) && input !== "") {
    return n;
  }

  // 正则表达式用于匹配 HTTPS 协议且为域名的 URL 格式
  const urlPattern = new RegExp(
    "^https://" + // 严格要求 HTTPS 协议
      "([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\\.)+" + // 域名结构
      "[a-z]{2,}" + // 顶级域名（至少2个字符）
      "(:[0-9]{1,5})?" + // 可选的端口号
      "(/[a-z0-9-._~:/?#[\\]@!$&'()*+,;=%]*)?$", // 可选的路径、查询字符串和锚点
    "i", // 不区分大小写
  );

  return urlPattern.test(input)
    ? input
    : Error(`"${input}" 既不是房间号也不是有效的 https 链接`);
};
