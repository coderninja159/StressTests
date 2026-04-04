<template>
  <article
    class="stat-card"
    :class="['c-' + color, { 'is-loading': loading }]"
    :style="delayStyle"
  >
    <div class="stat-top">
      <div class="stat-icon-wrap" aria-hidden="true">
        <slot name="icon">
          <svg v-if="iconPath" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path :d="iconPath" />
          </svg>
        </slot>
      </div>
      <div
        v-if="showTrendBadge && !loading && trend !== null && trend !== undefined"
        class="trend-badge"
        :class="trend >= 0 ? 'up' : 'down'"
      >
        {{ trend >= 0 ? "+" : "" }}{{ formatTrend(trend) }}%
      </div>
    </div>
    <div v-if="loading" class="sk-num skeleton skeleton--light" />
    <strong v-else class="stat-num" :key="value">{{ displayValue }}</strong>
    <p class="stat-title">{{ title }}</p>
    <p
      v-if="!loading && trendLine"
      class="stat-trend-line"
      :class="trend >= 0 ? 'up' : 'down'"
    >
      {{ trendLine }}
    </p>
  </article>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  title: { type: String, required: true },
  value: { type: Number, default: 0 },
  /** Foiz (musbat/manfiy), null — pastki trend matni ko'rinmasin */
  trend: { type: Number, default: null },
  /** Yuqori o'ng trend badge */
  showTrendBadge: { type: Boolean, default: true },
  /** Pastki qator matni; bo'sh bo'lsa trend asosida generatsiya */
  trendCaption: { type: String, default: "" },
  iconPath: { type: String, default: "" },
  color: {
    type: String,
    default: "primary",
    validator: (v) => ["primary", "teal", "rose", "amber", "emerald", "violet"].includes(v),
  },
  loading: { type: Boolean, default: false },
  /** fadeUp stagger: masalan 0.05s, 0.1s */
  staggerIndex: { type: Number, default: 0 },
});

const displayValue = ref(0);
let rafId = 0;

const delayStyle = computed(() => ({
  animationDelay: `${props.staggerIndex * 0.05}s`,
}));

function formatTrend(n) {
  const x = Math.round(n * 10) / 10;
  return Number.isInteger(x) ? String(x) : x.toFixed(1);
}

const trendLine = computed(() => {
  if (props.trend === null || props.trend === undefined) return "";
  if (props.trendCaption) return props.trendCaption;
  const sign = props.trend >= 0 ? "+" : "";
  return `O'tgan oyga nisbatan ${sign}${formatTrend(props.trend)}%`;
});

function runCountUp(target) {
  cancelAnimationFrame(rafId);
  const duration = 800;
  const startVal = 0;
  const startTime = performance.now();
  const tick = (now) => {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = 1 - (1 - t) ** 3;
    displayValue.value = Math.round(startVal + (target - startVal) * eased);
    if (t < 1) rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
}

watch(
  () => [props.value, props.loading],
  () => {
    if (props.loading) {
      cancelAnimationFrame(rafId);
      displayValue.value = 0;
      return;
    }
    runCountUp(Number(props.value) || 0);
  },
  { immediate: true },
);
</script>

<style scoped>
.stat-card {
  background: var(--bg-card-prof, #fff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-lg-prof, 16px);
  padding: 1.25rem 1.35rem;
  box-shadow: var(--shadow-card, var(--shadow-card-prof));
  transition: transform var(--duration-base, 250ms) var(--ease-out, ease),
    box-shadow var(--duration-base, 250ms) var(--ease-out, ease),
    border-color var(--duration-base, 250ms) var(--ease-out, ease);
  animation: fadeUp 0.45s var(--ease-out, ease) both;
}

.stat-card:hover:not(.is-loading) {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md-prof, 0 8px 24px rgba(0, 0, 0, 0.08));
  border-color: var(--color-primary-muted, rgba(99, 102, 241, 0.25));
}

.stat-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.stat-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md-prof, 12px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.trend-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.45rem;
  border-radius: var(--radius-full-prof, 9999px);
}

.trend-badge.up {
  background: var(--color-emerald-muted, rgba(16, 185, 129, 0.12));
  color: var(--color-emerald, #10b981);
}

.trend-badge.down {
  background: var(--color-rose-muted, rgba(244, 63, 94, 0.12));
  color: var(--color-rose, #f43f5e);
}

.sk-num {
  display: block;
  height: 2.75rem;
  width: 55%;
  margin-bottom: 0.35rem;
}

.stat-num {
  display: block;
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1.05;
  color: var(--text-primary-prof, #0f172a);
  letter-spacing: -0.02em;
}

.stat-title {
  margin: 0.35rem 0 0;
  font-size: 0.875rem;
  color: var(--text-secondary-prof, #475569);
  font-weight: 500;
}

.stat-trend-line {
  margin: 0.35rem 0 0;
  font-size: 0.78rem;
  font-weight: 600;
}

.stat-trend-line.up {
  color: var(--color-emerald, #10b981);
}

.stat-trend-line.down {
  color: var(--color-rose, #f43f5e);
}

.c-primary .stat-icon-wrap {
  background: var(--color-primary-muted);
  color: var(--color-primary, #6366f1);
}

.c-teal .stat-icon-wrap {
  background: var(--color-teal-muted);
  color: var(--color-teal, #14b8a6);
}

.c-rose .stat-icon-wrap {
  background: var(--color-rose-muted);
  color: var(--color-rose, #f43f5e);
}

.c-amber .stat-icon-wrap {
  background: var(--color-amber-muted);
  color: var(--color-amber, #f59e0b);
}

.c-emerald .stat-icon-wrap {
  background: var(--color-emerald-muted);
  color: var(--color-emerald, #10b981);
}

.c-violet .stat-icon-wrap {
  background: var(--color-violet-muted);
  color: var(--color-violet, #8b5cf6);
}
</style>
