import { For, lazy, Show, useContext } from "solid-js";
import HistoryItem from "./item";
import { Flex } from "alley-components";
import "./index.scss";
import { AppContext } from "~/context";

const LazyEmpty = lazy(() => import("alley-components/lib/components/empty"));

interface HistoryProps {
  items?: HistoryItem[];
}

const History = (props: HistoryProps) => {
  const [{ refetchHistoryItems }] = useContext(AppContext)!;

  return (
    <Flex
      id="history"
      class={props.items?.length ? undefined : "history-empty"}
      direction="vertical"
    >
      <Show
        when={props.items?.length}
        fallback={<LazyEmpty description="空空如也" />}
      >
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
