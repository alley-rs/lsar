import { getVersion } from "@tauri-apps/api/app";
import { createResource } from "solid-js";
import { open } from "~/command";
import { LazyButton, LazyLabel, LazySpace, LazyTooltip } from "~/lazy";
import "./index.scss";

const baseClass = "about";

const About = () => {
  const [version] = createResource(getVersion);

  return (
    <LazySpace class={baseClass} justify="around">
      <LazySpace>
        <LazyLabel>反馈</LazyLabel>
        <LazyTooltip
          text="贡献、提建议或意见，最好去 star 一下"
          placement="top"
          delay={500}
        >
          <LazyButton
            class={`${baseClass}-button`}
            type="plain"
            shape="round"
            size="small"
            onClick={() => open("https://github.com/alley-rs/lsar")}
          >
            Github
          </LazyButton>
        </LazyTooltip>

        <LazyTooltip text="提建议或意见" placement="top" delay={500}>
          <LazyButton
            class={`${baseClass}-button`}
            type="plain"
            shape="round"
            size="small"
            onClick={() =>
              open("https://www.52pojie.cn/thread-1959221-1-1.html")
            }
          >
            吾爱
          </LazyButton>
        </LazyTooltip>
      </LazySpace>

      <LazySpace>
        <LazyLabel>版本号</LazyLabel>
        <LazyTooltip
          text="若有新版本，启动本程序时会自动更新，或者点击版本号打开最新版下载页面"
          placement="top"
          delay={1000}
        >
          <LazyButton
            class={`${baseClass}-button`}
            type="plain"
            shape="round"
            size="small"
            onClick={() =>
              open("https://github.com/alley-rs/lsar/releases/latest")
            }
          >
            {version()}
          </LazyButton>
        </LazyTooltip>
      </LazySpace>
    </LazySpace>
  );
};

export default About;
