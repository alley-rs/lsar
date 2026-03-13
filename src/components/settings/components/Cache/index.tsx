import { createResource, createSignal } from "solid-js";

import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

import { calcCacheSize } from "~/commands/cache";

import { LazyButton, LazyCaption1 } from "~/lazy";
import SettingItem from "../SettingItem";

import * as styles from "./index.css";

const appWindow = getCurrentWebviewWindow();

const Cache = () => {
  const [cacheSize, { refetch }] = createResource(calcCacheSize);
  const [clearing, setClearing] = createSignal(false);

  const clearCache = async () => {
    setClearing(true);
    try {
      await appWindow.clearAllBrowsingData();

      const id = setTimeout(() => {
        refetch();
        clearTimeout(id);
        setClearing(false);
      }, 1000);
    } catch {
      setClearing(false);
    }
  };

  return (
    <SettingItem
      label="缓存"
      tips="每次启动应用后都会自动产生缓存，如果缓存过大可以手动清除。"
    >
      <div class={styles.content}>
        <LazyCaption1>{cacheSize()}</LazyCaption1>

        <LazyButton
          size="small"
          appearance="primary"
          disabled={!cacheSize()}
          isLoading={clearing()}
          onClick={clearCache}
        >
          清除
        </LazyButton>
      </div>
    </SettingItem>
  );
};

export default Cache;
