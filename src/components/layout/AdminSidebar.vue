<template>
  <div class="dash-sidebar-overlay" v-if="layoutStore.isSidebarOpen" @click="layoutStore.closeSidebar"></div>
  <aside class="dash-sidebar" :class="{ open: layoutStore.isSidebarOpen }">
    <div class="brand">StressTest</div>
    <p class="role">Admin paneli</p>

    <nav class="nav">
      <RouterLink to="/admin/dashboard" class="nav-link" active-class="active" @click="layoutStore.closeSidebar">
        <span class="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.8V21h14V9.8"/></svg>
        </span>
        Bosh sahifa
      </RouterLink>
      <RouterLink to="/admin/schools" class="nav-link" active-class="active" @click="layoutStore.closeSidebar">
        <span class="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10 12 5l9 5-9 5-9-5Z"/><path d="M6 12v5c3 2.6 9 2.6 12 0v-5"/></svg>
        </span>
        Maktablar
      </RouterLink>
      <RouterLink to="/admin/psychologists" class="nav-link" active-class="active" @click="layoutStore.closeSidebar">
        <span class="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="3"/><path d="M5 20a7 7 0 0 1 14 0"/><path d="M19 7v6"/><path d="M22 10h-6"/></svg>
        </span>
        Psixologlar
      </RouterLink>
    </nav>

    <div class="footer">
      <p class="admin-name">{{ displayName }}</p>
      <button type="button" class="logout" :disabled="authStore.isLoading" @click="onLogout">
        <span class="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>
        </span>
        Chiqish
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from "vue";
import { useAuthStore } from "../../stores/auth";
import { useLayoutStore } from "../../stores/layout";

const authStore = useAuthStore();
const layoutStore = useLayoutStore();

const displayName = computed(() => authStore.currentUser?.full_name || "Administrator");

const onLogout = async () => {
  try {
    await authStore.logout();
  } catch {
    // store
  }
};
</script>

<style scoped>
.dash-sidebar {
  --dash-sidebar-w: 240px;
  width: var(--dash-sidebar-w);
  flex: 0 0 var(--dash-sidebar-w);
  min-height: 100vh;
  background: var(--color-surface);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-right: 1px solid var(--color-border);
  padding: var(--space-5) var(--space-4);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s var(--ease, ease);
  z-index: 100;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);
}

@media (max-width: 768px) {
  .dash-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    flex: none;
    width: min(var(--dash-sidebar-w), 88vw);
    transform: translateX(-100%);
  }

  .dash-sidebar.open {
    transform: translateX(0);
  }
}

.dash-sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
}

.brand {
  font-weight: 800;
  font-size: 1.15rem;
}

.role {
  margin: var(--space-1) 0 var(--space-4);
  font-size: 0.85rem;
  color: var(--color-muted);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-weight: 600;
  text-decoration: none;
  border: 1px solid transparent;
}
.nav-icon {
  display: inline-flex;
}

.nav-link:hover {
  background: var(--color-bg);
}

.nav-link.active {
  background: color-mix(in srgb, var(--color-primary) 16%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
  color: var(--color-text);
}

:global([data-theme="dark"]) .nav-link.active {
  background: rgba(129, 140, 248, 0.16);
  border-color: rgba(165, 180, 252, 0.45);
  color: #eceef8;
}

.footer {
  margin-top: auto;
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}

.admin-name {
  margin: 0 0 var(--space-2);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-muted);
}

.logout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
  transition: var(--t, all 0.2s ease);
}

.logout:hover {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-primary) 35%, transparent);
}

.logout:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

:global([data-theme="dark"]) .dash-sidebar {
  background: color-mix(in srgb, var(--sidebar-bg) 94%, transparent);
  box-shadow: 4px 0 32px rgba(0, 0, 0, 0.35);
}
</style>
