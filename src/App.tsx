import { createResource, createSignal, onMount, Show } from "solid-js";
import { LazyDialog, LazyFlex, LazyToast } from "./lazy";
import { AppContext } from "./context";
import { showMainWindow, getAllHistory, readConfigFile } from "./command";
import History from "./components/history";
import Search from "./components/search";
import Settings from "./components/settings";
import Result from "./components/result";
import "./App.scss";
import BiliCookieEditor from "./components/settings/bili-cookie";

const App = () => {
  const [items, { refetch: refetchHistoryItems }] =
    createResource(getAllHistory);
  const [config, { refetch: refetchConfig }] = createResource(readConfigFile);

  const [toast, setToast] = createSignal<Toast | null>(null);
  const [parsedResult, setParsedResult] = createSignal<ParsedResult | null>(
    null,
  );

  const [showBilibiliCookieEditor, setShowBilibiliCookieEditor] =
    createSignal(false);

  onMount(() => {
    showMainWindow();
  });

  return (
    <>
      <AppContext.Provider
        value={[
          { refetchHistoryItems },
          { toast, setToast },
          { config, refetchConfig },
          { parsedResult, setParsedResult },
          { showBilibiliCookieEditor, setShowBilibiliCookieEditor },
        ]}
      >
        <History items={items()} />

        <LazyFlex id="right" direction="vertical">
          <Search />

          <LazyFlex class="parsed-result" direction="vertical" gap={8}>
            <Show when={parsedResult()?.links.length}>
              <Result {...parsedResult()!} />
            </Show>
          </LazyFlex>
        </LazyFlex>

        <Settings />

        <LazyDialog
          class="bili-cookie-dialog"
          title="输入 B 站 cookie"
          show={showBilibiliCookieEditor()}
          onClose={() => setShowBilibiliCookieEditor(false)}
          maskClosable={false}
        >
          <BiliCookieEditor />
        </LazyDialog>
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
