<template>
  <div class="api-error" role="alert">
    <p class="api-error__msg">{{ message }}</p>
    <div v-if="retryable" class="api-error__actions">
      <button type="button" class="btn btn-primary btn-sm" @click="$emit('retry')">Qayta urinish</button>
    </div>
    <details v-if="showDetails && details" class="api-error__details">
      <summary>Technical details</summary>
      <pre>{{ JSON.stringify(details, null, 2) }}</pre>
    </details>
  </div>
</template>

<script setup>
defineProps({
  message: { type: String, required: true },
  retryable: { type: Boolean, default: false },
  details: { type: Object, default: null },
  showDetails: { type: Boolean, default: false },
});
defineEmits(["retry"]);
</script>

<style scoped>
.api-error {
  border: 1px solid var(--color-danger, #ef4444);
  color: var(--color-danger, #ef4444);
  border-radius: 12px;
  padding: 12px;
  background: color-mix(in oklab, var(--color-danger, #ef4444) 10%, white);
}
.api-error__msg {
  margin: 0;
  font-weight: 600;
}
.api-error__actions {
  margin-top: 8px;
}
.api-error__details {
  margin-top: 8px;
}
.api-error__details pre {
  font-size: 12px;
  overflow: auto;
  margin: 8px 0 0;
}
</style>
