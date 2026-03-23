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
    background 0.15s;
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
  background: #fff;
  color: var(--color-text);
  border-color: var(--color-border);
}

.btn.secondary:hover:not(:disabled) {
  background: var(--color-bg);
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
