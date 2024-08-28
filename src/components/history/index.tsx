import { For, Show, useContext } from "solid-js";
import HistoryItem from "./item";
import { Flex } from "alley-components";
import "./index.scss";
import { AppContext } from "~/context";

interface HistoryProps {
  items?: HistoryItem[];
}

const History = (props: HistoryProps) => {
  const [{ refetchHistoryItems }] = useContext(AppContext)!;

  return (
    <Flex id="history" direction="vertical">
      <Show when={props.items?.length} fallback={<span>空空如也</span>}>
        <For each={props.items}>
          {(item) => (
            <HistoryItem {...item} onDelete={() => refetchHistoryItems()} />
          )}
        </For>
      </Show>
    </Flex>
  );
};

export default History;
