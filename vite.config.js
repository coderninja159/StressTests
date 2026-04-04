import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
   'vue': 'vue/dist/vue.esm-bundler.js'
});
