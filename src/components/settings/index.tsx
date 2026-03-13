import { createEffect, createSignal } from "solid-js";

import { getPlayerPaths, writeConfigFile } from "~/command";

import { LazyButton } from "~/lazy";

import { Drawer } from "../drawer/Drawer";

import DarkMode from "./components/DarkMode";
import PlayerPath from "./components/PlayerPath";
import BiliCookie from "./components/BiliCookie";
import Cache from "./components/Cache";

import { useToast } from "fluent-solid";
import { useConfigContext } from "~/contexts/ConfigContext";
import { useSettingsContext } from "~/contexts/SettingsContext";

import * as styles from "./index.css";

const DEFAULT_CONFIG: Config = {
  dark_mode: "system",
  player: {
    path: "",
    args: [],
  },
  platform: { bilibili: { cookie: "" } },
};

const Settings = () => {
  const toast = useToast();
  const { config: defaultConfig, refetchConfig } = useConfigContext();
  const { showSettings, setShowSettings } = useSettingsContext();

  const [lsarConfig, setLsarConfig] = createSignal(
    defaultConfig() ?? DEFAULT_CONFIG,
  );

  createEffect(() => {
    if (!defaultConfig()) return;
    showSettings() && setLsarConfig(defaultConfig()!);
  });

  createEffect(async () => {
    if (!defaultConfig() || defaultConfig()?.player.path !== "") return;

    const paths = await getPlayerPaths();
    if (!paths.length) return;

    setLsarConfig(
      (prev) =>
        prev && {
          ...prev,
          player: { path: paths[0], args: [] },
        },
    );

    toast.success(
      "已自动选择播放器，如果此播放器不是你想使用的播放器，请点击“重新选择”按钮自行选择",
    );
  });

  const close = () => setShowSettings(false);

  const onCancel = () => {
    if (!lsarConfig()?.player.path) {
      // TODO: 关闭程序
    } else {
      // TODO: 关闭设置对话框
    }
    close();
  };

  const onOk = async () => {
    const p = lsarConfig()?.player.path;
    if (!p) return;

    const c = lsarConfig()!; // 到这里时 config 不可能为 undefined
    c.player.path = p;

    await writeConfigFile(c);
    refetchConfig();
    close();
  };

  return (
    <Drawer
      open={showSettings() || !defaultConfig()?.player.path}
      title="设置"
      onClose={onCancel}
    >
      <div class={styles.container}>
        <DarkMode
          mode={lsarConfig()?.dark_mode || "system"}
          onChoice={(mode) =>
            setLsarConfig(
              (prev) =>
                prev && {
                  ...prev,
                  dark_mode: mode,
                },
            )
          }
        />

        <PlayerPath
          path={lsarConfig()?.player.path}
          onPathChange={(path) =>
            setLsarConfig(
              (prev) =>
                prev && {
                  ...prev,
                  player: { ...prev.player, path },
                },
            )
          }
        />

        <BiliCookie
          cookie={lsarConfig()?.platform.bilibili.cookie}
          onChange={(cookie) =>
            setLsarConfig(
              (prev) =>
                prev && {
                  ...prev,
                  platform: { ...prev.platform, bilibili: { cookie } },
                },
            )
          }
        />

        <Cache />

        <div class={styles.buttons}>
          <LazyButton onClick={onCancel} disabled={!lsarConfig()?.player.path}>
            取消
          </LazyButton>

          <LazyButton
            appearance="primary"
            onClick={onOk}
            disabled={!lsarConfig()?.player.path}
          >
            保存
          </LazyButton>
        </div>
      </div>
    </Drawer>
  );
};

export default Settings;
