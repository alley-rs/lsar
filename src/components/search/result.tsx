import {
  Button,
  Col,
  Divider,
  Flex,
  Label,
  Row,
  Space,
  Tooltip,
} from "alley-components";
import { AiFillChrome, AiFillCopy, AiFillPlayCircle } from "solid-icons/ai";
import { createEffect, For, Show, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { insertHistory, open, play } from "~/command";
import { AppContext } from "~/context";

const Result = (
  props: ParsedResult & { roomURL: string; platform: Platform },
) => {
  const [{ refetchHistoryItems }] = useContext(AppContext)!;

  const [links, setLinks] = createStore<string[]>([]);

  createEffect(() => props.links && setLinks(props.links));

  const onPlay = async (index: number) => {
    await play(props.links[index]);

    // 解析出来的链接只能访问一次，访问后即删除
    setLinks((prev) => prev.filter((_, idx) => index !== idx));

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

  return (
    <Flex class="parsed-result" direction="vertical" gap={8}>
      <Show when={links.length}>
        <Space justify="between">
          <h3>{props.title}</h3>

          <Tooltip text="浏览器中打开直播间" delay={1000}>
            <Button
              icon={<AiFillChrome />}
              shape="circle"
              size="small"
              type="plain"
              onClick={() => open(props.roomURL)}
            />
          </Tooltip>
        </Space>

        <Space gap={16}>
          <Space>
            <Label>分类</Label>
            <span>{props.category}</span>
          </Space>

          <Space>
            <Label>主播</Label>
            <span>{props.anchor}</span>
          </Space>
        </Space>

        <Divider
          dashed
          style={{ "--alley-color-split": "#fff", margin: "8px 0" }}
        />

        <div class="parsed-links">
          <For each={links}>
            {(link, index) => (
              <Row>
                <Col span={21} class="link" align="center">
                  {link.slice(0, 47)}...
                </Col>

                <Col span={3} align="center" justify="end">
                  <Tooltip text="播放此直播流" delay={1000} placement="bottom">
                    <Button
                      icon={<AiFillPlayCircle />}
                      shape="circle"
                      size="small"
                      type="plain"
                      onClick={() => onPlay(index())}
                    />
                  </Tooltip>

                  <Tooltip text="复制链接" delay={1000} placement="bottom">
                    <Button
                      icon={<AiFillCopy />}
                      shape="circle"
                      size="small"
                      type="plain"
                    />
                  </Tooltip>
                </Col>
              </Row>
            )}
          </For>
        </div>
      </Show>
    </Flex>
  );
};

export default Result;
