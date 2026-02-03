/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  const apiTarget = env.VITE_API_BASE_URL ?? "http://127.0.0.1:5014";

  return {
    server: {
      host: "::",
      port: Number(env.VITE_PORT ?? 5173),
      hmr: { overlay: false },
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        "/hubs": {
          target: apiTarget,
          changeOrigin: true,
          ws: true,
          secure: false,
          rewrite: (p) => p,
        },
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      css: true,
    },
  };
});
