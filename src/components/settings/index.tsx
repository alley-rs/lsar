import { Button, Dialog, Flex, Input, Label, Space } from "alley-components";
import { createSignal, useContext } from "solid-js";
import { writeConfigFile } from "~/command";
import { AppContext } from "~/context";

const Settings = () => {
  const { config, refetchConfig } = useContext(AppContext)![2];

  const [path, setPath] = createSignal(config()?.player.path);

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
        <Space>
          <Label>播放器绝对路径</Label>
          <Input
            value={path()}
            onChange={(v) => {
              setPath(v);
            }}
          />
        </Space>

        <Space justify="around">
          <Button danger onClick={onCancel}>
            取消
          </Button>
          <Button onClick={onOk}>确认</Button>
        </Space>
      </Flex>
    </Dialog>
  );
};

export default Settings;
