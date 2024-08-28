import {
  Button,
  Divider,
  Flex,
  Space,
  Tooltip,
  Typography,
} from "alley-components";
import { AiFillApi, AiFillChrome, AiFillDelete } from "solid-icons/ai";
import { createSignal, useContext } from "solid-js";
import { deleteHistoryByID, open, readConfigFile } from "~/command";
import { AppContext } from "~/context";
import { platforms } from "~/parser";

const { Text } = Typography;

interface HistoryItemProps extends HistoryItem {
  onDelete: () => void;
}

const HistoryItem = (props: HistoryItemProps) => {
  const [_, { setToast }, __, { setParsedResult }] = useContext(AppContext)!;

  const [parsing, setParsing] = createSignal(false);

  const onDelete = async () => {
    await deleteHistoryByID(props.id);
    props.onDelete();
  };

  const onParse = async () => {
    setParsing(true);

    if (props.platform === "bilibili") {
      const config = await readConfigFile();
      console.log(config);
    } else {
      const r = await platforms[props.platform].parser(
        props.room_id.toString(),
      );
      if (r instanceof Error) {
        setToast({ type: "error", message: r.message });
      } else if (r) {
        setParsedResult(r);
      }
    }

    setParsing(false);
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
              icon={<AiFillApi />}
              type="plain"
              shape="circle"
              size="small"
              onClick={onParse}
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
