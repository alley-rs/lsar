<p align="center">
<img height="64" width="64" src="./src-tauri/icons/128x128.png" />
<br/>
<a href="https://github.com/alley-rs/lsar/releases/latest"><img src="https://img.shields.io/github/downloads/alley-rs/lsar/total.svg?style=flat-square" alt="GitHub releases"></a>
</p>

# LSAR

图形化的直播解析器。

支持的平台：

- B 站。需要设置 Cookie。
- 抖音
- 虎牙。当前存在看几分钟即退出的问题，尚未找到修复方法。
- 斗鱼
- YY
- Bigo。Bigo 限制中国大陆 IP 访问，在支持设置代理前仅供海外用户使用。

## 使用

任何已经支持的平台均可输入房间号或链接完全解析，但 B 站只能输入 cookie 后才能获得最高分辨率的直播流。

建议使用 mpv 或 potplay 作为播放器，第一次运行本程序时需要选择播放器可执行二进制文件的绝对路径。

软件很简单，不需要太多说明，启动后即可明白如何使用。

![主界面](docs/images/light.avif)

![主界面](docs/images/dark.avif)

> [!NOTE]
> 如果使用正式版本时遇到了 BUG，可尝试下载 [nightly](https://github.com/alley-rs/lsar/releases/tag/nightly) 版本， nightly 版本会包含最新的功能和修复的 BUG。

## 隐私收集

本程序将会随机生成一个 UUID 作为设备标识，用来统计本程序的打开次数，除此之外不会收集任何用户信息。

统计打开次数的目的只为了统计活跃用户数量。

用户无权拒绝本功能，但可以通过修改 hosts 文件的方式屏蔽 api 的网络请求，使用本程序时即意味着你已同意此项数据收集。

## 相关项目

只列出主要的相关项目，涉及的其他功能性依赖请查看 [Cargo.toml](https://github.com/alley-rs/lsar/blob/main/src-tauri/Cargo.toml) 和 [package.json](https://github.com/alley-rs/lsar/blob/main/package.json)。

- [tauri](https://github.com/tauri-apps/tauri)：图形化的基础框架。
- [fluent-solid](https://github.com/thep0y/fluent): 页面组件库。
