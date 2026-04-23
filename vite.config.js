import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      vue: "vue/dist/vue.esm-bundler.js",
    },
  },
  server: {
    proxy: {
      // telegram-bot: npm run dev (API + polling) — lokal 3847
      "/api/telegram": {
        target: "http://127.0.0.1:3847",
        changeOrigin: true,
      },
    },
  },
});
