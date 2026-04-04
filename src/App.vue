<template>
  <button type="button" class="theme-switch" @click="toggleTheme" :aria-label="isDark ? 'Yorug\' rejim' : 'Qorong\'u rejim'">
    <svg v-if="isDark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>
    </svg>
    <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3c-.12.57-.18 1.16-.18 1.77A7 7 0 0 0 19.23 13c.61 0 1.2-.06 1.77-.21Z"></path>
    </svg>
  </button>
  <RouterView />
</template>

<script setup>
import { storeToRefs } from "pinia";
import { useThemeStore } from "./stores/theme.js";

const themeStore = useThemeStore();
const { isDark } = storeToRefs(themeStore);

function toggleTheme() {
  themeStore.toggle();
}
</script>
