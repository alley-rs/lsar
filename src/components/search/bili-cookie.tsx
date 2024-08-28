import { Button, Flex, Input } from "alley-components";
import { createSignal, useContext } from "solid-js";
import { writeConfigFile } from "~/command";
import { AppContext } from "~/context";

const { TextArea } = Input;

interface BiliCookieEditorProps {
  onCancel: () => void;
}

const BiliCookieEditor = (props: BiliCookieEditorProps) => {
  const { config, refetchConfig } = useContext(AppContext)![2];

  const [cookie, setCookie] = createSignal(config()?.platform.bilibili.cookie);

  const onConfirm = async () => {
    const newConfig = {
      ...config()!,
      platform: { bilibili: { cookie: cookie()! } },
    };

    await writeConfigFile(newConfig);
    refetchConfig();
    props.onCancel();
  };

  return (
    <>
      <TextArea rows={6} value={cookie()} onInput={(s) => setCookie(s)} />

      <Flex justify="round">
        <Button danger onClick={props.onCancel}>
          取消
        </Button>
        <Button
          onClick={onConfirm}
          disabled={
            !cookie() || config()?.platform.bilibili.cookie === cookie()
          }
        >
          确认
        </Button>
      </Flex>
    </>
  );
};

export default BiliCookieEditor;
