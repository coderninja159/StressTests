<template>
  <div class="an-layout">
    <AdminSidebar />
    <div class="an-main">
      <MobileHeader />
      <AppTopbar :show-nav-toggle="true">
        <template #title>
          <div>
            <h1 class="page-title">Tahlil</h1>
            <p class="an-sub label-std">Maktablar va psixologlar statistikasi</p>
          </div>
        </template>
        <template #actions>
          <button type="button" class="an-btn" :disabled="exporting || loading" @click="exportFull">
            To‘liq hisobot (Excel)
          </button>
        </template>
      </AppTopbar>

      <div class="page-content">
        <div v-if="!supabaseOk" class="an-warn">Supabase sozlanmagan.</div>
        <div v-else-if="loading" class="an-skel"><div v-for="n in 6" :key="n" class="an-sk" /></div>
        <div v-else-if="loadError" class="an-err">
          <p>{{ loadError }}</p>
          <button type="button" class="an-btn" @click="loadAll">Qayta urinish</button>
        </div>
        <template v-else>
          <section class="stack-section card">
            <h2 class="section-title">Filtrlar</h2>
            <div class="an-filters">
              <label class="label-std">Maktab</label>
              <select v-model="filterSchoolId" class="ds-select an-fi">
                <option value="">Barchasi</option>
                <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
              <label class="label-std">Vaqt</label>
              <select v-model="rangePreset" class="ds-select an-fi">
                <option value="week">Bu hafta</option>
                <option value="month">Bu oy</option>
                <option value="year">Bu yil</option>
                <option value="all">Barcha vaqt</option>
              </select>
              <button type="button" class="an-btn" @click="loadAll">Yangilash</button>
            </div>
          </section>

          <section class="stack-section card">
            <h2 class="section-title">Maktablar solishtirma</h2>
            <div class="table-wrapper">
              <table class="an-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Maktab</th>
                    <th>O‘quvchilar</th>
                    <th>Testlar</th>
                    <th>Yuqori xavf %</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, i) in schoolRows" :key="row.id">
                    <td>{{ i + 1 }}</td>
                    <td>{{ row.name }}</td>
                    <td>{{ row.students }}</td>
                    <td>{{ row.tests }}</td>
                    <td>
                      <div class="an-bar"><div class="an-bar-in" :style="{ width: row.highPct + '%' }" /></div>
                      {{ row.highPct }}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="stack-section card an-chart-card an-donut-card">
            <h2 class="section-title">Xavf darajasi taqsimoti</h2>
            <p class="an-donut-hint label-std">
              Maktab filtri darhol qo‘llanadi. Vaqt oralig‘i o‘zgargach «Yangilash» ni bosing.
            </p>
            <div class="an-donut-body">
              <div
                class="an-donut-wrap"
                :class="{ 'an-donut-wrap--empty': riskDonutStats.total === 0 }"
              >
                <Doughnut
                  v-if="donutData"
                  :key="'donut-' + chartUiKey + '-' + riskDonutStats.total"
                  class="an-donut-canvas"
                  :data="donutData"
                  :options="donutOpts"
                />
                <div class="an-donut-center" aria-hidden="true">
                  <span class="an-donut-total">{{ riskDonutStats.total }}</span>
                  <span class="an-donut-sub">
                    {{
                      riskDonutStats.total === 0
                        ? "natija yo‘q"
                        : "psixologik test"
                    }}
                  </span>
                </div>
              </div>
              <div class="an-donut-legend" role="list">
                <div class="an-donut-legend-item" role="listitem">
                  <span class="an-dot an-dot--normal" aria-hidden="true" />
                  <span>Normal</span>
                  <strong>({{ riskDonutStats.normal }})</strong>
                </div>
                <div class="an-donut-legend-item" role="listitem">
                  <span class="an-dot an-dot--medium" aria-hidden="true" />
                  <span>O‘rta</span>
                  <strong>({{ riskDonutStats.medium }})</strong>
                </div>
                <div class="an-donut-legend-item" role="listitem">
                  <span class="an-dot an-dot--high" aria-hidden="true" />
                  <span>Yuqori</span>
                  <strong>({{ riskDonutStats.high }})</strong>
                </div>
              </div>
            </div>
          </section>

          <section class="stack-section card an-chart-card">
            <h2 class="section-title">Kunlik testlar (30 kun)</h2>
            <div class="chart-h chart-h--line">
              <Line
                v-if="lineData"
                :key="'line-' + chartUiKey"
                :data="lineData"
                :options="lineOpts"
              />
            </div>
          </section>

          <section class="stack-section card">
            <h2 class="section-title">Top 10 yuqori xavf (anonim)</h2>
            <p class="label-std">Ism ko‘rsatilmaydi</p>
            <div class="table-wrapper">
              <table class="an-table">
                <thead>
                  <tr>
                    <th>Sinf</th>
                    <th>Maktab</th>
                    <th>Xavf</th>
                    <th>Testlar soni</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(r, i) in topRisk" :key="i">
                    <td>{{ r.class_name || "—" }}</td>
                    <td>{{ r.school_name }}</td>
                    <td>{{ r.risk }}</td>
                    <td>{{ r.cnt }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Doughnut, Line } from "vue-chartjs";
import "../../lib/chartSetup.js";

import AdminSidebar from "../../components/layout/AdminSidebar.vue";
import MobileHeader from "../../components/layout/MobileHeader.vue";
import AppTopbar from "../../components/layout/AppTopbar.vue";
import { supabase } from "../../lib/supabase";

const supabaseOk = Boolean(supabase);
const loading = ref(true);
const loadError = ref("");
const exporting = ref(false);
const schools = ref([]);
const students = ref([]);
const results = ref([]);
const psychs = ref([]);
const filterSchoolId = ref("");
const rangePreset = ref("month");

/** Tema o‘zgarganda grafik ranglarini yangilash */
const chartUiKey = ref(0);
let chartThemeObserver = null;

onMounted(() => {
  chartThemeObserver = new MutationObserver(() => {
    chartUiKey.value += 1;
  });
  chartThemeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
});

onUnmounted(() => {
  chartThemeObserver?.disconnect();
});

function analyticsChartPalette() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  return {
    tick: dark ? "rgba(148, 163, 184, 0.95)" : "rgba(71, 85, 105, 0.95)",
    grid: dark ? "rgba(148, 163, 184, 0.08)" : "rgba(100, 116, 139, 0.12)",
    gridY: dark ? "rgba(148, 163, 184, 0.06)" : "rgba(100, 116, 139, 0.08)",
    tooltipBg: dark ? "rgba(17, 24, 39, 0.94)" : "rgba(255, 255, 255, 0.98)",
    tooltipBorder: dark ? "rgba(51, 65, 85, 0.6)" : "rgba(226, 232, 240, 1)",
    tooltipText: dark ? "#f1f5f9" : "#0f172a",
  };
}

function rangeStart() {
  const d = new Date();
  if (rangePreset.value === "week") {
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (rangePreset.value === "month") {
    d.setMonth(d.getMonth() - 1);
    return d;
  }
  if (rangePreset.value === "year") {
    d.setFullYear(d.getFullYear() - 1);
    return d;
  }
  return new Date(0);
}

async function loadAll() {
  if (!supabase) {
    loading.value = false;
    return;
  }
  loading.value = true;
  loadError.value = "";
  try {
    const { data: sch, error: e1 } = await supabase.from("schools").select("id, name");
    if (e1) throw e1;
    schools.value = sch || [];

    const { data: st, error: e2 } = await supabase.from("users").select("id, school_id, class_name, role").eq("role", "student");
    if (e2) throw e2;
    students.value = st || [];

    const { data: res, error: e3 } = await supabase
      .from("results")
      .select("id, user_id, test_type, risk_level, taken_at, category_scores");
    if (e3) throw e3;
    let rlist = res || [];
    const t0 = rangeStart();
    if (rangePreset.value !== "all") {
      rlist = rlist.filter((r) => new Date(r.taken_at) >= t0);
    }
    results.value = rlist;

    const { data: px, error: e4 } = await supabase
      .from("users")
      .select("id, full_name, school_id, role, created_at")
      .eq("role", "psychologist");
    if (e4) throw e4;
    psychs.value = px || [];
  } catch (e) {
    const msg = e?.message || e?.details || "";
    loadError.value = msg
      ? `Ma’lumot yuklanmadi: ${msg}`
      : "Ma’lumot yuklanmadi.";
  } finally {
    loading.value = false;
  }
}

const schoolRows = computed(() => {
  const sid = filterSchoolId.value;
  const list = sid ? schools.value.filter((s) => s.id === sid) : schools.value;
  return list
    .map((s) => {
      const studs = students.value.filter((u) => u.school_id === s.id);
      const ids = new Set(studs.map((u) => u.id));
      const tests = results.value.filter((r) => ids.has(r.user_id));
      const psych = tests.filter((r) => r.test_type === "psychological");
      const high = psych.filter((r) => r.risk_level === "high").length;
      const highPct = psych.length ? Math.round((high / psych.length) * 100) : 0;
      return {
        id: s.id,
        name: s.name,
        students: studs.length,
        tests: tests.length,
        highPct,
      };
    })
    .sort((a, b) => b.highPct - a.highPct);
});

/** Filtr: tanlangan maktab + allaqachon yuklangan vaqt oralig‘idagi natijalar */
const filteredPsychologicalResults = computed(() => {
  let list = results.value.filter((r) => r.test_type === "psychological");
  const sid = filterSchoolId.value;
  if (sid) {
    const allowed = new Set(
      students.value.filter((u) => u.school_id === sid).map((u) => u.id),
    );
    list = list.filter((r) => allowed.has(r.user_id));
  }
  return list;
});

const riskDonutStats = computed(() => {
  let normal = 0;
  let medium = 0;
  let high = 0;
  for (const r of filteredPsychologicalResults.value) {
    if (r.risk_level === "high") high += 1;
    else if (r.risk_level === "medium") medium += 1;
    else if (r.risk_level === "normal") normal += 1;
  }
  const total = normal + medium + high;
  return { normal, medium, high, total };
});

function donutSegmentColors() {
  const cs = getComputedStyle(document.documentElement);
  return {
    em: cs.getPropertyValue("--color-emerald").trim() || "#10b981",
    am: cs.getPropertyValue("--color-amber").trim() || "#f59e0b",
    ro: cs.getPropertyValue("--color-rose").trim() || "#f43f5e",
    mu: cs.getPropertyValue("--border-color").trim() || "#cbd5e1",
  };
}

const donutData = computed(() => {
  chartUiKey.value;
  const { normal, medium, high, total } = riskDonutStats.value;
  const c = donutSegmentColors();
  if (total === 0) {
    return {
      labels: [""],
      datasets: [
        {
          data: [1],
          backgroundColor: [c.mu],
          borderWidth: 0,
          hoverOffset: 0,
        },
      ],
    };
  }
  return {
    labels: ["Normal", "O‘rta", "Yuqori"],
    datasets: [
      {
        data: [normal, medium, high],
        backgroundColor: [c.em, c.am, c.ro],
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  };
});

const donutOpts = computed(() => {
  chartUiKey.value;
  const p = analyticsChartPalette();
  const total = riskDonutStats.value.total;
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: total > 0,
        backgroundColor: p.tooltipBg,
        titleColor: p.tooltipText,
        bodyColor: p.tooltipText,
        borderColor: p.tooltipBorder,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label(ctx) {
            const raw = Number(ctx.raw) || 0;
            const t = riskDonutStats.value.total || 1;
            const pct = Math.round((raw / t) * 1000) / 10;
            return ` ${ctx.label}: ${raw} (${pct}%)`;
          },
        },
      },
    },
  };
});

const lineData = computed(() => {
  const days = [];
  const psych = [];
  const port = [];
  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    days.push(`${dd}.${mm}`);
    psych.push(results.value.filter((r) => r.test_type === "psychological" && String(r.taken_at).startsWith(key)).length);
    port.push(results.value.filter((r) => r.test_type === "portrait" && String(r.taken_at).startsWith(key)).length);
  }
  return {
    labels: days,
    datasets: [
      {
        label: "Psixologik",
        data: psych,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99, 102, 241, 0.06)",
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHitRadius: 12,
      },
      {
        label: "Portret",
        data: port,
        borderColor: "#14b8a6",
        backgroundColor: "rgba(20, 184, 166, 0.05)",
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHitRadius: 12,
      },
    ],
  };
});

const lineOpts = computed(() => {
  chartUiKey.value;
  const p = analyticsChartPalette();
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    layout: { padding: { top: 10, right: 10, bottom: 6, left: 4 } },
    plugins: {
      legend: {
        display: true,
        position: "top",
        align: "start",
        labels: {
          boxWidth: 8,
          boxHeight: 8,
          padding: 16,
          usePointStyle: true,
          pointStyle: "circle",
          color: p.tick,
          font: { size: 12, weight: "500" },
        },
      },
      tooltip: {
        backgroundColor: p.tooltipBg,
        titleColor: p.tooltipText,
        bodyColor: p.tooltipText,
        borderColor: p.tooltipBorder,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: p.tick,
          maxRotation: 0,
          minRotation: 0,
          autoSkip: true,
          maxTicksLimit: 9,
          padding: 10,
          font: { size: 11 },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: p.grid,
          lineWidth: 1,
          tickLength: 0,
          drawBorder: false,
        },
        ticks: {
          color: p.tick,
          maxTicksLimit: 6,
          padding: 10,
          precision: 0,
          font: { size: 11 },
        },
      },
    },
  };
});

const topRisk = computed(() => {
  const byUser = new Map();
  for (const r of results.value) {
    if (r.test_type !== "psychological" || r.risk_level !== "high") continue;
    byUser.set(r.user_id, (byUser.get(r.user_id) || 0) + 1);
  }
  const rows = [];
  for (const [uid, cnt] of byUser) {
    const st = students.value.find((u) => u.id === uid);
    if (!st) continue;
    const sch = schools.value.find((s) => s.id === st.school_id);
    rows.push({
      class_name: st.class_name,
      school_name: sch?.name || "—",
      risk: "Yuqori",
      cnt,
    });
  }
  return rows.sort((a, b) => b.cnt - a.cnt).slice(0, 10);
});

async function exportFull() {
  exporting.value = true;
  try {
    const wb = XLSX.utils.book_new();
    const sh1 = XLSX.utils.json_to_sheet(schoolRows.value);
    XLSX.utils.book_append_sheet(wb, sh1, "Maktablar");
    const sh2 = XLSX.utils.json_to_sheet(
      psychs.value.map((p) => ({
        Psixolog: p.full_name,
        Maktab: schools.value.find((s) => s.id === p.school_id)?.name || "",
      })),
    );
    XLSX.utils.book_append_sheet(wb, sh2, "Psixologlar");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(topRisk.value), "Top xavf");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([out], { type: "application/octet-stream" }), `tahlil_${new Date().toISOString().slice(0, 10)}.xlsx`);
  } finally {
    exporting.value = false;
  }
}

loadAll();
</script>

<style scoped>
.an-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-page, #f1f5f9);
}

.an-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.an-sub {
  margin: 4px 0 0;
}

.an-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}

.an-fi {
  min-width: 180px;
}

.an-btn {
  padding: 10px 16px;
  border-radius: var(--radius-sm, 8px);
  border: none;
  background: var(--color-primary, #6366f1);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.an-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.an-table th,
.an-table td {
  padding: 0.875rem;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  text-align: left;
}

.an-bar {
  height: 8px;
  background: var(--border-color, #e2e8f0);
  border-radius: 4px;
  overflow: hidden;
  max-width: 120px;
}

.an-bar-in {
  height: 100%;
  background: var(--color-rose, #f43f5e);
}

.an-chart-card .section-title {
  margin-bottom: 0.5rem;
}

.an-donut-hint {
  margin: 0 0 1.25rem;
  max-width: 42rem;
  line-height: 1.45;
}

.an-donut-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.an-donut-wrap {
  position: relative;
  width: min(280px, 85vw);
  height: min(280px, 85vw);
  max-width: 280px;
  max-height: 280px;
}

.an-donut-wrap--empty .an-donut-canvas {
  opacity: 0.45;
}

.an-donut-canvas {
  position: relative;
  z-index: 0;
  width: 100% !important;
  height: 100% !important;
}

.an-donut-center {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  text-align: center;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  max-width: 55%;
}

.an-donut-total {
  font-size: clamp(1.75rem, 6vw, 2.35rem);
  font-weight: 800;
  line-height: 1;
  color: var(--text-primary, #0f172a);
  letter-spacing: -0.02em;
}

.an-donut-sub {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-muted, #94a3b8);
  line-height: 1.25;
}

.an-donut-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 1.25rem 1.75rem;
  margin-top: 0.75rem;
  padding-top: 0.25rem;
}

.an-donut-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: var(--text-secondary, #475569);
}

.an-donut-legend-item strong {
  color: var(--text-primary, #0f172a);
  font-weight: 700;
}

.an-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.an-dot--normal {
  background: var(--color-emerald, #10b981);
}

.an-dot--medium {
  background: var(--color-amber, #f59e0b);
}

.an-dot--high {
  background: var(--color-rose, #f43f5e);
}

.chart-h {
  position: relative;
  width: 100%;
}

.chart-h--line {
  height: min(340px, 48vh);
  min-height: 260px;
}

@media (max-width: 768px) {
  .chart-h--line {
    height: 280px;
    min-height: 240px;
  }

  .an-donut-wrap {
    width: min(240px, 88vw);
    height: min(240px, 88vw);
  }
}

.an-skel {
  display: grid;
  gap: 10px;
}

.an-sk {
  height: 56px;
  background: var(--border-color, #e2e8f0);
  border-radius: 10px;
}

.an-err,
.an-warn {
  padding: 14px;
  border-radius: 12px;
  background: rgba(244, 63, 94, 0.1);
  color: var(--risk, #b91c1c);
}
</style>
