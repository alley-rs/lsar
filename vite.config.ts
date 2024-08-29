import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import path from "node:path";

const host = process.env.TAURI_DEV_HOST;

const pathSrc = path.resolve(__dirname, "src");

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => ({
  plugins: [solid()],

  resolve: {
    alias: {
      "~/": `${pathSrc}/`,
    },
  },

  esbuild: {
    drop: mode === "production" ? ["console"] : [],
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
