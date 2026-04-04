<template>
  <div class="dash-sidebar-overlay" v-if="layoutStore.isSidebarOpen" @click="layoutStore.closeSidebar"></div>
  <aside class="dash-sidebar" :class="{ open: layoutStore.isSidebarOpen }">
    <div class="brand">StressTest</div>
    <p class="role">Psixolog paneli</p>
    <nav class="nav">
      <RouterLink to="/psychologist/dashboard" class="nav-link" active-class="active" @click="layoutStore.closeSidebar">
        <span class="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </span>
        Dashboard
      </RouterLink>
      <RouterLink to="/psychologist/students" class="nav-link" active-class="active" @click="layoutStore.closeSidebar">
        <span class="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </span>
        O'quvchilar
      </RouterLink>
      <RouterLink to="/psychologist/dashboard#statistika" class="nav-link" @click="layoutStore.closeSidebar">
        <span class="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
        </span>
        Statistika
      </RouterLink>
    </nav>

    <div class="footer">
      <div class="user-block">
        <div class="avatar" aria-hidden="true">{{ initials }}</div>
        <div class="user-meta">
          <span class="user-name">{{ displayName }}</span>
          <span class="user-role">Psixolog</span>
        </div>
      </div>
      <button type="button" class="logout" :disabled="authStore.isLoading" @click="onLogout">
        <span class="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
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

const displayName = computed(() => authStore.currentUser?.full_name || "Psixolog");

const initials = computed(() => {
  const n = displayName.value.trim();
  if (!n) return "P";
  const p = n.split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
});

const onLogout = async () => {
  try {
    await authStore.logout();
  } catch {
    // xabar store da
  }
};
</script>

<style scoped>
.dash-sidebar {
  --dash-sidebar-w: 252px;
  width: var(--dash-sidebar-w);
  flex: 0 0 var(--dash-sidebar-w);
  min-height: 100vh;
  background: var(--bg-sidebar, var(--bg-sidebar-prof, #0f172a));
  padding: var(--space-5, 20px) var(--space-4, 16px);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s var(--ease, ease);
  z-index: 100;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.18);
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
  font-size: 1.2rem;
  color: var(--text-sidebar-active, #fff);
}

.role {
  margin: var(--space-1, 4px) 0 var(--space-4, 16px);
  font-size: 0.85rem;
  color: var(--text-sidebar, rgba(255, 255, 255, 0.6));
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm, 8px);
  color: var(--text-sidebar, rgba(255, 255, 255, 0.6));
  font-weight: 600;
  text-decoration: none;
  border: 1px solid transparent;
  border-left: 3px solid transparent;
  transition: background 200ms ease, color 200ms ease, border-color 200ms ease;
}

.nav-icon {
  display: inline-flex;
  flex-shrink: 0;
  color: inherit;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.85);
}

.nav-link.active {
  background: rgba(99, 102, 241, 0.15);
  color: var(--text-sidebar-active, #fff);
  border-left-color: var(--color-primary, #6366f1);
}

.footer {
  margin-top: auto;
  padding-top: var(--space-4, 16px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.user-block {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full, 9999px);
  background: rgba(99, 102, 241, 0.25);
  color: var(--text-sidebar-active, #fff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 800;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-sidebar-active, #fff);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.75rem;
  color: var(--text-sidebar, rgba(255, 255, 255, 0.55));
}

.logout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--radius-sm, 8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-sidebar, rgba(255, 255, 255, 0.75));
  font-weight: 600;
  cursor: pointer;
  transition: background 200ms ease, border-color 200ms ease, color 200ms ease;
}

.logout:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-sidebar-active, #fff);
  border-color: rgba(255, 255, 255, 0.18);
}

.logout:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
