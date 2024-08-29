import { createSignal, useContext } from "solid-js";
import { writeConfigFile } from "~/command";
import { AppContext } from "~/context";
import { LazyButton, LazyFlex, LazyTextArea } from "~/lazy";

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
      <LazyTextArea rows={6} value={cookie()} onInput={(s) => setCookie(s)} />

      <LazyFlex justify="round">
        <LazyButton danger onClick={props.onCancel}>
          取消
        </LazyButton>
        <LazyButton
          onClick={onConfirm}
          disabled={
            !cookie() || config()?.platform.bilibili.cookie === cookie()
          }
        >
          确认
        </LazyButton>
      </LazyFlex>
    </>
  );
};

export default BiliCookieEditor;
