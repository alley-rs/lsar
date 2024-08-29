import { AiFillApi, AiFillChrome, AiFillDelete } from "solid-icons/ai";
import { createSignal, Show, useContext } from "solid-js";
import { deleteHistoryByID, open, readConfigFile } from "~/command";
import { AppContext } from "~/context";
import {
  LazyButton,
  LazyCol,
  LazyDivider,
  LazyFlex,
  LazyRow,
  LazySpace,
  LazyText,
  LazyTooltip,
} from "~/lazy";
import { platforms } from "~/parser";

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
    <LazyFlex class="history-item" direction="vertical">
      <Show when={props.category} fallback={<h4>{props.last_title}</h4>}>
        <LazyRow class="history-item-header">
          <LazyCol span={18} align="center">
            <h4>{props.last_title}</h4>
          </LazyCol>

          <LazyCol span={6} justify="end" align="center">
            <LazyText class="history-item-category" type="secondary" italic>
              {props.category}
            </LazyText>
          </LazyCol>
        </LazyRow>
      </Show>

      <LazyDivider />

      <LazyRow>
        <LazyCol span={14} align="center">
          <LazyText>{props.anchor}</LazyText>
        </LazyCol>

        <LazyCol span={4} align="center">
          <LazyText type="secondary">
            {platforms[props.platform].label}
          </LazyText>
        </LazyCol>

        <LazyCol span={6} align="center">
          <LazySpace>
            <LazyTooltip text="解析本直播间" placement="bottom" delay={1000}>
              <LazyButton
                isLoading={parsing()}
                icon={<AiFillApi />}
                type="plain"
                shape="circle"
                size="small"
                onClick={onParse}
              />
            </LazyTooltip>

            <LazyTooltip text="在浏览器中打开" placement="bottom" delay={1000}>
              <LazyButton
                icon={<AiFillChrome />}
                type="plain"
                shape="circle"
                size="small"
                onClick={() =>
                  open(platforms[props.platform].roomBaseURL + props.room_id)
                }
              />
            </LazyTooltip>

            <LazyTooltip
              text="删除本条历史记录"
              placement="bottom"
              delay={1000}
            >
              <LazyButton
                onClick={onDelete}
                icon={<AiFillDelete />}
                type="plain"
                shape="circle"
                size="small"
                danger
              />
            </LazyTooltip>
          </LazySpace>
        </LazyCol>
      </LazyRow>
    </LazyFlex>
  );
};

export default HistoryItem;
