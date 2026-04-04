import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";
import { pinia } from "./stores";
import { useThemeStore } from "./stores/theme.js";
import VueApexCharts from "vue3-apexcharts";
import "./assets/main.css";

/** VAQTINCHALI: bir marta `npm run dev` qilib brauzer konsolida xabarni tekshiring, keyin shu blokni o'chiring. */
if (import.meta.env.DEV) {
  import("./lib/seedQuestions.js").then(async ({ seedQuestions }) => {
    try {
      const r = await seedQuestions();
      if (r.skipped) {
        console.log(
          "[StressTest] Savollar allaqachon mavjud — seed o'tkazib yuborildi.",
        );
      } else {
        console.log("[StressTest] Savollar kiritildi! (75 psixologik + 25 portret)");
      }
    } catch (e) {
      console.error("[StressTest] Seed xato:", e);
    }
  });
}

const app = createApp(App);

app.use(pinia);
useThemeStore().init();
app.use(router);
app.use(VueApexCharts);

app.mount("#app");
