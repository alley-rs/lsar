import { AiFillChrome, AiFillCopy, AiFillPlayCircle } from "solid-icons/ai";
import { For, useContext } from "solid-js";
import { insertHistory, open, play } from "~/command";
import { AppContext } from "~/context";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { platforms } from "~/parser";
import {
  LazyAlert,
  LazyButton,
  LazyCol,
  LazyDivider,
  LazyFlex,
  LazyLabel,
  LazyRow,
  LazySpace,
  LazyTooltip,
} from "~/lazy";
import "./index.scss";

const Result = (props: ParsedResult) => {
  const [
    { refetchHistoryItems },
    { setToast },
    _,
    { parsedResult, setParsedResult },
  ] = useContext(AppContext)!;

  const removeLink = (index: number) => {
    setParsedResult((prev) => ({
      ...prev!,
      links: prev!.links.filter((_, idx) => idx !== index),
    }));
  };

  const onPlay = async (index: number) => {
    await play(props!.links[index]);

    // 解析出来的链接只能访问一次，访问后即删除
    removeLink(index);

    await insertHistory({
      id: 0,
      platform: props.platform,
      anchor: props.anchor,
      room_id: props.roomID,
      category: props.category,
      last_title: props.title,
      last_play_time: new Date(),
    });
    refetchHistoryItems();
  };

  const onCopy = async (link: string) => {
    await writeText(link);
    setToast({
      type: "success",
      message: "已复制链接到系统剪贴板，可粘贴到其他播放器播放",
    });
  };

  return (
    <>
      <LazyFlex direction="vertical" class="parsed-result-header">
        <LazySpace justify="between">
          <h3>{props.title}</h3>

          <LazyTooltip text="在浏览器中打开此直播间" delay={1000}>
            <LazyButton
              icon={<AiFillChrome />}
              shape="circle"
              size="small"
              type="plain"
              onClick={() =>
                open(platforms[props.platform].roomBaseURL + props.roomID)
              }
            />
          </LazyTooltip>
        </LazySpace>

        <LazySpace gap={16}>
          <LazySpace>
            <LazyLabel>分类</LazyLabel>
            <span>{props.category ?? "无"}</span>
          </LazySpace>

          <LazySpace>
            <LazyLabel>主播</LazyLabel>
            <span>{props.anchor}</span>
          </LazySpace>
        </LazySpace>

        <LazyDivider
          dashed
          style={{ "--alley-color-split": "#fff", margin: "8px 0" }}
        />
      </LazyFlex>

      <LazyFlex direction="vertical" class="parsed-links-wrapper">
        <div class="parsed-links">
          <For each={parsedResult()?.links}>
            {(link, index) => (
              <LazyRow>
                <LazyCol span={21} align="center">
                  <span class="link">{link}</span>
                </LazyCol>

                <LazyCol span={3} align="center" justify="end">
                  <LazyTooltip
                    text="播放此直播流"
                    delay={1000}
                    placement="bottom"
                  >
                    <LazyButton
                      icon={<AiFillPlayCircle />}
                      shape="circle"
                      size="small"
                      type="plain"
                      onClick={() => onPlay(index())}
                    />
                  </LazyTooltip>

                  <LazyTooltip text="复制链接" delay={1000} placement="bottom">
                    <LazyButton
                      icon={<AiFillCopy />}
                      shape="circle"
                      size="small"
                      type="plain"
                      onClick={() => onCopy(link)}
                    />
                  </LazyTooltip>
                </LazyCol>
              </LazyRow>
            )}
          </For>
        </div>

        <LazyAlert
          class="parsed-links-note"
          type="info"
          message="点击播放按钮后因播放器需发起网络请求需要短暂的时间，等待 1~3 秒若未打开播放器，则为播放失败，届时请播放其他链接或重新解析。"
          showIcon
        />
      </LazyFlex>
    </>
  );
};

export default Result;
