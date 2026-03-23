<template>
  <div class="field">
    <label v-if="label" :for="inputId">{{ label }}</label>
    <input
      :id="inputId"
      :type="type"
      :placeholder="placeholder"
      :value="modelValue"
      :disabled="disabled"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: "",
  },
  label: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "text",
  },
  placeholder: {
    type: String,
    default: "",
  },
  error: {
    type: String,
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  id: {
    type: String,
    default: "",
  },
});

defineEmits(["update:modelValue"]);

const inputId = computed(() => props.id || `input-${Math.random().toString(36).slice(2, 9)}`);
</script>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-weight: 600;
  font-size: 0.9rem;
}

input {
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  font: inherit;
  outline: none;
}

input:focus {
  border-color: var(--color-primary);
}

input:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.error {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-danger);
}
</style>
