import { createSignal } from "solid-js";
import { writeConfigFile } from "~/command";
import { useAppContext } from "~/context";
import { LazyButton, LazyFlex, LazyTextArea } from "~/lazy";

const BiliCookieEditor = () => {
  const [
    _,
    __,
    { config, refetchConfig },
    ___,
    { setShowBilibiliCookieEditor },
  ] = useAppContext();

  const [cookie, setCookie] = createSignal(config()?.platform.bilibili.cookie);

  const onConfirm = async () => {
    const newConfig = {
      ...config()!,
      platform: { bilibili: { cookie: cookie()! } },
    };

    await writeConfigFile(newConfig);
    refetchConfig();
    setShowBilibiliCookieEditor(false);
  };

  return (
    <>
      <LazyTextArea rows={6} value={cookie()} onInput={(s) => setCookie(s)} />

      <LazyFlex justify="round">
        <LazyButton danger onClick={() => setShowBilibiliCookieEditor(false)}>
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
