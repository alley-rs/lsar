import { open } from "@tauri-apps/plugin-dialog";
import { createEffect, createSignal, Show, useContext } from "solid-js";
import { writeConfigFile } from "~/command";
import { AppContext } from "~/context";
import {
  LazyButton,
  LazyDialog,
  LazyFlex,
  LazyLabel,
  LazySpace,
  LazyText,
  LazyTextArea,
} from "~/lazy";

const Settings = () => {
  const [
    _,
    __,
    { config: defaultConfig, refetchConfig },
    ___,
    { showSettings, setShowSettings },
  ] = useContext(AppContext)!;

  const [lsarConfig, setLsarConfig] = createSignal(defaultConfig());

  createEffect(() => setLsarConfig(defaultConfig()));

  const close = () => setShowSettings(false);

  const onSelectFile = async () => {
    const file: string | null = await open({
      multiple: false,
      directory: false,
    });
    file &&
      setLsarConfig(
        (prev) =>
          prev && {
            ...prev,
            player: { ...prev.player, path: file },
          },
      );
  };

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
    <LazyDialog
      show={showSettings() || !defaultConfig()?.player.path}
      onClose={() => { }}
      maskClosable={false}
    >
      <LazyFlex direction="vertical" gap={8} style={{ "min-width": "400px" }}>
        <LazySpace>
          <LazyLabel>播放器绝对路径</LazyLabel>

          <Show when={lsarConfig()?.player.path}>
            <LazyText type="secondary" style={{ "margin-right": "8px" }}>
              {lsarConfig()?.player.path}
            </LazyText>
          </Show>

          <LazyButton
            size="small"
            onClick={onSelectFile}
            shape="round"
            type="primary"
          >
            <Show when={!lsarConfig()?.player.path} fallback={"重新选择"}>
              选择文件
            </Show>
          </LazyButton>
        </LazySpace>

        <LazyFlex align="start" justify="between">
          <LazyLabel style={{ flex: 1 }}>B 站 Cookie</LazyLabel>
          <LazyTextArea
            style={{ flex: 3 }}
            placeholder="不看 B 站直播无需配置此项"
            rows={6}
            value={lsarConfig()?.platform.bilibili.cookie}
            onInput={(s) =>
              setLsarConfig(
                (prev) =>
                  prev && {
                    ...prev,
                    platform: { ...prev.platform, bilibili: { cookie: s } },
                  },
              )
            }
          />
        </LazyFlex>

        <LazySpace justify="around">
          <LazyButton
            danger
            onClick={onCancel}
            disabled={!defaultConfig()?.player.path}
          >
            取消
          </LazyButton>
          <LazyButton onClick={onOk} disabled={!lsarConfig()?.player.path}>
            确认
          </LazyButton>
        </LazySpace>
      </LazyFlex>
    </LazyDialog>
  );
};

export default Settings;
