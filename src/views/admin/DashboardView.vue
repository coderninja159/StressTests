<template>
  <div class="layout admin-dashboard">
    <AdminSidebar />
    <main class="main">
      <MobileHeader />
      <h1>Bosh sahifa</h1>

      <div v-if="!supabaseOk" class="alert">Supabase sozlanmagan.</div>
      <LoadingSpinner v-else-if="loading" text="Ma'lumotlar yuklanmoqda..." />

      <template v-else-if="errorMessage">
        <p class="err">{{ errorMessage }}</p>
      </template>

      <template v-else>
        <div class="stats">
          <div class="stat blue">
            <span class="label">Jami maktablar</span>
            <span class="num">{{ counts.schools }}</span>
          </div>
          <div class="stat purple">
            <span class="label">Jami psixologlar</span>
            <span class="num">{{ counts.psychologists }}</span>
          </div>
          <div class="stat green">
            <span class="label">Jami o'quvchilar</span>
            <span class="num">{{ counts.students }}</span>
          </div>
          <div class="stat teal">
            <span class="label">Bugun topshirilgan testlar</span>
            <span class="num">{{ counts.testsToday }}</span>
          </div>
        </div>

        <section class="section">
          <h2>7 kunlik test faolligi</h2>
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
          <h2>Risk taqsimoti</h2>
          <div class="risk-grid">
            <div class="risk-item">
              <p>Yuqori</p>
              <strong>{{ riskStats.high }}</strong>
            </div>
            <div class="risk-item">
              <p>O'rta</p>
              <strong>{{ riskStats.medium }}</strong>
            </div>
            <div class="risk-item">
              <p>Normal</p>
              <strong>{{ riskStats.normal }}</strong>
            </div>
          </div>
        </section>

        <section class="section">
          <h2>Oxirgi maktablar</h2>
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Maktab nomi</th>
                  <th>Kod</th>
                  <th>O'quvchilar</th>
                  <th>Psixolog</th>
                  <th>Holat</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in schoolRows" :key="row.id">
                  <td>{{ row.name }}</td>
                  <td><code>{{ row.code }}</code></td>
                  <td>{{ row.studentCount }}</td>
                  <td>{{ row.hasPsychologist ? "Bor" : "Yo'q" }}</td>
                  <td>
                    <span :class="row.is_active ? 'ok' : 'off'">
                      {{ row.is_active ? "Aktiv" : "Nofaol" }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-if="!schoolRows.length" class="muted">Maktablar yo'q.</p>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";

import AdminSidebar from "../../components/layout/AdminSidebar.vue";
import MobileHeader from "../../components/layout/MobileHeader.vue";
import LoadingSpinner from "../../components/ui/LoadingSpinner.vue";
import { supabase } from "../../lib/supabase";

const supabaseOk = Boolean(supabase);
const loading = ref(true);
const errorMessage = ref("");
const counts = ref({
  schools: 0,
  psychologists: 0,
  students: 0,
  testsToday: 0,
});
const schoolRows = ref([]);
const riskStats = ref({ high: 0, medium: 0, normal: 0 });
const weeklySeries = ref([]);

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfTodayIso() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function startOfDayOffset(daysBefore) {
  const d = new Date();
  d.setDate(d.getDate() - daysBefore);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function load() {
  loading.value = true;
  errorMessage.value = "";
  counts.value = { schools: 0, psychologists: 0, students: 0, testsToday: 0 };
  schoolRows.value = [];

  if (!supabase) {
    loading.value = false;
    return;
  }

  try {
    const { count: cSchools, error: e1 } = await supabase
      .from("schools")
      .select("*", { count: "exact", head: true });

    if (e1) {
      throw e1;
    }

    const { count: cPsy, error: e2 } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "psychologist");

    if (e2) {
      throw e2;
    }

    const { count: cStu, error: e3 } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "student");

    if (e3) {
      throw e3;
    }

    const t0 = startOfTodayIso();
    const t1 = endOfTodayIso();
    const { count: cTests, error: e4 } = await supabase
      .from("results")
      .select("*", { count: "exact", head: true })
      .gte("taken_at", t0)
      .lte("taken_at", t1);

    if (e4) {
      throw e4;
    }

    counts.value = {
      schools: cSchools ?? 0,
      psychologists: cPsy ?? 0,
      students: cStu ?? 0,
      testsToday: cTests ?? 0,
    };

    const { data: schools, error: e5 } = await supabase
      .from("schools")
      .select("id, name, code, is_active, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (e5) {
      throw e5;
    }

    const ids = (schools || []).map((s) => s.id);
    let usersInSchools = [];
    if (ids.length) {
      const { data: u, error: e6 } = await supabase
        .from("users")
        .select("school_id, role")
        .in("school_id", ids);

      if (e6) {
        throw e6;
      }
      usersInSchools = u || [];
    }

    schoolRows.value = (schools || []).map((s) => {
      const rel = usersInSchools.filter((u) => u.school_id === s.id);
      const studentCount = rel.filter((u) => u.role === "student").length;
      const hasPsychologist = rel.some((u) => u.role === "psychologist");
      return {
        ...s,
        studentCount,
        hasPsychologist,
      };
    });

    const since = startOfDayOffset(6).toISOString();
    const { data: riskRows, error: e7 } = await supabase
      .from("results")
      .select("risk_level, taken_at, test_type")
      .gte("taken_at", since);
    if (e7) throw e7;

    const rr = riskRows || [];
    riskStats.value = {
      high: rr.filter((r) => r.test_type === "psychological" && r.risk_level === "high").length,
      medium: rr.filter((r) => r.test_type === "psychological" && r.risk_level === "medium").length,
      normal: rr.filter((r) => r.test_type === "psychological" && r.risk_level === "normal").length,
    };

    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const day = startOfDayOffset(i);
      const label = day.toLocaleDateString("uz-UZ", { weekday: "short" });
      const dayStr = day.toISOString().slice(0, 10);
      const value = rr.filter((r) => String(r.taken_at).slice(0, 10) === dayStr).length;
      days.push({ label, value });
    }
    const max = Math.max(...days.map((d) => d.value), 1);
    weeklySeries.value = days.map((d) => ({ ...d, height: (d.value / max) * 100 }));
  } catch {
    errorMessage.value = "Statistikani yuklashda xatolik yuz berdi.";
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
  font-size: 1.1rem;
  margin: 0 0 var(--space-3);
}

.alert,
.err {
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--color-danger) 12%, white);
  color: var(--color-danger);
  font-weight: 600;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.stat {
  padding: var(--s-5);
  border-radius: var(--r-xl);
  box-shadow: var(--sh-sm);
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  transition: var(--t-spr);
}

.stat:hover {
  transform: translateY(-3px);
  box-shadow: var(--sh-md);
}

.stat.blue {
  background: color-mix(in srgb, #3b82f6 12%, white);
  border: 1px solid color-mix(in srgb, #3b82f6 30%, white);
}

.stat.purple {
  background: color-mix(in srgb, #8b5cf6 12%, white);
  border: 1px solid color-mix(in srgb, #8b5cf6 28%, white);
}

.stat.green {
  background: color-mix(in srgb, #22c55e 12%, white);
  border: 1px solid color-mix(in srgb, #22c55e 30%, white);
}

.stat.teal {
  background: color-mix(in srgb, #14b8a6 12%, white);
  border: 1px solid color-mix(in srgb, #14b8a6 30%, white);
}

.label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-muted);
}

.num {
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
  background: linear-gradient(180deg, var(--brand-light), var(--brand));
  transform-origin: bottom;
  animation: growBar 0.5s var(--ease-out);
}

.chart-val { font-weight: 700; font-size: .85rem; }
.chart-lbl { color: var(--text-3); font-size: .76rem; text-transform: capitalize; }

.risk-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--s-3);
}

.risk-item {
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  padding: var(--s-4);
  background: var(--surface);
}

.risk-item p { margin: 0 0 var(--s-2); color: var(--text-3); font-size: .82rem; }
.risk-item strong { font-size: 1.35rem; font-family: 'Space Grotesk', sans-serif; }

.table-wrap {
  background: var(--surface);
  border-radius: var(--r-xl);
  border: 1px solid var(--border);
  overflow: auto;
  box-shadow: var(--sh-sm);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.table th,
.table td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.table th {
  background: var(--surface-2);
}

code {
  font-size: 0.9rem;
}

.ok {
  color: #166534;
  font-weight: 700;
}

.off {
  color: var(--color-muted);
  font-weight: 700;
}

.muted {
  padding: var(--s-3);
  margin: 0;
  color: var(--text-3);
}

@media (max-width: 768px) {
  .main { padding: var(--s-4); }
}

@media (max-width: 520px) {
  .risk-grid { grid-template-columns: 1fr; }
  .chart-wrap { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .table { min-width: 680px; }
}

@keyframes growBar {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}
</style>
