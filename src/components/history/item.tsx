import {
  Button,
  Divider,
  Flex,
  Space,
  Tooltip,
  Typography,
} from "alley-components";
import { AiFillChrome, AiFillDelete, AiFillPlayCircle } from "solid-icons/ai";
import { createSignal, useContext } from "solid-js";
import { deleteHistoryByID, open, play } from "~/command";
import { AppContext } from "~/context";
import { platforms } from "~/parser";

const { Text } = Typography;

interface HistoryItemProps extends HistoryItem {
  onDelete: () => void;
}

const HistoryItem = (props: HistoryItemProps) => {
  const [_, { setToast }] = useContext(AppContext)!;

  const [parsing, setParsing] = createSignal(false);

  const onDelete = async () => {
    await deleteHistoryByID(props.id);
    props.onDelete();
  };

  return (
    <Flex class="history-item" direction="vertical">
      <Space gap={8} justify="between">
        <h4>{props.last_title}</h4>
        <Text type="secondary" italic>
          {props.category}
        </Text>
      </Space>

      <Divider />

      <Space justify="between">
        <Text>{props.anchor}</Text>

        <Text type="secondary">{platforms[props.platform].label}</Text>

        <Space>
          <Tooltip text="解析本直播间" placement="bottom" delay={1000}>
            <Button
              isLoading={parsing()}
              icon={<AiFillPlayCircle />}
              type="plain"
              shape="circle"
              size="small"
              onClick={async () => {
                setParsing(true);
                const r = await platforms[props.platform].parser(
                  props.room_id.toString(),
                );
                if (r instanceof Error) {
                  setToast({ type: "error", message: r.message });
                } else if (r) {
                  play(r.links[0]);
                  setToast({
                    type: "success",
                    message:
                      "已创建播放器进程，请等待 1~3 秒播放器发起网络请求",
                  });
                }

                setParsing(false);
              }}
            />
          </Tooltip>

          <Tooltip text="在浏览器中打开" placement="bottom" delay={1000}>
            <Button
              icon={<AiFillChrome />}
              type="plain"
              shape="circle"
              size="small"
              onClick={() =>
                open(platforms[props.platform].roomBaseURL + props.room_id)
              }
            />
          </Tooltip>

          <Tooltip text="删除本条历史记录" placement="bottom" delay={1000}>
            <Button
              onClick={onDelete}
              icon={<AiFillDelete />}
              type="plain"
              shape="circle"
              size="small"
              danger
            />
          </Tooltip>
        </Space>
      </Space>
    </Flex>
  );
};

export default HistoryItem;
