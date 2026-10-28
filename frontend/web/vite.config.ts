import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget =
    env.VITE_API_PROXY_TARGET || env.BACKEND_URL || "http://localhost:3000";

  const proxy = {
    "/api": {
      target: proxyTarget,
      changeOrigin: true,
    },
    "/uploads": {
      target: proxyTarget,
      changeOrigin: true,
    },
  };

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy,
    },
    preview: {
      port: 4173,
      proxy,
    },
  };
});
