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
import { isValidNumberOrHttpsUrl } from "~/parser/validators";

const Search = () => {
  const [
    _,
    { setToast },
    { config },
    { setParsedResult },
    { setShowSettings: setShowBilibiliCookieEditor },
  ] = useAppContext();

  const [input, setInput] = createSignal<string>("");
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

  const onInput = (v: string) => {
    setInput(v);
  };

  const buttons = children(() => (
    <For each={Object.keys(platforms)}>
      {(key) => {
        const item = platforms[key as Platform];

        return (
          <LazyTag
            color={
              currentPlatform() === key
                ? "var(--alley-color-success)"
                : "default"
            }
            onClick={() => selectPlatform(key as Platform)}
          >
            {item.label}
          </LazyTag>
        );
      }}
    </For>
  ));

  const onParse = async () => {
    const value = input().trim();
    const parsedInput = isValidNumberOrHttpsUrl(value);
    if (parsedInput instanceof Error) {
      setToast({ type: "error", message: parsedInput.message });
      return;
    }

    setLoading(true);

    await parse(
      currentPlatform()!,
      parsedInput,
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
            onChange={onInput}
            disabled={loading()}
          />
          <LazyButton
            icon={<AiOutlineCheck />}
            isLoading={loading()}
            disabled={!currentPlatform() || !input()}
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
