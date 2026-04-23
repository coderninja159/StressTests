<template>
  <div class="adash-layout">
    <AdminSidebar />
    <main class="adash-main">
      <MobileHeader />

      <header class="adash-topbar">
        <div class="adash-topbar__left">
          <h1 class="adash-title">Bosh sahifa</h1>
          <p class="adash-date">Bugun: {{ todayFormatted }}</p>
        </div>
        <button type="button" class="btn-outline" :disabled="loading || !!errorMessage || exportingExcel" @click="exportExcel">
          <span v-if="exportingExcel" class="btn-spin" aria-hidden="true" />
          <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
          </svg>
          Hisobot yuklab olish
        </button>
      </header>
      <div class="adash-gradient-line" aria-hidden="true" />

      <div v-if="!supabaseOk" class="adash-alert">Supabase sozlanmagan.</div>

      <div v-else-if="errorMessage" class="adash-error-card">
        <p>{{ errorMessage }}</p>
        <button type="button" class="adash-btn" @click="load">Qayta urinish</button>
      </div>

      <template v-else>
        <section class="adash-kpi">
          <StatCard
            title="Jami maktablar"
            :value="stats.schools"
            :trend="schoolTrendPct"
            :loading="loading && !errorMessage"
            color="primary"
            :stagger-index="0"
          >
            <template #icon>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                <path d="M6 12h12" />
                <path d="M6 16h12" />
                <path d="M10 6h4" />
              </svg>
            </template>
          </StatCard>
          <StatCard
            title="Psixologlar"
            :value="stats.psychologists"
            :trend="null"
            :show-trend-badge="false"
            :loading="loading && !errorMessage"
            color="violet"
            :stagger-index="1"
          >
            <template #icon>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 11h-4" />
                <path d="M20 9v4" />
              </svg>
            </template>
          </StatCard>
          <StatCard
            title="O'quvchilar"
            :value="stats.students"
            :trend="null"
            :show-trend-badge="false"
            :loading="loading && !errorMessage"
            color="teal"
            :stagger-index="2"
          >
            <template #icon>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </template>
          </StatCard>
          <StatCard
            title="Bugungi testlar"
            :value="stats.testsToday"
            :trend="null"
            :show-trend-badge="false"
            :loading="loading && !errorMessage"
            color="amber"
            :stagger-index="3"
          >
            <template #icon>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="8" height="4" x="8" y="2" rx="1" />
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <path d="M12 11h4" />
                <path d="M12 16h4" />
              </svg>
            </template>
          </StatCard>
          <StatCard
            title="Yuqori xavf"
            :value="stats.highRiskStudents"
            :trend="null"
            :show-trend-badge="false"
            :loading="loading && !errorMessage"
            color="rose"
            :stagger-index="4"
          >
            <template #icon>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </template>
          </StatCard>
          <StatCard
            title="O'rta xavf"
            :value="stats.mediumRiskStudents"
            :trend="null"
            :show-trend-badge="false"
            :loading="loading && !errorMessage"
            color="amber"
            :stagger-index="5"
          >
            <template #icon>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </template>
          </StatCard>
        </section>

        <section class="adash-charts">
          <ChartCard title="Xavf darajasi taqsimoti" class="chart-cell" :loading="loading || chartsLoading">
            <div class="donut-wrap">
              <p v-if="!donutTotal" class="chart-empty">Ma'lumotlar yo'q.</p>
              <template v-else>
                <Doughnut :data="donutData" :options="donutOptions" />
                <div class="donut-center">
                  <span class="dc-num">{{ stats.students }}</span>
                  <span class="dc-lbl">o'quvchi</span>
                </div>
              </template>
            </div>
            <div v-if="donutTotal" class="donut-legend">
              <span class="lg-i"><i class="dot em" />Normal ({{ riskDonut.normal }})</span>
              <span class="lg-i"><i class="dot am" />O'rta ({{ riskDonut.medium }})</span>
              <span class="lg-i"><i class="dot ro" />Yuqori ({{ riskDonut.high }})</span>
            </div>
          </ChartCard>

          <ChartCard
            title="Test faolligi"
            subtitle="Natijalar bo'yicha kunlik"
            class="chart-cell"
            :loading="loading || chartsLoading"
            show-period-toggle
            :period="activityPeriod"
            @period-change="onActivityPeriod"
          >
            <p v-if="!lineHasData" class="chart-empty">Ma'lumotlar yo'q.</p>
            <div v-else class="chart-inner">
              <Line :data="lineData" :options="lineOptions" />
            </div>
          </ChartCard>

          <ChartCard title="Maktablar bo'yicha o'quvchilar" class="chart-cell chart-span-2" :loading="loading || chartsLoading">
            <p v-if="!barLabels.length" class="chart-empty">Ma'lumotlar yo'q.</p>
            <div v-else class="chart-inner chart-inner--tall">
              <Bar :data="barData" :options="barOptions" />
            </div>
          </ChartCard>

          <ChartCard title="Kategoriyalar o'rtacha tahlili" class="chart-cell" :loading="loading || chartsLoading">
            <p v-if="!radarHasData" class="chart-empty">Ma'lumotlar yo'q.</p>
            <div v-else class="chart-inner">
              <Radar :data="radarData" :options="radarOptions" />
            </div>
          </ChartCard>
        </section>

        <section class="adash-table-panel">
          <div class="adash-table-head">
            <div class="adash-table-head__left">
              <h2 class="adash-h2">Maktablar ro'yxati</h2>
              <span class="badge-count">{{ schoolRows.length }} ta maktab</span>
            </div>
            <div class="adash-table-head__right">
              <div class="search-wrap">
                <svg class="search-ic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input v-model="schoolSearch" type="search" class="search-input" placeholder="Maktab qidirish..." />
              </div>
              <label class="sort-select-wrap">
                <span class="visually-hidden">Ustun</span>
                <select v-model="tableSortKey" class="sort-select">
                  <option value="school_name">Maktab</option>
                  <option value="school_code">Kod</option>
                  <option value="total_students">O'quvchilar</option>
                  <option value="high_risk_count">Yuqori xavf</option>
                  <option value="is_active">Holati</option>
                </select>
              </label>
            </div>
          </div>

          <DataTable
            :columns="tableColumns"
            :rows="filteredSchoolsOnly"
            :loading="loading"
            :searchable="false"
            :page-size="10"
            pagination-mode="simple"
            row-key-field="school_id"
            :external-sort-key="tableSortKey"
            :external-sort-dir="tableSortDir"
            empty-message="Hech qanday maktab topilmadi"
            @sort="onTableSort"
          >
            <template #empty>
              <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-ic" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
                <path d="M8 8l6 6" />
                <path d="M14 8l-6 6" />
              </svg>
              <p>Hech qanday maktab topilmadi</p>
            </template>
            <template #cell-idx="{ index }">
              {{ index }}
            </template>
            <template #cell-school_name="{ row }">
              {{ row.school_name }}
            </template>
            <template #cell-school_code="{ row }">
              <code class="code-pill">{{ row.school_code }}</code>
            </template>
            <template #cell-total_students="{ row }">
              {{ row.total_students }}
            </template>
            <template #cell-hasPsychologist="{ row }">
              {{ row.hasPsychologist ? "Bor" : "Yo'q" }}
            </template>
            <template #cell-high_risk_count="{ row }">
              <span class="risk-badge" :class="{ zero: !row.high_risk_count }">{{ row.high_risk_count }}</span>
            </template>
            <template #cell-is_active="{ row }">
              <span class="status-pill" :class="row.is_active ? 'on' : 'off'">
                <i class="status-dot" />
                {{ row.is_active ? "Faol" : "Nofaol" }}
              </span>
            </template>
            <template #cell-actions="{ row }">
              <RouterLink class="link-action" :to="{ path: '/admin/schools', query: { q: row.school_name } }">Ko'rish</RouterLink>
            </template>
          </DataTable>
        </section>
      </template>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Doughnut, Line, Bar, Radar } from "vue-chartjs";
import {
  COLORS,
  createGradient,
  createHorizontalBarGradient,
} from "../../lib/chartSetup.js";

import AdminSidebar from "../../components/layout/AdminSidebar.vue";
import MobileHeader from "../../components/layout/MobileHeader.vue";
import StatCard from "../../components/ui/StatCard.vue";
import ChartCard from "../../components/ui/ChartCard.vue";
import DataTable from "../../components/ui/DataTable.vue";
import { api, getApiErrorMessage } from "../../lib/api";

const supabaseOk = true;
const loading = ref(true);
const chartsLoading = ref(true);
const errorMessage = ref("");
const exportingExcel = ref(false);

const stats = ref({
  schools: 0,
  psychologists: 0,
  students: 0,
  testsToday: 0,
  highRiskStudents: 0,
  mediumRiskStudents: 0,
});

const schoolsPrevMonth = ref(0);
const schoolRows = ref([]);
const schoolSearch = ref("");
const tableSortKey = ref("school_name");
const tableSortDir = ref("asc");

function onTableSort({ key, dir }) {
  tableSortKey.value = key;
  tableSortDir.value = dir;
}

watch(tableSortKey, () => {
  tableSortDir.value = "asc";
});
const activityPeriod = ref("week");
const allResults = ref([]);

const riskDonut = ref({ normal: 0, medium: 0, high: 0 });
const radarAvgs = ref({ delinquency: 0, addiction: 0, aggression: 0, self_harm: 0 });

const tableColumns = [
  { key: "idx", label: "#", sortable: false },
  { key: "school_name", label: "Maktab", sortable: true },
  { key: "school_code", label: "Kod", sortable: true },
  { key: "total_students", label: "O'quvchilar", sortable: true },
  { key: "hasPsychologist", label: "Psixolog", sortable: false },
  { key: "high_risk_count", label: "Yuqori xavf", sortable: true },
  { key: "is_active", label: "Holati", sortable: true },
  { key: "actions", label: "Amallar", sortable: false },
];


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

function dayKey(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return String(iso).slice(0, 10);
  }
}

function lastDayOfPreviousMonthIso() {
  const d = new Date();
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

const todayFormatted = computed(() => {
  try {
    return new Date().toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
});

const schoolTrendPct = computed(() => {
  const prev = schoolsPrevMonth.value;
  const cur = stats.value.schools;
  if (prev === 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
});

function onActivityPeriod(p) {
  activityPeriod.value = p;
}

const activityBuckets = computed(() => {
  const results = allResults.value;
  const n = activityPeriod.value === "week" ? 7 : 30;
  const labels = [];
  const counts = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    if (activityPeriod.value === "week") {
      labels.push(
        d.toLocaleDateString("uz-UZ", { weekday: "short" }),
      );
    } else {
      labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
    }
    counts.push(results.filter((r) => dayKey(r.taken_at) === key).length);
  }
  return { labels, counts };
});

const lineHasData = computed(() => activityBuckets.value.counts.some((c) => c > 0));

const lineData = computed(() => ({
  labels: activityBuckets.value.labels,
  datasets: [
    {
      label: "Testlar",
      data: activityBuckets.value.counts,
      borderColor: COLORS.primary,
      backgroundColor: (ctx) => {
        const { chart } = ctx;
        const { ctx: c2, chartArea } = chart;
        if (!chartArea) return hexToRgbaLocal(COLORS.primary, 0.15);
        return createGradient(c2, chartArea, COLORS.primary, 0.2);
      },
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2,
    },
  ],
}));

function hexToRgbaLocal(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

const tooltipDefaults = {
  backgroundColor: "#0f172a",
  titleColor: "#f8fafc",
  bodyColor: "#e2e8f0",
  borderColor: "rgba(51,65,85,0.9)",
  borderWidth: 1,
  padding: 12,
  cornerRadius: 10,
};

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 800, easing: "easeOutQuart" },
  plugins: {
    legend: { display: false },
    tooltip: { ...tooltipDefaults },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: COLORS.muted },
    },
    y: {
      beginAtZero: true,
      ticks: { stepSize: 1, color: COLORS.muted },
      grid: { color: "rgba(148, 163, 184, 0.2)" },
    },
  },
};

const donutTotal = computed(() => {
  const r = riskDonut.value;
  return r.normal + r.medium + r.high;
});

const donutData = computed(() => ({
  labels: ["Normal", "O'rta", "Yuqori"],
  datasets: [
    {
      data: [riskDonut.value.normal, riskDonut.value.medium, riskDonut.value.high],
      backgroundColor: [COLORS.emerald, COLORS.amber, COLORS.rose],
      borderWidth: 0,
    },
  ],
}));

const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "72%",
  animation: { animateRotate: true, duration: 1000 },
  plugins: {
    legend: { display: false },
    tooltip: { ...tooltipDefaults },
  },
};

const barLabels = computed(() => schoolRows.value.map((r) => r.school_name || "—").slice(0, 12));
const barCounts = computed(() => schoolRows.value.map((r) => r.total_students || 0).slice(0, 12));

const barData = computed(() => ({
  labels: barLabels.value,
  datasets: [
    {
      label: "O'quvchilar",
      data: barCounts.value,
      backgroundColor: (ctx) => {
        const { chart } = ctx;
        const { ctx: c2, chartArea } = chart;
        if (!chartArea) return COLORS.primary;
        return createHorizontalBarGradient(c2, chartArea, COLORS.primary, "#818CF8");
      },
      borderRadius: 6,
      barThickness: 20,
    },
  ],
}));

const barOptions = {
  indexAxis: "y",
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 800, easing: "easeOutQuart" },
  plugins: {
    legend: { display: false },
    tooltip: { ...tooltipDefaults },
  },
  scales: {
    x: {
      beginAtZero: true,
      grid: { color: "rgba(148, 163, 184, 0.2)" },
      ticks: { color: COLORS.muted },
    },
    y: {
      grid: { display: false },
      ticks: { color: COLORS.muted },
    },
  },
};

const radarHasData = computed(() => Object.values(radarAvgs.value).some((v) => v > 0));

const radarData = computed(() => ({
  labels: ["Huquqbuzarlik", "Zavisimlik", "Tajovuzkorlik", "O'z-o'ziga zarar"],
  datasets: [
    {
      label: "O'rtacha %",
      data: [
        radarAvgs.value.delinquency,
        radarAvgs.value.addiction,
        radarAvgs.value.aggression,
        radarAvgs.value.self_harm,
      ],
      backgroundColor: hexToRgbaLocal(COLORS.primary, 0.15),
      borderColor: COLORS.primary,
      pointBackgroundColor: COLORS.primary,
      pointRadius: 4,
      borderWidth: 2,
    },
  ],
}));

const radarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 800, easing: "easeOutQuart" },
  plugins: {
    legend: { display: false },
    tooltip: { ...tooltipDefaults },
  },
  scales: {
    r: {
      beginAtZero: true,
      suggestedMax: 100,
      angleLines: { color: "rgba(148, 163, 184, 0.25)" },
      grid: { color: "rgba(148, 163, 184, 0.2)" },
      pointLabels: { color: COLORS.muted },
      ticks: { color: COLORS.muted, backdropColor: "transparent" },
    },
  },
};

const filteredSchoolsOnly = computed(() => {
  const q = schoolSearch.value.trim().toLowerCase();
  let rows = schoolRows.value.map((r) => ({
    ...r,
    school_code: r.school_code,
    is_active: Boolean(r.is_active),
  }));
  if (q) rows = rows.filter((r) => String(r.school_name || "").toLowerCase().includes(q));
  return rows;
});

const schoolsSortedForExport = computed(() =>
  [...filteredSchoolsOnly.value].sort((a, b) =>
    String(a.school_name || "").localeCompare(String(b.school_name || ""), "uz"),
  ),
);

async function load() {
  loading.value = true;
  chartsLoading.value = true;
  errorMessage.value = "";
  try {
    const [{ data: statsResp }, { data: schoolsResp }, { data: psychResp }, { data: studentsResp }] = await Promise.all([
      api.get("/api/admin/stats"),
      api.get("/api/admin/schools"),
      api.get("/api/admin/psychologists"),
      api.get("/api/admin/students"),
    ]);

    const statsData = statsResp?.stats || statsResp || {};
    const schools = schoolsResp?.schools || [];
    const students = studentsResp?.students || [];
    const psychologists = psychResp?.psychologists || [];
    const psychBySchool = new Set(
      psychologists.map((p) => p.school_id || p.schoolId).filter(Boolean),
    );
    const results = statsResp?.results || [];
    allResults.value = results;

    const psychResults = (results || []).filter((r) => r.test_type === "psychological");
    const highUsers = new Set();
    const medUsers = new Set();
    for (const r of psychResults) {
      if (!r.user_id) continue;
      if (r.risk_level === "high") highUsers.add(r.user_id);
      else if (r.risk_level === "medium") medUsers.add(r.user_id);
    }

    riskDonut.value = {
      normal: psychResults.filter((r) => r.risk_level === "normal").length,
      medium: psychResults.filter((r) => r.risk_level === "medium").length,
      high: psychResults.filter((r) => r.risk_level === "high").length,
    };

    const catKeys = ["delinquency", "addiction", "aggression", "self_harm"];
    const catSums = Object.fromEntries(catKeys.map((k) => [k, { sum: 0, n: 0 }]));
    for (const r of psychResults) {
      const cs = r.category_scores;
      if (!cs || typeof cs !== "object") continue;
      for (const k of catKeys) {
        const pct = cs[k]?.percentage;
        if (typeof pct === "number" && !Number.isNaN(pct)) {
          catSums[k].sum += pct;
          catSums[k].n += 1;
        }
      }
    }
    const avgs = {};
    for (const k of catKeys) {
      avgs[k] = catSums[k].n ? Math.round((catSums[k].sum / catSums[k].n) * 10) / 10 : 0;
    }
    radarAvgs.value = avgs;

    const rows = schools.map((sch) => {
      const schoolStudents = students.filter(
        (u) => (u.school_id || u.schoolId) === sch.id,
      );
      const ids = new Set(schoolStudents.map((u) => u.id));
      const schoolPsychResults = psychResults.filter((r) => ids.has(r.user_id));
      const highRiskCount = schoolPsychResults.filter((r) => r.risk_level === "high").length;
      const totalStress = schoolPsychResults.reduce((sum, r) => sum + Number(r.total_score || 0), 0);
      const avgStress = schoolPsychResults.length
        ? Math.round((totalStress / schoolPsychResults.length) * 10) / 10
        : 0;
      return {
        school_id: sch.id,
        school_name: sch.name || sch.school_name,
        school_code: sch.code || sch.school_code,
        total_students: schoolStudents.length,
        high_risk_count: highRiskCount,
        avg_stress: avgStress,
        is_active: sch.is_active !== false,
        hasPsychologist: psychBySchool.has(sch.id),
      };
    });
    schoolRows.value = rows;

    stats.value = {
      schools: Number(statsData.schools ?? schools.length ?? 0),
      psychologists: Number(statsData.psychologists ?? psychologists.length ?? 0),
      students: Number(statsData.students ?? students.length ?? 0),
      testsToday: Number(statsData.testsToday ?? statsData.tests_today ?? 0),
      highRiskStudents: highUsers.size,
      mediumRiskStudents: medUsers.size,
    };
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error, "Ma'lumotlarni yuklashda xatolik yuz berdi.");
  } finally {
    loading.value = false;
    setTimeout(() => {
      chartsLoading.value = false;
    }, 320);
  }
}

function exportExcel() {
  exportingExcel.value = true;
  const run = () => {
    try {
      const d = new Date().toISOString().slice(0, 10);
      api
        .get("/api/admin/export", { responseType: "blob" })
        .then((resp) => {
          saveAs(new Blob([resp.data]), `hisobot-${d}.xlsx`);
        })
        .catch(() => {
      const wb = XLSX.utils.book_new();

      const schoolSheet = XLSX.utils.json_to_sheet(
        schoolsSortedForExport.value.map((r) => ({
          Maktab: r.school_name,
          Kod: r.school_code,
          Oquvchilar: r.total_students,
          Psixolog: r.hasPsychologist ? "Bor" : "Yo'q",
          Yuqori_xavf: r.high_risk_count,
          Holat: r.is_active ? "Faol" : "Nofaol",
          Sana: d,
        })),
      );
      schoolSheet["!cols"] = [{ wch: 28 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, schoolSheet, "Maktablar");

      const summary = [
        { Ko_satkich: "Jami maktablar", Qiymat: stats.value.schools },
        { Ko_satkich: "Psixologlar", Qiymat: stats.value.psychologists },
        { Ko_satkich: "Oquvchilar", Qiymat: stats.value.students },
        { Ko_satkich: "Bugungi testlar", Qiymat: stats.value.testsToday },
        { Ko_satkich: "Yuqori xavf (oquvchi)", Qiymat: stats.value.highRiskStudents },
        { Ko_satkich: "Orta xavf (oquvchi)", Qiymat: stats.value.mediumRiskStudents },
        { Ko_satkich: "Hisobot sanasi", Qiymat: d },
      ];
      const st = XLSX.utils.json_to_sheet(summary);
      st["!cols"] = [{ wch: 28 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, st, "Statistika");

      const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([out], { type: "application/octet-stream" }), `hisobot-${d}.xlsx`);
        });
    } finally {
      exportingExcel.value = false;
    }
  };
  requestAnimationFrame(run);
}

onMounted(load);
</script>

<style scoped>
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.adash-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-page, #f1f5f9);
  color: var(--text-primary-prof, #0f172a);
}

.adash-main {
  flex: 1;
  padding: 1.25rem 1.5rem 2.5rem;
  min-width: 0;
}

.adash-topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.35rem;
}

.adash-title {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-primary-prof, #0f172a);
}

.adash-date {
  margin: 0.35rem 0 0;
  font-size: 0.9rem;
  color: var(--text-secondary-prof, #475569);
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1rem;
  border-radius: var(--radius-md-prof, 12px);
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-card-prof, #fff);
  color: var(--text-primary-prof, #0f172a);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: border-color var(--duration-base, 250ms) var(--ease-out, ease), color var(--duration-base, 250ms) var(--ease-out, ease), box-shadow var(--duration-base, 250ms) var(--ease-out, ease);
}

.btn-outline:hover:not(:disabled) {
  border-color: var(--color-primary, #6366f1);
  color: var(--color-primary, #6366f1);
  box-shadow: var(--shadow-xs, 0 1px 2px rgba(0, 0, 0, 0.04));
}

.btn-outline:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-spin {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color, #e2e8f0);
  border-top-color: var(--color-primary, #6366f1);
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.adash-gradient-line {
  height: 3px;
  border-radius: var(--radius-full-prof, 9999px);
  background: linear-gradient(90deg, var(--color-primary, #6366f1), var(--color-teal, #14b8a6));
  margin-bottom: 1.5rem;
}

.adash-alert {
  padding: 0.75rem 1rem;
  background: var(--color-rose-muted, rgba(244, 63, 94, 0.08));
  color: var(--color-rose, #F43F5E);
  border: 1px solid color-mix(in srgb, var(--color-rose) 22%, transparent);
  border-radius: var(--radius-md-prof, 12px);
  font-weight: 600;
}

.adash-error-card {
  padding: 1.5rem;
  background: var(--bg-card-prof, #fff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-lg-prof, 16px);
  text-align: center;
  box-shadow: var(--shadow-card, var(--shadow-card-prof));
}

.adash-btn {
  margin-top: 0.75rem;
  padding: 0.55rem 1.15rem;
  border-radius: var(--radius-sm-prof, 8px);
  border: none;
  background: var(--color-primary, #6366f1);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.adash-kpi {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 1024px) {
  .adash-kpi {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 560px) {
  .adash-kpi {
    grid-template-columns: 1fr;
  }
}

.adash-charts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.chart-cell {
  min-width: 0;
}

.chart-span-2 {
  grid-column: 1 / -1;
}

@media (max-width: 1024px) {
  .adash-charts {
    grid-template-columns: 1fr;
  }

  .chart-span-2 {
    grid-column: auto;
  }
}

.chart-inner {
  height: 260px;
  position: relative;
}

.chart-inner--tall {
  height: min(380px, 55vh);
}

.chart-empty {
  margin: 0;
  padding: 2rem 0;
  text-align: center;
  color: var(--text-muted-prof, #94a3b8);
  font-size: 0.9rem;
}

.donut-wrap {
  position: relative;
  height: 240px;
}

.donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  padding-top: 0.5rem;
}

.dc-num {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-primary-prof, #0f172a);
}

.dc-lbl {
  font-size: 0.75rem;
  color: var(--text-muted-prof, #94a3b8);
  font-weight: 600;
  text-transform: lowercase;
}

.donut-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  justify-content: center;
  margin-top: 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary-prof, #475569);
}

.lg-i {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot.em {
  background: var(--color-emerald, #10b981);
}

.dot.am {
  background: var(--color-amber, #f59e0b);
}

.dot.ro {
  background: var(--color-rose, #f43f5e);
}

.adash-table-panel {
  background: var(--bg-card-prof, #fff);
  border-radius: var(--radius-lg-prof, 16px);
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--border-color, #e2e8f0);
  box-shadow: var(--shadow-card, var(--shadow-card-prof));
}

.adash-table-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.adash-table-head__left {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem;
}

.adash-h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary-prof, #0f172a);
}

.badge-count {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: var(--radius-full-prof, 9999px);
  background: var(--color-primary-muted, rgba(99, 102, 241, 0.1));
  color: var(--color-primary-dark, #4f46e5);
}

.adash-table-head__right {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  align-items: center;
}

.search-wrap {
  position: relative;
}

.search-ic {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted-prof, #94a3b8);
  pointer-events: none;
}

.search-input {
  width: 100%;
  min-width: 200px;
  padding: 0.55rem 0.75rem 0.55rem 2.4rem;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-sm-prof, 8px);
  font-size: 0.9rem;
  background: var(--bg-card-prof, #fff);
  transition: border-color var(--duration-fast, 150ms) var(--ease-out, ease), box-shadow var(--duration-fast, 150ms) var(--ease-out, ease);
}

.search-input:focus {
  outline: none;
  border-color: var(--border-focus, #6366f1);
  box-shadow: 0 0 0 3px var(--color-primary-muted, rgba(99, 102, 241, 0.12));
}

.sort-select {
  padding: 0.55rem 0.75rem;
  border-radius: var(--radius-sm-prof, 8px);
  border: 1px solid var(--border-color, #e2e8f0);
  font-weight: 600;
  font-size: 0.85rem;
  background: var(--bg-card-prof, #fff);
  color: var(--text-primary-prof, #0f172a);
  cursor: pointer;
}

.code-pill {
  font-size: 0.8rem;
  padding: 0.15rem 0.4rem;
  border-radius: var(--radius-xs-prof, 4px);
  background: var(--bg-page, #f1f5f9);
}

.risk-badge {
  display: inline-block;
  min-width: 1.5rem;
  text-align: center;
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-sm-prof, 8px);
  font-size: 0.78rem;
  font-weight: 800;
  background: #fee2e2;
  color: #be123c;
}

.risk-badge.zero {
  background: var(--bg-page, #f1f5f9);
  color: var(--text-muted-prof, #94a3b8);
  font-weight: 700;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary-prof, #475569);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-emerald, #10b981);
}

.status-pill.off .status-dot {
  background: var(--text-muted-prof, #94a3b8);
}

.link-action {
  color: var(--color-primary, #6366f1);
  font-weight: 700;
  text-decoration: none;
  font-size: 0.85rem;
}

.link-action:hover {
  text-decoration: underline;
}

.empty-ic {
  opacity: 0.4;
  color: var(--text-muted-prof, #94a3b8);
}
</style>