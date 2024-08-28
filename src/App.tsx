import { createResource, createSignal, onMount, Show } from "solid-js";
import "./App.scss";
import { creataTable, getAllHistory } from "./command";
import History from "./components/history";
import Search from "./components/search";
import { AppContext } from "./context";
import { Toast } from "alley-components";

const App = () => {
  const [items, { refetch }] = createResource(getAllHistory);

  const [tableCreated, setTableCreated] = createSignal(false);
  const [toast, setToast] = createSignal<Toast | null>(null);

  onMount(() => {
    creataTable().then(() => setTableCreated(true));
  });

  return (
    <>
      <AppContext.Provider
        value={[{ refetchHistoryItems: refetch }, { toast, setToast }]}
      >
        <Show when={tableCreated()} fallback={<div>正在创建表格</div>}>
          <History items={items()} />
        </Show>

        <Search />
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
