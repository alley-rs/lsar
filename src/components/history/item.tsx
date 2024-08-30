import { AiFillApi, AiFillChrome, AiFillDelete } from "solid-icons/ai";
import { createSignal, Show } from "solid-js";
import { deleteHistoryByID, open } from "~/command";
import { useAppContext } from "~/context";
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
import { parse, platforms } from "~/parser";

interface HistoryItemProps extends HistoryItem {
  onDelete: () => void;
}

const HistoryItem = (props: HistoryItemProps) => {
  const [
    _,
    { setToast },
    { config },
    { setParsedResult },
    { setShowBilibiliCookieEditor },
  ] = useAppContext();

  const [parsing, setParsing] = createSignal(false);

  const onDelete = async () => {
    await deleteHistoryByID(props.id);
    props.onDelete();
  };

  const onParse = async () => {
    setParsing(true);

    await parse(
      props.platform,
      props.room_id.toString(),
      config()!,
      setShowBilibiliCookieEditor,
      setToast,
      setParsedResult,
    );

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

            <LazyTooltip
              text="在浏览器中打开此直播间"
              placement="bottom"
              delay={1000}
            >
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
