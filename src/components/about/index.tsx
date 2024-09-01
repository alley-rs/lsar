import { getVersion } from "@tauri-apps/api/app";
import { createSignal, onMount } from "solid-js";
import { open } from "~/command";
import { LazyButton, LazySpace, LazyText, LazyTooltip } from "~/lazy";
import "./index.scss";

const About = () => {
  const [version, setVersion] = createSignal<string | null>(null);

  onMount(async () => {
    const v = await getVersion();
    setVersion(v);
  });

  return (
    <LazySpace gap={8} class="about" justify="center">
      <LazyTooltip
        text="反馈、贡献、提建议或意见，最好去 star 一下"
        placement="top"
        delay={500}
      >
        <LazyButton
          type="plain"
          shape="round"
          size="small"
          onClick={() => open("https://github.com/alley-rs/lsar")}
        >
          Github
        </LazyButton>
      </LazyTooltip>

      <LazyTooltip text="版本号" placement="top" delay={500}>
        <LazyText type="secondary">{version()}</LazyText>
      </LazyTooltip>
    </LazySpace>
  );
};

export default About;
