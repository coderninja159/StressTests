<template>
  <div class="chart-card">
    <div class="chart-card__head">
      <div>
        <h3 class="chart-card__title">{{ title }}</h3>
        <p v-if="subtitle" class="chart-card__sub">{{ subtitle }}</p>
      </div>
      <div v-if="showPeriodToggle" class="period-toggle" role="group" aria-label="Davr">
        <button type="button" class="pt-btn" :class="{ active: modelPeriod === 'week' }" @click="setPeriod('week')">
          Bu hafta
        </button>
        <button type="button" class="pt-btn" :class="{ active: modelPeriod === 'month' }" @click="setPeriod('month')">
          Bu oy
        </button>
      </div>
    </div>
    <div class="chart-card__body">
      <div v-if="loading" class="chart-skel skeleton-pulse" aria-hidden="true" />
      <div v-else class="chart-slot" :class="{ 'is-in': !loading }">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  loading: { type: Boolean, default: false },
  showPeriodToggle: { type: Boolean, default: false },
  period: { type: String, default: "week" },
});

const emit = defineEmits(["update:period", "period-change"]);

const modelPeriod = ref(props.period);

watch(
  () => props.period,
  (v) => {
    modelPeriod.value = v;
  },
);

function setPeriod(p) {
  modelPeriod.value = p;
  emit("update:period", p);
  emit("period-change", p);
}
</script>

<style scoped>
.chart-card {
  background: var(--bg-card-prof, #fff);
  border-radius: var(--radius-lg-prof, 16px);
  padding: 1.5rem;
  box-shadow: var(--shadow-card, var(--shadow-card-prof));
  border: 1px solid var(--border-color, #e2e8f0);
}

.chart-card__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  margin-bottom: 1rem;
}

.chart-card__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary-prof, #0f172a);
}

.chart-card__sub {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  color: var(--text-muted-prof, #94a3b8);
}

.period-toggle {
  display: inline-flex;
  padding: 3px;
  background: var(--bg-page, #f1f5f9);
  border-radius: var(--radius-sm-prof, 8px);
  gap: 2px;
}

.pt-btn {
  border: none;
  background: transparent;
  padding: 0.35rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary-prof, #475569);
  border-radius: var(--radius-xs-prof, 4px);
  cursor: pointer;
  transition: background var(--duration-fast, 150ms) var(--ease-out, ease), color var(--duration-fast, 150ms) var(--ease-out, ease);
}

.pt-btn:hover {
  color: var(--text-primary-prof, #0f172a);
}

.pt-btn.active {
  background: var(--bg-card-prof, #fff);
  color: var(--color-primary, #6366f1);
  box-shadow: var(--shadow-xs, 0 1px 2px rgba(0, 0, 0, 0.04));
}

.chart-card__body {
  position: relative;
  min-height: 200px;
}

.chart-skel {
  position: absolute;
  inset: 0;
  min-height: 200px;
  border-radius: var(--radius-md-prof, 12px);
}

.chart-slot {
  position: relative;
  height: 100%;
  min-height: 200px;
  opacity: 0;
  transition: opacity 300ms var(--ease-out, ease);
}

.chart-slot.is-in {
  opacity: 1;
}
</style>
