<template>
  <div class="base-card">
    <slot />
  </div>
</template>

<style scoped>
.base-card {
  background: var(--bg-card);
  color: var(--text);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: box-shadow 0.28s var(--ease, cubic-bezier(0.4, 0, 0.2, 1)),
    transform 0.28s var(--ease, cubic-bezier(0.4, 0, 0.2, 1));
}

.base-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

[data-theme="dark"] .base-card {
  background: color-mix(in srgb, var(--surface-3) 78%, transparent);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(129, 140, 248, 0.14);
}

[data-theme="dark"] .base-card:hover {
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(165, 180, 252, 0.2);
}
</style>
