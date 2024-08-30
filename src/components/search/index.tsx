import "./index.scss";
import { children, createSignal, For } from "solid-js";
import { parse, platforms } from "~/parser";
import { AiOutlineCheck } from "solid-icons/ai";
import { useAppContext } from "~/context";
import {
  LazyButton,
  LazyFlex,
  LazyInput,
  LazySpace,
  LazySpaceCompact,
  LazyTag,
} from "~/lazy";

const Search = () => {
  const [
    _,
    { setToast },
    { config },
    { setParsedResult },
    { setShowBilibiliCookieEditor },
  ] = useAppContext();

  const [input, setInput] = createSignal("");
  const [currentPlatform, setCurrentPlatform] = createSignal<Platform | null>(
    null,
  );

  const [loading, setLoading] = createSignal(false);

  const resetParseResult = () => setParsedResult(null);
  const resetInput = () => setInput("");

  const selectPlatform = (value: Platform) => {
    if (currentPlatform() === value) return;

    if (currentPlatform()) resetInput();

    setCurrentPlatform(value);
    resetParseResult();
  };

  const buttons = children(() => (
    <For each={Object.keys(platforms)}>
      {(key) => {
        const item = platforms[key as Platform];

        return (
          <LazyTag
            color={currentPlatform() === key ? "#87d068" : "default"}
            onClick={() => selectPlatform(key as Platform)}
          >
            {item.label}
          </LazyTag>
        );
      }}
    </For>
  ));

  const onParse = async () => {
    setLoading(true);

    await parse(
      currentPlatform()!,
      input(),
      config()!,
      setShowBilibiliCookieEditor,
      setToast,
      setParsedResult,
    );

    setLoading(false);
  };

  return (
    <>
      <LazyFlex id="search" direction="vertical">
        <LazySpaceCompact>
          <LazyInput
            placeholder="输入房间号或直播间链接"
            value={input()}
            onInput={(v) => setInput(v)}
            disabled={loading()}
          />
          <LazyButton
            icon={<AiOutlineCheck />}
            isLoading={loading()}
            disabled={!currentPlatform() || !input().length}
            onClick={onParse}
          />
        </LazySpaceCompact>

        <LazySpace gap={8} style={{ "margin-top": "1rem" }}>
          {buttons()}
        </LazySpace>
      </LazyFlex>
    </>
  );
};

export default Search;
