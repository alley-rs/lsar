import {
  Button,
  Col,
  Divider,
  Flex,
  Row,
  Space,
  Tooltip,
  Typography,
} from "alley-components";
import { AiFillApi, AiFillChrome, AiFillDelete } from "solid-icons/ai";
import { createSignal, Show, useContext } from "solid-js";
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
      <Show when={props.category} fallback={<h4>{props.last_title}</h4>}>
        <Row class="history-item-header">
          <Col span={18} align="center">
            <h4>{props.last_title}</h4>
          </Col>

          <Col span={6} justify="end" align="center">
            <Text class="history-item-category" type="secondary" italic>
              {props.category}
            </Text>
          </Col>
        </Row>
      </Show>

      <Divider />

      <Row>
        <Col span={14} align="center">
          <Text>{props.anchor}</Text>
        </Col>

        <Col span={4} align="center">
          <Text type="secondary">{platforms[props.platform].label}</Text>
        </Col>

        <Col span={6} align="center">
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
        </Col>
      </Row>
    </Flex>
  );
};

export default HistoryItem;
