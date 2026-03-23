<template>
  <aside class="sidebar">
    <div class="brand">StressTest</div>
    <p class="role">Psixolog paneli</p>
    <nav class="nav">
      <RouterLink to="/psychologist/dashboard" class="nav-link" active-class="active">
        Dashboard
      </RouterLink>
      <RouterLink to="/psychologist/students" class="nav-link" active-class="active">
        O'quvchilar
      </RouterLink>
    </nav>
    <button type="button" class="logout" :disabled="authStore.isLoading" @click="onLogout">
      Chiqish
    </button>
  </aside>
</template>

<script setup>
import { useAuthStore } from "../../stores/auth";

const authStore = useAuthStore();

const onLogout = async () => {
  try {
    await authStore.logout();
  } catch {
    // xabar store da
  }
};
</script>

<style scoped>
.sidebar {
  width: 220px;
  min-height: 100vh;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  padding: var(--space-5) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.brand {
  font-weight: 800;
  font-size: 1.15rem;
}

.role {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-muted);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-3);
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
  color: var(--color-text);
}

.logout {
  margin-top: auto;
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
