import { LazyTextArea } from "~/lazy";
import SettingItem from "../SettingItem";

interface BiliCookieProps {
  cookie?: string;
  onChange?: (cookie: string) => void;
}

const BiliCookie = (props: BiliCookieProps) => {
  return (
    <SettingItem
      label="B 站 Cookie"
      orientation="vertical"
      tips="不看 B 站直播无需配置此项。获取方法请自行搜索，互联网上教程很多。"
    >
      <LazyTextArea
        rows={props.cookie ? 10 : 3}
        value={props.cookie}
        onChange={props.onChange}
      />
    </SettingItem>
  );
};

export default BiliCookie;
