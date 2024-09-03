import { getVersion } from "@tauri-apps/api/app";
import { createResource } from "solid-js";
import { open } from "~/command";
import {
  LazyButton,
  LazyLabel,
  LazySpace,
  LazyText,
  LazyTooltip,
} from "~/lazy";
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
            onClick={() => { }}
          >
            吾爱
          </LazyButton>
        </LazyTooltip>
      </LazySpace>

      <LazySpace>
        <LazyLabel>版本号</LazyLabel>
        <LazyText class={`${baseClass}-version`} type="secondary">
          {version()}
        </LazyText>
      </LazySpace>
    </LazySpace>
  );
};

export default About;
