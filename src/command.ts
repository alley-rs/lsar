import { invoke } from "@tauri-apps/api/core";

export const getAllHistory = async () =>
  invoke<HistoryItem[]>("get_all_history");
export const computeMD5 = async (text: string) =>
  invoke<string>("md5", { text });

export const trace = async (prefix: string, msg: string) =>
  invoke<void>("trace", { prefix, msg });

export const debug = async (prefix: string, msg: string) =>
  invoke<void>("debug", { prefix, msg });

export const info = async (prefix: string, msg: string) =>
  invoke<void>("info", { prefix, msg });

export const warn = async (prefix: string, msg: string) =>
  invoke<void>("warn", { prefix, msg });

export const error = async (prefix: string, msg: string) =>
  invoke<void>("error", { prefix, msg });

export const get = async <T extends string | object>(
  url: string,
  headers?: Record<string, string>,
) => invoke<HTTPResponse<T>>("get", { url, headers: headers ?? {} });
export const post = async <T extends string | object>(
  url: string,
  body: string,
  contentType: "json" | "form" = "form",
) => invoke<HTTPResponse<T>>("post", { url, body, contentType });

export const readConfigFile = async () => invoke<Config>("read_config_file");
export const writeConfigFile = async (config: Config) =>
  invoke<void>("write_config_file", { config });

export const play = async (url: string) => invoke<void>("play", { url });

export const open = async (url: string) => invoke<void>("open", { url });

export const insertHistory = async (history: HistoryItem) =>
  invoke<void>("insert_a_history", { history });

export const deleteHistoryByID = async (id: number) =>
  invoke<void>("delete_a_history_by_id", { id });
