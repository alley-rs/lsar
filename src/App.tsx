import { createResource, createSignal, onMount, Show } from "solid-js";
import "./App.scss";
import { creataTable, getAllHistory, readConfigFile } from "./command";
import History from "./components/history";
import Search from "./components/search";
import { AppContext } from "./context";
import { Toast } from "alley-components";
import Settings from "./components/settings";

const App = () => {
  const [items, { refetch: refetchHistoryItems }] =
    createResource(getAllHistory);
  const [config, { refetch: refetchConfig }] = createResource(readConfigFile);

  const [tableCreated, setTableCreated] = createSignal(false);
  const [toast, setToast] = createSignal<Toast | null>(null);
  const [parsedResult, setParsedResult] = createSignal<ParsedResult | null>(
    null,
  );

  onMount(() => {
    creataTable().then(() => setTableCreated(true));
  });

  return (
    <>
      <AppContext.Provider
        value={[
          { refetchHistoryItems },
          { toast, setToast },
          { config, refetchConfig },
          { parsedResult, setParsedResult },
        ]}
      >
        <Show when={tableCreated()} fallback={<div>正在创建表格</div>}>
          <History items={items()} />
        </Show>

        <Search />

        <Settings />
      </AppContext.Provider>

      <Toast
        open={!!toast()}
        placement="bottom"
        alert={{
          ...toast()!,
          showIcon: true,
        }}
        onClose={() => setToast(null)}
      />
    </>
  );
};

export default App;
