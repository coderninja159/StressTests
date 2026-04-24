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
      // app backend (dev): CORS muammosiz ishlashi uchun
      "/api": {
        target: "https://stresstest-backend-1012645166107.us-central1.run.app",
        changeOrigin: true,
        secure: true,
      },
      // telegram-bot: npm run dev (API + polling) — lokal 3847
      "/api/telegram": {
        target: "http://127.0.0.1:3847",
        changeOrigin: true,
      },
    },
  },
});
