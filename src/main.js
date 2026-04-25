import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";
import { pinia } from "./stores";
import { useThemeStore } from "./stores/theme.js";
import { logError, logInfo } from "./lib/logger";
import VueApexCharts from "vue3-apexcharts";
import "./assets/main.css";

/** VAQTINCHALI: bir marta `npm run dev` qilib brauzer konsolida xabarni tekshiring, keyin shu blokni o'chiring. */
if (import.meta.env.DEV) {
  logInfo("APP", "DEV_MODE_ENABLED");
  import("./lib/seedQuestions.js").then(async ({ seedQuestions }) => {
    try {
      const r = await seedQuestions();
      if (r.skipped) {
        logInfo("SEED", "SKIPPED");
        console.log(
          "[StressTest] Savollar allaqachon mavjud — seed o'tkazib yuborildi.",
        );
      } else {
        logInfo("SEED", "DONE");
        console.log("[StressTest] Savollar kiritildi! (75 psixologik + 25 portret)");
      }
    } catch (e) {
      logError("SEED", "FAIL", e);
      console.error("[StressTest] Seed xato:", e);
    }
  });
}

const app = createApp(App);

app.config.errorHandler = (err, instance, info) => {
  logError("APP", "ERROR_BOUNDARY", { err, info, component: instance?.$options?.name || "anonymous" });
  console.error("[GlobalErrorBoundary]", { err, info, component: instance?.$options?.name || "anonymous" });
};

window.addEventListener("unhandledrejection", (event) => {
  logError("APP", "UNHANDLED_REJECTION", event.reason);
  console.error("[UnhandledPromiseRejection]", event.reason);
});

window.addEventListener("stresstest:unauthorized", async (event) => {
  const fromPath = event?.detail?.fromPath || window.location.pathname;
  const requestUrl = event?.detail?.requestUrl || "";
  logInfo("AUTH", "UNAUTHORIZED_EVENT", { fromPath, requestUrl });
  if (router.currentRoute.value.path !== "/auth/login") {
    try {
      await router.replace("/auth/login");
    } catch (err) {
      logError("AUTH", "UNAUTHORIZED_REDIRECT_FAIL", err);
    }
  }
});

app.use(pinia);
useThemeStore().init();
app.use(router);
app.use(VueApexCharts);

app.mount("#app");
logInfo("APP", "MOUNTED");
