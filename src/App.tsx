import { createResource, createSignal, lazy, onMount, Show } from "solid-js";
import { LazyButton, LazyFlex, LazyToast, LazyTooltip } from "./lazy";
import { AppContext } from "./context";
import { showMainWindow, getAllHistory, readConfigFile } from "./command";
import History from "./components/history";
import Search from "./components/search";
import Settings from "./components/settings";
import Result from "./components/result";
import "./App.scss";
import About from "./components/about";
import { AiFillSetting } from "solid-icons/ai";

const TitleBar =
  import.meta.env.TAURI_ENV_PLATFORM === "darwin"
    ? lazy(() => import("~/components/title-bar"))
    : null;

const App = () => {
  const [items, { refetch: refetchHistoryItems }] =
    createResource(getAllHistory);
  const [config, { refetch: refetchConfig }] = createResource(readConfigFile);

  const [toast, setToast] = createSignal<Toast | null>(null);
  const [parsedResult, setParsedResult] = createSignal<ParsedResult | null>(
    null,
  );

  const [showSettings, setShowSettings] = createSignal(false);

  onMount(() => {
    showMainWindow();
  });

  const onClickSettingsButton = () => setShowSettings(true);

  return (
    <>
      {TitleBar && <TitleBar />}

      <AppContext.Provider
        value={[
          { refetchHistoryItems },
          { toast, setToast },
          { config, refetchConfig },
          { parsedResult, setParsedResult },
          {
            showSettings,
            setShowSettings,
          },
        ]}
      >
        <LazyFlex
          class={
            import.meta.env.TAURI_PLATFORM !== "macos" ? "not-macos" : undefined
          }
        >
          <History items={items()} />

          <LazyFlex id="right" direction="vertical">
            <Search />

            <LazyFlex class="parsed-result" direction="vertical" gap={8}>
              <Show when={parsedResult()?.links.length}>
                <Result {...parsedResult()!} />
              </Show>
            </LazyFlex>

            <About />
          </LazyFlex>

          <LazyTooltip text="设置" placement="top" delay={1000}>
            <LazyButton
              id="settings-button"
              icon={<AiFillSetting />}
              type="plain"
              shape="circle"
              onClick={onClickSettingsButton}
            />
          </LazyTooltip>

          <Settings />
        </LazyFlex>
      </AppContext.Provider>

      <LazyToast
        class="message"
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
