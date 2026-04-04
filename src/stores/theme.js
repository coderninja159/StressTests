import { computed, ref } from "vue";
import { defineStore } from "pinia";

/** Bitta manba: document.documentElement data-theme + localStorage */
export const useThemeStore = defineStore("theme", () => {
  const mode = ref("light");

  const isDark = computed(() => mode.value === "dark");

  function apply(next) {
    if (next !== "light" && next !== "dark") return;
    mode.value = next;
    const root = document.documentElement;
    root.setAttribute("data-theme", next);
    root.style.colorScheme = next === "dark" ? "dark" : "light";
    try {
      localStorage.setItem("ui-theme", next);
    } catch {
      /* private mode */
    }
  }

  function toggle() {
    apply(mode.value === "dark" ? "light" : "dark");
  }

  /** Pinia yuklangandan keyin, mountdan oldin chaqiring */
  function init() {
    try {
      const saved = localStorage.getItem("ui-theme");
      if (saved === "dark" || saved === "light") {
        apply(saved);
        return;
      }
    } catch {
      /* ignore */
    }
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    apply(prefersDark ? "dark" : "light");
  }

  return { mode, isDark, apply, toggle, init };
});
