import { Button, Flex, Label, Space, Tooltip } from "alley-components";
import { AiFillChrome, AiFillCopy, AiFillPlayCircle } from "solid-icons/ai";
import { createEffect, createSignal, useContext } from "solid-js";
import { insertHistory, open, play } from "~/command";
import { AppContext } from "~/context";

const Result = (
  props: ParsedResult & { roomURL: string; platform: Platform },
) => {
  const [{ refetchHistoryItems }] = useContext(AppContext)!;

  // 解析出来的链接只能访问一次，访问后禁用播放和复制按钮
  const [consumed, setConsumed] = createSignal(false);

  createEffect(() => props.roomID && setConsumed(false));

  const onPlay = async () => {
    await play(props.links[0]);
    setConsumed(true);
    // TODO: 成功播放保存历史记录
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
      <h3>{props.title}</h3>

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

      <Flex gap={8} justify="end">
        <Tooltip
          text="播放此直播流"
          delay={1000}
          placement="bottom"
          disabled={consumed()}
        >
          <Button
            icon={<AiFillPlayCircle />}
            shape="circle"
            size="small"
            type="plain"
            onClick={onPlay}
            disabled={consumed()}
          />
        </Tooltip>

        <Tooltip
          text="复制链接"
          delay={1000}
          placement="bottom"
          disabled={consumed()}
        >
          <Button
            icon={<AiFillCopy />}
            shape="circle"
            size="small"
            type="plain"
            disabled={consumed()}
          />
        </Tooltip>

        <Tooltip text="浏览器中打开直播间" delay={1000} placement="bottom">
          <Button
            icon={<AiFillChrome />}
            shape="circle"
            size="small"
            type="plain"
            onClick={() => open(props.roomURL)}
          />
        </Tooltip>
      </Flex>
    </Flex>
  );
};

export default Result;
