import { storeToRefs } from "pinia";
import { useThemeStore } from "../stores/theme.js";

/**
 * Mavzu: Pinia orqali (data-theme + localStorage).
 * localStorage kalitlari: ui-theme va theme (moslik).
 */
export function useTheme() {
  const themeStore = useThemeStore();
  const { isDark, mode } = storeToRefs(themeStore);

  function toggleTheme() {
    themeStore.toggle();
  }

  function initTheme() {
    themeStore.init();
  }

  return {
    isDark,
    mode,
    toggleTheme,
    initTheme,
  };
}
