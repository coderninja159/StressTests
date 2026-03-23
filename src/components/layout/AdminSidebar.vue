<template>
  <aside class="sidebar">
    <div class="brand">StressTest</div>
    <p class="role">Admin paneli</p>

    <nav class="nav">
      <RouterLink to="/admin/dashboard" class="nav-link" active-class="active">
        🏠 Bosh sahifa
      </RouterLink>
      <RouterLink to="/admin/schools" class="nav-link" active-class="active">
        🏫 Maktablar
      </RouterLink>
      <RouterLink to="/admin/psychologists" class="nav-link" active-class="active">
        👨‍⚕️ Psixologlar
      </RouterLink>
    </nav>

    <div class="footer">
      <p class="admin-name">{{ displayName }}</p>
      <button type="button" class="logout" :disabled="authStore.isLoading" @click="onLogout">
        🚪 Chiqish
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from "vue";

import { useAuthStore } from "../../stores/auth";

const authStore = useAuthStore();

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
.sidebar {
  width: 240px;
  min-height: 100vh;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  padding: var(--space-5) var(--space-4);
  display: flex;
  flex-direction: column;
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
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-weight: 600;
  text-decoration: none;
  border: 1px solid transparent;
}

.nav-link:hover {
  background: var(--color-bg);
}

.nav-link.active {
  background: color-mix(in srgb, var(--color-primary) 14%, white);
  border-color: var(--color-primary);
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
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: #fff;
  font-weight: 600;
  cursor: pointer;
}

.logout:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
