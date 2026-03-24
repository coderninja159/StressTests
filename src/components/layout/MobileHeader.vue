<template>
  <header class="mobile-header">
    <div class="mobile-header-brand">StressTest</div>
    <button class="mobile-menu-btn" @click="layoutStore.toggleSidebar" aria-label="Menyuni ochish">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256">
        <path fill="currentColor" d="M224 128a8 8 0 0 1-8 8H40a8 8 0 0 1 0-16h176a8 8 0 0 1 8 8ZM40 72h176a8 8 0 0 0 0-16H40a8 8 0 0 0 0 16Zm176 112H40a8 8 0 0 0 0 16h176a8 8 0 0 0 0-16Z"/>
      </svg>
    </button>
  </header>
</template>

<script setup>
import { useLayoutStore } from '../../stores/layout'

const layoutStore = useLayoutStore()
</script>

<style scoped>
.mobile-header {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 90;
}

.mobile-header-brand {
  font-weight: 800;
  font-size: 1.15rem;
  color: var(--text);
}

.mobile-menu-btn {
  background: none;
  border: none;
  color: var(--text);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}

.mobile-menu-btn:hover {
  opacity: 0.7;
}

@media (max-width: 768px) {
  .mobile-header {
    display: flex;
  }
}
</style>
