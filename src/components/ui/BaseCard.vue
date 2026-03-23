<template>
  <div class="base-card">
    <slot />
  </div>
</template>

<style scoped>
.base-card {
  background: #fff;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: 1.5rem;
  border: 1px solid var(--color-border);
}
</style>
