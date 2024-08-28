export function isValidCookie(cookieString: string): boolean {
  // 使用分号和空格作为分隔符分割字符串
  const cookies = cookieString.split("; ");

  for (const cookie of cookies) {
    // 检查是否有等于号 (=)
    if (!cookie.includes("=")) {
      return false;
    }

    // 分割键名和值
    const [key, value] = cookie.split("=");

    // 检查键名
    if (!isValidKey(key)) {
      return false;
    }

    // 检查值
    if (!isValidValue(value)) {
      return false;
    }
  }

  return true;
}

function isValidKey(key: string): boolean {
  // 键名应该只包含字母数字字符、下划线和连字符
  const keyRegex = /^[a-zA-Z0-9_\-]+$/;
  return keyRegex.test(key);
}

function isValidValue(value: string): boolean {
  // 值可以包含字母数字字符、特殊字符（除了制表符、换行符或回车符）
  const valueRegex = /^[^;\r\n\t]*$/;
  return valueRegex.test(value);
}
