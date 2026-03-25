<template>
  <div class="layout psych-dashboard">
    <PsychologistSidebar />
    <main class="main">
      <MobileHeader />
      <h1>Dashboard</h1>

      <div v-if="!schoolId" class="warn">
        Maktab biriktirilmagan. Administrator bilan bog'laning.
      </div>

      <div v-else-if="loading" class="loading">
        <div class="spinner" />
        <span>Ma'lumotlar yuklanmoqda...</span>
      </div>

      <template v-else>
        <div class="stats">
          <div class="stat-card blue">
            <span class="stat-label">Jami o'quvchilar</span>
            <span class="stat-num">{{ totalStudents }}</span>
          </div>
          <div class="stat-card teal">
            <span class="stat-label">Bugun test topshirganlar</span>
            <span class="stat-num">{{ testedToday }}</span>
          </div>
          <div class="stat-card red">
            <span class="stat-label">Yuqori xavf</span>
            <span class="stat-num">{{ highRiskCount }}</span>
          </div>
          <div class="stat-card amber">
            <span class="stat-label">O'rta xavf</span>
            <span class="stat-num">{{ mediumRiskCount }}</span>
          </div>
        </div>

        <section class="section">
          <h2>7 kunlik faollik</h2>
          <div class="chart-wrap">
            <div v-for="d in weeklySeries" :key="d.label" class="chart-col">
              <div class="chart-bar-wrap">
                <div class="chart-bar" :style="{ height: d.height + '%' }"></div>
              </div>
              <div class="chart-val">{{ d.value }}</div>
              <div class="chart-lbl">{{ d.label }}</div>
            </div>
          </div>
        </section>

        <section class="section">
          <h2>Diqqat talab qiluvchi o'quvchilar</h2>
          <div class="risk-table">
            <div class="risk-row" v-for="row in topRiskRows" :key="row.user_id">
              <div>
                <strong>{{ row.studentName }}</strong>
                <p>{{ row.className || "—" }}</p>
              </div>
              <span class="badge b-high">{{ Math.round(row.score) }}%</span>
            </div>
            <p v-if="!topRiskRows.length" class="muted">Hozircha yuqori xavf yo'q.</p>
          </div>
        </section>

        <section class="section">
          <h2>Oxirgi testlar</h2>
          <p v-if="!recentRows.length" class="muted">Hozircha test natijalari yo'q.</p>
          <ul v-else class="list">
            <li v-for="row in recentRows" :key="row.id" class="list-item">
              <div class="li-main">
                <strong>{{ row.studentName }}</strong>
                <span class="muted">{{ row.className || "—" }} • {{ testTypeLabel(row.test_type) }}</span>
              </div>
              <div class="li-meta">
                <span class="badge" :class="riskClass(row.risk_level)">{{ riskText(row) }}</span>
                <span class="date">{{ formatDate(row.taken_at) }}</span>
              </div>
              <RouterLink
                class="btn-sm"
                :to="'/psychologist/students/' + row.user_id"
              >
                Batafsil
              </RouterLink>
            </li>
          </ul>
        </section>
      </template>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";

import PsychologistSidebar from "../../components/layout/PsychologistSidebar.vue";
import MobileHeader from "../../components/layout/MobileHeader.vue";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/auth";

const authStore = useAuthStore();

const loading = ref(true);
const students = ref([]);
const results = ref([]);
const weeklySeries = ref([]);

const schoolId = computed(() => authStore.currentUser?.school_id ?? null);

const studentIds = computed(() => students.value.map((s) => s.id));

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

const latestPsychByStudent = computed(() => {
  const map = new Map();
  const psych = results.value.filter((r) => r.test_type === "psychological");
  for (const r of psych) {
    const prev = map.get(r.user_id);
    if (!prev || new Date(r.taken_at) > new Date(prev.taken_at)) {
      map.set(r.user_id, r);
    }
  }
  return map;
});

const totalStudents = computed(() => students.value.length);

const testedToday = computed(() => {
  const start = startOfTodayIso();
  const ids = new Set(studentIds.value);
  const seen = new Set();
  for (const r of results.value) {
    if (!ids.has(r.user_id)) {
      continue;
    }
    if (r.taken_at && r.taken_at >= start) {
      seen.add(r.user_id);
    }
  }
  return seen.size;
});

const highRiskCount = computed(() => {
  let n = 0;
  for (const r of latestPsychByStudent.value.values()) {
    if (r.risk_level === "high") {
      n += 1;
    }
  }
  return n;
});

const mediumRiskCount = computed(() => {
  let n = 0;
  for (const r of latestPsychByStudent.value.values()) {
    if (r.risk_level === "medium") {
      n += 1;
    }
  }
  return n;
});

const studentNameById = computed(() => {
  const m = new Map();
  for (const s of students.value) {
    m.set(s.id, s.full_name || "Nomsiz");
  }
  return m;
});

const studentClassById = computed(() => {
  const m = new Map();
  for (const s of students.value) {
    m.set(s.id, s.class_name);
  }
  return m;
});

const recentRows = computed(() => {
  const ids = new Set(studentIds.value);
  const sorted = [...results.value]
    .filter((r) => ids.has(r.user_id))
    .sort((a, b) => new Date(b.taken_at) - new Date(a.taken_at))
    .slice(0, 5);
  return sorted.map((r) => ({
    ...r,
    studentName: studentNameById.value.get(r.user_id) || "—",
    className: studentClassById.value.get(r.user_id),
  }));
});

const topRiskRows = computed(() => {
  const arr = [];
  for (const r of latestPsychByStudent.value.values()) {
    const score = r?.category_scores?.summary?.overall_percentage ?? 0;
    if (score < 60) continue;
    arr.push({
      ...r,
      score,
      studentName: studentNameById.value.get(r.user_id) || "—",
      className: studentClassById.value.get(r.user_id),
    });
  }
  return arr.sort((a, b) => b.score - a.score).slice(0, 5);
});

function testTypeLabel(t) {
  if (t === "psychological") return "Psixologik";
  if (t === "portrait") return "Portret";
  return t || "—";
}

function riskText(row) {
  if (row.test_type !== "psychological" || !row.risk_level) {
    return "—";
  }
  if (row.risk_level === "high") return "Yuqori";
  if (row.risk_level === "medium") return "O'rta";
  if (row.risk_level === "normal") return "Normal";
  return row.risk_level;
}

function riskClass(level) {
  if (level === "high") return "b-high";
  if (level === "medium") return "b-med";
  if (level === "normal") return "b-norm";
  return "b-muted";
}

function formatDate(iso) {
  if (!iso) {
    return "—";
  }
  try {
    return new Date(iso).toLocaleString("uz-UZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function startOfDayOffset(daysBefore) {
  const d = new Date();
  d.setDate(d.getDate() - daysBefore);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function load() {
  loading.value = true;
  students.value = [];
  results.value = [];

  if (!supabase || !schoolId.value) {
    loading.value = false;
    return;
  }

  try {
    const { data: studs, error: e1 } = await supabase
      .from("users")
      .select("id, full_name, class_name")
      .eq("role", "student")
      .eq("school_id", schoolId.value);

    if (e1) {
      throw e1;
    }

    students.value = studs || [];

    if (!studentIds.value.length) {
      return;
    }

    const { data: res, error: e2 } = await supabase
      .from("results")
      .select("id, user_id, test_type, risk_level, taken_at, category_scores")
      .in("user_id", studentIds.value)
      .order("taken_at", { ascending: false });

    if (e2) {
      throw e2;
    }

    results.value = res || [];

    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const day = startOfDayOffset(i);
      const dayStr = day.toISOString().slice(0, 10);
      const label = day.toLocaleDateString("uz-UZ", { weekday: "short" });
      const value = (res || []).filter((r) => String(r.taken_at).slice(0, 10) === dayStr).length;
      days.push({ label, value });
    }
    const max = Math.max(...days.map((d) => d.value), 1);
    weeklySeries.value = days.map((d) => ({ ...d, height: (d.value / max) * 100 }));
  } catch {
    students.value = [];
    results.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  load();
});
</script>


<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
}

.main {
  flex: 1;
  padding: var(--s-6);
  width: 100%;
}

h1 {
  margin: 0 0 var(--space-5);
}

h2 {
  margin: 0 0 var(--space-3);
  font-size: 1.1rem;
}

.warn {
  padding: var(--space-4);
  background: color-mix(in srgb, #eab308 15%, white);
  border-radius: var(--radius-sm);
}

.loading {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.stat-card {
  padding: var(--s-5);
  border-radius: var(--r-xl);
  box-shadow: var(--sh-sm);
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  transition: var(--t-spr);
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--sh-md);
}

.stat-card.blue {
  background: color-mix(in srgb, #3b82f6 12%, white);
  border: 1px solid color-mix(in srgb, #3b82f6 35%, white);
}

.stat-card.teal {
  background: color-mix(in srgb, #14b8a6 12%, white);
  border: 1px solid color-mix(in srgb, #14b8a6 35%, white);
}

.stat-card.red {
  background: color-mix(in srgb, #ef4444 12%, white);
  border: 1px solid color-mix(in srgb, #ef4444 30%, white);
}

.stat-card.amber {
  background: color-mix(in srgb, #eab308 14%, white);
  border: 1px solid color-mix(in srgb, #eab308 40%, white);
}

.stat-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-muted);
}

.stat-num {
  font-size: 2rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.section {
  margin-top: var(--space-4);
}

.chart-wrap {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: var(--s-3);
  padding: var(--s-4);
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  background: var(--surface);
  box-shadow: var(--sh-sm);
}

.chart-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.chart-bar-wrap {
  height: 120px;
  width: 100%;
  display: flex;
  align-items: flex-end;
}

.chart-bar {
  width: 100%;
  border-radius: var(--r-sm);
  min-height: 6px;
  background: linear-gradient(180deg, #60a5fa, var(--brand));
  transform-origin: bottom;
  animation: growBar .5s var(--ease-out);
}

.chart-val { font-weight: 700; font-size: .85rem; }
.chart-lbl { color: var(--text-3); font-size: .76rem; text-transform: capitalize; }

.risk-table {
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  background: var(--surface);
  box-shadow: var(--sh-sm);
}

.risk-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--s-4);
  border-bottom: 1px solid var(--border);
}

.risk-row:last-child { border-bottom: 0; }
.risk-row p { margin: 2px 0 0; color: var(--text-3); font-size: .8rem; }

.muted {
  color: var(--color-muted);
  font-size: 0.95rem;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.list-item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-surface);
  border-radius: var(--r-xl);
  border: 1px solid var(--border);
  box-shadow: var(--sh-xs);
  transition: var(--t);
}

.list-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--sh-sm);
}

.li-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.li-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.badge {
  font-size: 0.8rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
}

.badge.b-high {
  background: color-mix(in srgb, #ef4444 20%, white);
  color: #991b1b;
}

.badge.b-med {
  background: color-mix(in srgb, #eab308 22%, white);
  color: #854d0e;
}

.badge.b-norm {
  background: color-mix(in srgb, #22c55e 20%, white);
  color: #166534;
}

.badge.b-muted {
  background: var(--color-border);
  color: var(--color-muted);
}

.date {
  font-size: 0.85rem;
  color: var(--color-muted);
}

.btn-sm {
  padding: 8px 14px;
  border-radius: var(--r-md);
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
  text-decoration: none;
  text-align: center;
  font-size: 0.9rem;
}

@media (max-width: 720px) {
  .main { padding: var(--s-4); }
  .chart-wrap { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .list-item {
    grid-template-columns: 1fr;
  }

  .li-meta {
    align-items: flex-start;
  }
}

@keyframes growBar {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}
</style>
