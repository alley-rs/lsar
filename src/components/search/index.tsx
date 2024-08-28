import { Button, Flex, Input, Space, Tag } from "alley-components";
import "./index.scss";
import { children, createSignal, For, lazy, useContext } from "solid-js";
import { platforms } from "~/parser";
import Result from "./result";
import { AiOutlineCheck } from "solid-icons/ai";
import { AppContext } from "~/context";

const Dialog = lazy(() => import("alley-components/lib/components/dialog"));

// const platforms = [
//   { value: "douyu", label: "斗鱼" },
//   { value: "huya", label: "虎牙" },
//   { value: "douyin", label: "抖音" },
//   { value: "bilibili", label: "B 站" },
// ];

const Search = () => {
  const { setToast } = useContext(AppContext)![1];

  const [input, setInput] = createSignal("");
  const [currentPlatform, setCurrentPlatform] = createSignal<Platform | null>(
    null,
  );

  const [parseResult, setParsedResult] = createSignal<ParsedResult>();

  const [loading, setLoading] = createSignal(false);

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

  return (
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
          onClick={async () => {
            setLoading(true);

            const result = await platforms[currentPlatform()!].parser(input());
            if (result instanceof Error) {
              setToast({ type: "error", message: result.message });
              setLoading(false);
              return;
            }

            setParsedResult(result);
            setLoading(false);
          }}
        />
      </Space.Compact>

      <Space gap={8} style={{ "margin-top": "1rem" }}>
        {buttons()}
      </Space>

      <Dialog
        class="parsed-result-dialog"
        show={!!parseResult()}
        onClose={() => setParsedResult(undefined)}
        maskClosable={false}
        showCloseIcon
      >
        <Result
          {...parseResult()!}
          roomURL={`${platforms[currentPlatform()!].roomBaseURL}${input()}`}
          platform={currentPlatform()!}
        />
      </Dialog>
    </Flex>
  );
};

export default Search;
