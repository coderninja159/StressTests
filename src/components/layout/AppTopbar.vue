<template>
  <header class="app-topbar">
    <div class="topbar-left">
      <button
        v-if="showNavToggle"
        type="button"
        class="app-topbar__menu"
        aria-label="Menyuni ochish yoki yopish"
        @click="layoutStore.toggleSidebar"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <slot name="title" />
    </div>
    <div class="topbar-right">
      <slot name="actions" />
      <button
        type="button"
        class="theme-toggle"
        :title="isDark ? 'Yorug\' rejim' : 'Qorong\'u rejim'"
        :aria-label="isDark ? 'Yorug\' rejim' : 'Qorong\'u rejim'"
        @click="themeStore.toggle"
      >
        <svg v-if="isDark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { useLayoutStore } from "../../stores/layout.js";
import { useThemeStore } from "../../stores/theme.js";

defineProps({
  showNavToggle: { type: Boolean, default: true },
});

const layoutStore = useLayoutStore();
const themeStore = useThemeStore();
const { isDark } = storeToRefs(themeStore);
</script>

<style scoped>
.app-topbar {
  height: 60px;
  background: var(--bg-card, var(--bg-card-prof, #fff));
  border-bottom: 1px solid var(--border-color, var(--border-color-prof, #e2e8f0));
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.75rem;
  position: sticky;
  top: 0;
  z-index: 40;
  flex-shrink: 0;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.app-topbar__menu {
  display: none;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm, 8px);
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-card, #fff);
  color: var(--text-primary, #0f172a);
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.app-topbar__menu:hover {
  border-color: var(--border-focus, #6366f1);
  background: var(--bg-hover, #f1f5f9);
}

@media (max-width: 1024px) {
  .app-topbar__menu {
    display: inline-flex;
  }

  .app-topbar {
    padding: 0 1rem;
  }
}

.theme-toggle {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm, 8px);
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-card, #fff);
  color: var(--text-secondary, #475569);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  flex-shrink: 0;
}

.theme-toggle:hover {
  background: var(--bg-hover, #f1f5f9);
  color: var(--text-primary, #0f172a);
  border-color: var(--color-primary, #6366f1);
}

:global([data-theme="dark"]) .app-topbar {
  background: rgba(9, 14, 26, 0.9);
  border-bottom-color: rgba(148, 163, 184, 0.2);
  backdrop-filter: blur(8px);
}

:global([data-theme="dark"]) .app-topbar__menu,
:global([data-theme="dark"]) .theme-toggle {
  background: rgba(15, 23, 42, 0.9);
  border-color: rgba(148, 163, 184, 0.35);
  color: rgba(226, 232, 240, 0.95);
}

:global([data-theme="dark"]) .app-topbar__menu:hover,
:global([data-theme="dark"]) .theme-toggle:hover {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(129, 140, 248, 0.6);
  color: #fff;
}
</style>
