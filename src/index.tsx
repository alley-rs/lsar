/* @refresh reload */
import { render } from "solid-js/web";
import "alley-components/lib/index.css";
import "./index.scss";
import App from "./App";
import * as buffer from "buffer"; // 浏览器中无 Buffer，需要安装并挂到 window 上

if (typeof window.Buffer === "undefined") {
  window.Buffer = buffer.Buffer;
}

render(() => <App />, document.getElementById("root") as HTMLElement);
