# LSAR

图形化的直播解析器。

## 使用

任何已经支持的平台均可输入房间号或链接完全解析，但 B 站只能输入 cookie 后才能获得最高分辨率的直播流。

建议使用 mpv 或 potplay 作为播放器，第一次运行本程序时需要选择播放器可执行二进制文件的绝对路径。

软件很简单，不需要太多说明，启动后即可明白如何使用。

![主界面](docs/images/lsar.avif)

## 隐私收集

本程序将会创建一个随机有 UUID 作为设备标识，用来统计本程序的打开次数，除此之外不会收集任何用户信息。

统计打开次数的目的只为了统计活跃用户数量。

用户无权拒绝本功能，但可以通过修改 hosts 文件的方式屏蔽 api 的网络请求，使用本程序时即意味着你已同意此项数据收集。

## 相关项目

只列出主要的相关项目，涉及的其他功能性依赖请查看 [Cargo.toml](https://github.com/alley-rs/lsar/blob/main/src-tauri/Cargo.toml) 和 [package.json](https://github.com/alley-rs/lsar/blob/main/package.json)。

- [tauri](https://github.com/tauri-apps/tauri)：图形化的基础框架。
- [alley-components](https://github.com/alley-rs/alley-components): 页面组件库。
