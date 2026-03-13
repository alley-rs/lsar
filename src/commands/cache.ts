import { invoke } from "@tauri-apps/api/core";

export const calcCacheSize = (): Promise<string> => {
  return invoke<string>("calc_cache_size");
};
