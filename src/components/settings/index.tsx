import { open } from "@tauri-apps/plugin-dialog";
import {
  Button,
  Dialog,
  Flex,
  Label,
  Space,
  Typography,
} from "alley-components";
import { createSignal, Show, useContext } from "solid-js";
import { writeConfigFile } from "~/command";
import { AppContext } from "~/context";

const { Text } = Typography;

const Settings = () => {
  const { config, refetchConfig } = useContext(AppContext)![2];

  const [path, setPath] = createSignal(config()?.player.path);

  const onSelectFile = async () => {
    const file = await open({
      multiple: false,
      directory: false,
    });
    setPath(file?.path);
  };

  const onCancel = () => {
    if (!config()?.player.path) {
      // TODO: 关闭程序
    } else {
      // TODO: 关闭设置对话框
    }
  };

  const onOk = async () => {
    const p = path();
    if (!p) return;

    const c = config()!; // 到这里时 config 不可能为 undefined
    c.player.path = p;

    await writeConfigFile(c);
    refetchConfig();
  };

  return (
    <Dialog
      show={!config()?.player.path}
      onClose={() => {}}
      maskClosable={false}
    >
      <Flex direction="vertical" gap={8}>
        <Space justify="around">
          <Label>播放器绝对路径</Label>

          <Show when={path()}>
            <Text type="secondary" style={{ "margin-right": "8px" }}>
              {path()}
            </Text>
          </Show>

          <Button size="small" onClick={onSelectFile}>
            <Show when={!path()} fallback={"重新选择"}>
              选择文件
            </Show>
          </Button>
        </Space>

        <Space justify="around">
          <Button
            danger
            onClick={onCancel}
            disabled={!config()?.player.path || !path()}
          >
            取消
          </Button>
          <Button onClick={onOk} disabled={!path()}>
            确认
          </Button>
        </Space>
      </Flex>
    </Dialog>
  );
};

export default Settings;
