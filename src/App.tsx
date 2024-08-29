import { createResource, createSignal } from "solid-js";
import "./App.scss";
import { getAllHistory, readConfigFile } from "./command";
import History from "./components/history";
import Search from "./components/search";
import { AppContext } from "./context";
import Settings from "./components/settings";
import { LazyToast } from "./lazy";

const App = () => {
  const [items, { refetch: refetchHistoryItems }] =
    createResource(getAllHistory);
  const [config, { refetch: refetchConfig }] = createResource(readConfigFile);

  const [toast, setToast] = createSignal<Toast | null>(null);
  const [parsedResult, setParsedResult] = createSignal<ParsedResult | null>(
    null,
  );

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
        <History items={items()} />

        <Search />

        <Settings />
      </AppContext.Provider>

      <LazyToast
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
