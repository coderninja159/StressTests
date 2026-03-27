<template>
  <button
    type="button"
    class="btn"
    :class="variant"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading">Yuklanmoqda...</span>
    <span v-else><slot /></span>
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: "primary",
    validator: (v) => ["primary", "secondary", "danger"].includes(v),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["click"]);
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  border: 2px solid transparent;
  transition:
    opacity 0.15s,
    background 0.15s,
    border-color 0.15s,
    box-shadow 0.2s,
    transform 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn.primary {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.btn.primary:hover:not(:disabled) {
  background: var(--color-primary-hover, var(--color-primary));
}

.btn.secondary {
  background: color-mix(in srgb, var(--color-surface) 90%, transparent);
  color: var(--color-text);
  border-color: var(--color-border);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.btn.secondary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-bg) 88%, transparent);
  transform: translateY(-1px);
}

:global([data-theme="dark"]) .btn.secondary {
  background: rgba(18, 24, 42, 0.86);
  color: #eef2ff;
  border-color: rgba(165, 180, 252, 0.34);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
}

:global([data-theme="dark"]) .btn.secondary:hover:not(:disabled) {
  background: rgba(28, 36, 62, 0.94);
  border-color: rgba(165, 180, 252, 0.52);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.32), 0 0 0 1px rgba(129, 140, 248, 0.18);
}

.btn.danger {
  background: var(--color-danger);
  color: #fff;
  border-color: var(--color-danger);
}

.btn.danger:hover:not(:disabled) {
  filter: brightness(0.95);
}
</style>
