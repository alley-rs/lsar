import { Button, Flex, Input, Space, Tag } from "alley-components";
import "./index.scss";
import { children, createSignal, For, lazy, useContext } from "solid-js";
import { platforms } from "~/parser";
import Result from "./result";
import { AiOutlineCheck } from "solid-icons/ai";
import { AppContext } from "~/context";
import BiliCookieEditor from "./bili-cookie";

const Dialog = lazy(() => import("alley-components/lib/components/dialog"));

const Search = () => {
  const [_, { setToast }, { config }] = useContext(AppContext)!;

  const [input, setInput] = createSignal("");
  const [currentPlatform, setCurrentPlatform] = createSignal<Platform | null>(
    null,
  );

  const [parseResult, setParsedResult] = createSignal<ParsedResult>();

  const [loading, setLoading] = createSignal(false);

  const [showBilibiliCookieEditor, setShowBilibiliCookieEditor] =
    createSignal(false);

  const selectPlatform = (value: Platform) => {
    setCurrentPlatform(value);
  };

  const buttons = children(() => (
    <For each={Object.keys(platforms)}>
      {(key) => {
        const item = platforms[key as Platform];

        return (
          <Tag
            color={currentPlatform() === key ? "#87d068" : "default"}
            onClick={() => selectPlatform(key as Platform)}
          >
            {item.label}
          </Tag>
        );
      }}
    </For>
  ));

  const onParse = async () => {
    setLoading(true);

    const platform = currentPlatform();

    let result: ParsedResult | Error | undefined;

    if (platform === "bilibili") {
      if (!config()?.platform.bilibili.cookie.length) {
        setShowBilibiliCookieEditor(true);
      } else {
        result = await platforms.bilibili.parser(
          input(),
          config()!.platform.bilibili.cookie,
        );
      }
    } else {
      result = await platforms[platform!].parser(input());
    }

    if (result instanceof Error) {
      setToast({ type: "error", message: result.message });
      setLoading(false);
      return;
    }

    setParsedResult(result);

    setLoading(false);
  };

  return (
    <>
      <Flex id="search" direction="vertical">
        <Space.Compact>
          <Input
            placeholder="输入房间号或直播间链接"
            onInput={(v) => setInput(v)}
            disabled={loading()}
          />
          <Button
            icon={<AiOutlineCheck />}
            isLoading={loading()}
            disabled={!currentPlatform() || !input().length}
            onClick={onParse}
          />
        </Space.Compact>

        <Space gap={8} style={{ "margin-top": "1rem" }}>
          {buttons()}
        </Space>

        <Result
          {...parseResult()!}
          roomURL={`${platforms[currentPlatform()!].roomBaseURL}${input()}`}
          platform={currentPlatform()!}
        />
      </Flex>

      <Dialog
        class="bili-cookie-dialog"
        title="输入 B 站 cookie"
        show={showBilibiliCookieEditor()}
        onClose={() => setShowBilibiliCookieEditor(false)}
        maskClosable={false}
      >
        <BiliCookieEditor onCancel={() => setShowBilibiliCookieEditor(false)} />
      </Dialog>
    </>
  );
};

export default Search;
