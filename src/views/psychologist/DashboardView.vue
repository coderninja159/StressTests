<template>
  <div class="pdash-layout">
    <PsychologistSidebar />
    <main class="pdash-main">
      <MobileHeader />

      <transition name="banner-slide">
        <div
          v-if="highRiskCount > 0 && !bannerDismissed"
          class="risk-banner"
          role="alert"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          <span class="risk-banner__text">{{ highRiskCount }} ta o'quvchida yuqori xavf aniqlandi</span>
          <RouterLink class="risk-banner__btn" to="/psychologist/students">Ko'rish</RouterLink>
          <button type="button" class="risk-banner__close" aria-label="Yopish" @click="bannerDismissed = true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      </transition>

      <header class="pdash-head">
        <div>
          <h1 class="pdash-title">Bosh sahifa</h1>
          <p class="pdash-sub">{{ schoolLabel }}</p>
        </div>
      </header>

      <div v-if="!supabaseOk" class="pdash-alert">Supabase sozlanmagan.</div>
      <div v-else-if="!schoolId" class="pdash-alert">Maktab biriktirilmagan.</div>

      <div v-else-if="errorMessage" class="pdash-error-card">
        <p>{{ errorMessage }}</p>
        <button type="button" class="pdash-btn" @click="load">Qayta urinish</button>
      </div>

      <template v-else>
        <section class="pdash-kpi">
          <StatCard title="Mening o'quvchilarim" :value="totals.students" :trend="null" :show-trend-badge="false" :loading="loading" color="primary" :stagger-index="0">
            <template #icon>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </template>
          </StatCard>
          <StatCard title="Bu hafta testlar" :value="totals.weekTesters" :trend="null" :show-trend-badge="false" :loading="loading" color="teal" :stagger-index="1">
            <template #icon>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="8" height="4" x="8" y="2" rx="1" />
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <path d="M12 11h4" />
                <path d="M12 16h4" />
              </svg>
            </template>
          </StatCard>
          <StatCard title="Yuqori xavf" :value="highRiskCount" :trend="null" :show-trend-badge="false" :loading="loading" color="rose" :stagger-index="2">
            <template #icon>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </template>
          </StatCard>
          <StatCard title="Test topshirmaganlar" :value="totals.notTested" :trend="null" :show-trend-badge="false" :loading="loading" color="amber" :stagger-index="3">
            <template #icon>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </template>
          </StatCard>
        </section>

        <section class="filter-panel">
          <div class="filter-panel__inner">
            <label class="pf-field">
              <span>Sinf</span>
              <select v-model="filterClass" class="pf-input">
                <option value="all">Barchasi</option>
                <option v-for="c in classSelectOptions" :key="c" :value="c">{{ c }}</option>
              </select>
            </label>
            <label class="pf-field">
              <span>Xavf darajasi</span>
              <select v-model="filterRisk" class="pf-input">
                <option value="all">Barchasi</option>
                <option value="high">Yuqori</option>
                <option value="medium">O'rta</option>
                <option value="low">Normal</option>
                <option value="not_tested">Test yo'q</option>
              </select>
            </label>
            <label class="pf-field">
              <span>Boshlanish sanasi</span>
              <input v-model="filterDateFrom" type="date" class="pf-input" />
            </label>
            <label class="pf-field">
              <span>Tugash sanasi</span>
              <input v-model="filterDateTo" type="date" class="pf-input" />
            </label>
            <button type="button" class="btn-ghost-clear" title="Tozalash" @click="clearFilters">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
              Tozalash
            </button>
          </div>
        </section>

        <section id="statistika" class="pdash-charts">
          <ChartCard title="Sinflar bo'yicha xavf darajasi" class="chart-wide" :loading="loading || chartsLoading">
            <template v-if="stackLabels.length">
              <div class="chart-legend-top">
                <span><i class="lg-dot em" />Normal</span>
                <span><i class="lg-dot am" />O'rta</span>
                <span><i class="lg-dot ro" />Yuqori</span>
              </div>
            </template>
            <p v-if="!stackLabels.length" class="chart-empty">Ma'lumotlar yo'q.</p>
            <div v-else class="chart-inner chart-inner--mid">
              <Bar :data="stackBarData" :options="stackBarOptions" />
            </div>
          </ChartCard>

          <ChartCard title="Kategoriyalar o'rtacha" subtitle="Psixologik test" class="chart-narrow" :loading="loading || chartsLoading">
            <p v-if="!catHasData" class="chart-empty">Ma'lumotlar yo'q.</p>
            <div v-else class="chart-inner chart-inner--mid">
              <Bar :data="catBarData" :options="catBarOptions" />
            </div>
          </ChartCard>

          <ChartCard title="30 kunlik test faolligi" class="chart-full" :loading="loading || chartsLoading">
            <p v-if="!areaHasData" class="chart-empty">Ma'lumotlar yo'q.</p>
            <div v-else class="chart-inner chart-inner--wide">
              <Line :data="areaData" :options="areaOptions" />
            </div>
          </ChartCard>
        </section>

        <section class="students-panel">
          <div class="students-panel__head">
            <div class="students-panel__left">
              <h2 class="panel-title">O'quvchilar</h2>
              <span class="badge-count">{{ studentsEnriched.length }} ta</span>
            </div>
            <button type="button" class="btn-outline-dl" :disabled="loading || exportingExcel" @click="exportExcel">
              <span v-if="exportingExcel" class="btn-spin" aria-hidden="true" />
              <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              Excel yuklab olish
            </button>
          </div>

          <DataTable
            :columns="studentColumns"
            :rows="studentTableRows"
            :loading="loading"
            :searchable="false"
            :page-size="10"
            pagination-mode="numbers"
            row-key-field="id"
            empty-message="O'quvchilar topilmadi"
          >
            <template #cell-full_name="{ row }">
              <span class="name-cell">{{ row.full_name }}</span>
            </template>
            <template #cell-last_test="{ row }">
              <div class="last-test">
                <span class="last-test__d">{{ formatDate(row.last_test) }}</span>
                <span class="last-test__sub">{{ daysAgoText(row.last_test) }}</span>
              </div>
            </template>
            <template #cell-risk_level="{ row }">
              <span class="risk-pill" :class="'r-' + (row.risk_level || 'not_tested')">
                <i class="rp-dot" />
                {{ riskText(row.risk_level) }}
              </span>
            </template>
            <template #cell-actions="{ row }">
              <RouterLink
                v-if="row.detailRouteParam"
                class="row-action"
                :to="{ name: 'psychologist-student-detail', params: { studentId: row.detailRouteParam } }"
              >
                Ko'rish
              </RouterLink>
              <span v-else class="row-action row-action--disabled">—</span>
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
import { Line, Bar } from "vue-chartjs";
import { COLORS, createGradient, hexToRgba } from "../../lib/chartSetup.js";

import PsychologistSidebar from "../../components/layout/PsychologistSidebar.vue";
import MobileHeader from "../../components/layout/MobileHeader.vue";
import StatCard from "../../components/ui/StatCard.vue";
import ChartCard from "../../components/ui/ChartCard.vue";
import DataTable from "../../components/ui/DataTable.vue";
import {
  api,
  getApiErrorMessage,
  psychologistStudentsItems,
  coerceResultsArray,
  statsObject,
} from "../../lib/api";
import { studentPsychologistDetailParam } from "../../lib/studentsListHelpers.js";
import { useAuthStore } from "../../stores/auth";

function buildClassPresets() {
  const letters = ["A", "B", "C", "D"];
  const out = [];
  for (let g = 1; g <= 11; g += 1) {
    for (const L of letters) out.push(`${g}-${L}`);
  }
  return out;
}

const CLASS_PRESETS = buildClassPresets();

const authStore = useAuthStore();
const supabaseOk = true;
const schoolId = computed(() => authStore.currentUser?.school_id || authStore.currentUser?.schoolId || null);

const loading = ref(true);
const chartsLoading = ref(true);
const errorMessage = ref("");
const exportingExcel = ref(false);
const bannerDismissed = ref(false);

const schoolName = ref("");
const studentsRaw = ref([]);
const resultsRaw = ref([]);

const filterClass = ref("all");
const filterRisk = ref("all");
const filterDateFrom = ref("");
const filterDateTo = ref("");

const totals = ref({
  students: 0,
  weekTesters: 0,
  notTested: 0,
});

const radarAvgs = ref({ delinquency: 0, addiction: 0, aggression: 0, self_harm: 0 });
const areaLabels = ref([]);
const areaPsych = ref([]);
const areaPortrait = ref([]);

const schoolLabel = computed(() => schoolName.value || "Maktab");

const classSelectOptions = computed(() => {
  const set = new Set([...CLASS_PRESETS, ...studentsRaw.value.map((s) => s.class_name).filter(Boolean)]);
  return [...set].sort((a, b) => a.localeCompare(b, "uz"));
});

const studentsEnriched = computed(() => {
  const from = filterDateFrom.value ? new Date(filterDateFrom.value).getTime() : null;
  const to = filterDateTo.value ? new Date(filterDateTo.value).setHours(23, 59, 59, 999) : null;
  return studentsRaw.value.filter((s) => {
    if (filterClass.value !== "all" && s.class_name !== filterClass.value) return false;
    if (filterRisk.value !== "all" && s.risk_level !== filterRisk.value) return false;
    if (from != null || to != null) {
      const t = s.last_test_date ? new Date(s.last_test_date).getTime() : 0;
      if (from != null && t && t < from) return false;
      if (to != null && t && t > to) return false;
      if ((from != null || to != null) && !s.last_test_date) return false;
    }
    return true;
  });
});

const highRiskCount = computed(() => studentsRaw.value.filter((s) => s.risk_level === "high").length);

function clearFilters() {
  filterClass.value = "all";
  filterRisk.value = "all";
  filterDateFrom.value = "";
  filterDateTo.value = "";
}

watch(schoolId, () => {
  load();
});

const stackLabels = computed(() => {
  const byClass = new Map();
  for (const s of studentsEnriched.value) {
    const cn = s.class_name || "—";
    if (!byClass.has(cn)) byClass.set(cn, []);
    byClass.get(cn).push(s);
  }
  return [...byClass.keys()].sort((a, b) => a.localeCompare(b, "uz"));
});

const stackBarData = computed(() => {
  const labels = stackLabels.value;
  const norm = [];
  const med = [];
  const high = [];
  const byClass = new Map();
  for (const s of studentsEnriched.value) {
    const cn = s.class_name || "—";
    if (!byClass.has(cn)) byClass.set(cn, []);
    byClass.get(cn).push(s);
  }
  for (const cn of labels) {
    const studs = byClass.get(cn) || [];
    let n = 0;
    let m = 0;
    let h = 0;
    for (const s of studs) {
      if (s.risk_level === "high") h += 1;
      else if (s.risk_level === "medium") m += 1;
      else if (s.risk_level === "normal") n += 1;
    }
    norm.push(n);
    med.push(m);
    high.push(h);
  }
  return {
    labels,
    datasets: [
      { label: "Normal", data: norm, backgroundColor: COLORS.emerald, stack: "x", borderRadius: 4, barThickness: 16 },
      { label: "O'rta", data: med, backgroundColor: COLORS.amber, stack: "x", borderRadius: 4, barThickness: 16 },
      { label: "Yuqori", data: high, backgroundColor: COLORS.rose, stack: "x", borderRadius: 4, barThickness: 16 },
    ],
  };
});

const tooltipDefaults = {
  backgroundColor: "#0f172a",
  titleColor: "#f8fafc",
  bodyColor: "#e2e8f0",
  borderColor: "rgba(51,65,85,0.9)",
  borderWidth: 1,
  padding: 12,
  cornerRadius: 10,
};

const stackBarOptions = {
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
      stacked: true,
      beginAtZero: true,
      ticks: { stepSize: 1, color: COLORS.muted },
      grid: { color: "rgba(148, 163, 184, 0.2)" },
    },
    y: {
      stacked: true,
      grid: { display: false },
      ticks: { color: COLORS.muted },
    },
  },
};

const catKeysShort = ["Huquqbuzarlik", "Zavisimlik", "Tajovuzkorlik", "O'z-o'ziga zarar"];

const catHasData = computed(() => Object.values(radarAvgs.value).some((v) => v > 0));

const catBarData = computed(() => ({
  labels: catKeysShort,
  datasets: [
    {
      label: "O'rtacha %",
      data: [
        radarAvgs.value.delinquency,
        radarAvgs.value.addiction,
        radarAvgs.value.aggression,
        radarAvgs.value.self_harm,
      ],
      backgroundColor: (ctx) => {
        const i = ctx.dataIndex;
        const cols = [COLORS.primary, COLORS.violet, COLORS.teal, COLORS.amber];
        const c = cols[i % cols.length];
        const { chart } = ctx;
        const { ctx: c2, chartArea } = chart;
        if (!chartArea) return c;
        const { top, bottom } = chartArea;
        const g = c2.createLinearGradient(0, bottom, 0, top);
        g.addColorStop(0, hexToRgba(c, 0.35));
        g.addColorStop(1, hexToRgba(c, 0.95));
        return g;
      },
      borderRadius: 6,
      barThickness: 28,
    },
  ],
}));

const catBarOptions = {
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
      ticks: { color: COLORS.muted, maxRotation: 45, minRotation: 0, autoSkip: false },
    },
    y: {
      beginAtZero: true,
      suggestedMax: 100,
      grid: { color: "rgba(148, 163, 184, 0.15)" },
      ticks: { color: COLORS.muted },
    },
  },
};

const areaHasData = computed(() => areaPsych.value.some((c) => c > 0) || areaPortrait.value.some((c) => c > 0));

const areaData = computed(() => ({
  labels: areaLabels.value,
  datasets: [
    {
      label: "Psixologik",
      data: areaPsych.value,
      borderColor: COLORS.primary,
      tension: 0.35,
      fill: true,
      pointRadius: 0,
      borderWidth: 2,
      backgroundColor: (ctx) => {
        const { chart } = ctx;
        const { ctx: c2, chartArea } = chart;
        if (!chartArea) return hexToRgba(COLORS.primary, 0.12);
        return createGradient(c2, chartArea, COLORS.primary, 0.15);
      },
    },
    {
      label: "Portret",
      data: areaPortrait.value,
      borderColor: COLORS.teal,
      tension: 0.35,
      fill: true,
      pointRadius: 0,
      borderWidth: 2,
      backgroundColor: (ctx) => {
        const { chart } = ctx;
        const { ctx: c2, chartArea } = chart;
        if (!chartArea) return hexToRgba(COLORS.teal, 0.12);
        return createGradient(c2, chartArea, COLORS.teal, 0.15);
      },
    },
  ],
}));

const areaOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 800, easing: "easeOutQuart" },
  plugins: {
    legend: {
      display: true,
      position: "top",
      labels: { color: COLORS.muted, usePointStyle: true, boxWidth: 8 },
    },
    tooltip: { ...tooltipDefaults },
  },
  scales: {
    x: {
      grid: { color: "rgba(148, 163, 184, 0.12)" },
      ticks: { color: COLORS.muted, maxTicksLimit: 12 },
    },
    y: {
      beginAtZero: true,
      grid: { color: "rgba(148, 163, 184, 0.12)" },
      ticks: { color: COLORS.muted },
    },
  },
};

const studentColumns = [
  { key: "idx", label: "#", sortable: false },
  { key: "full_name", label: "To'liq ism", sortable: true },
  { key: "class_name", label: "Sinf", sortable: true },
  { key: "age", label: "Yosh", sortable: true },
  { key: "phone", label: "Tel", sortable: false },
  { key: "last_test", label: "Oxirgi test", sortable: true },
  { key: "risk_level", label: "Xavf darajasi", sortable: true },
  { key: "actions", label: "Amallar", sortable: false },
];

function dayKey(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return String(iso).slice(0, 10);
  }
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("uz-UZ");
  } catch {
    return "—";
  }
}

function daysAgoText(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, Math.floor((Date.now() - t) / 86400000));
  return `${diff} kun oldin`;
}

function riskText(level) {
  if (level === "high") return "Yuqori";
  if (level === "medium") return "O'rta";
  if (level === "normal") return "Normal";
  return "Test yo'q";
}

/** Jadval qatorlari: last_test va idx DataTable slotlari uchun */
const studentTableRows = computed(() =>
  studentsEnriched.value.map((s) => ({
    ...s,
    idx: 0,
    detailRouteParam: studentPsychologistDetailParam(s),
    last_test: s.last_test_date,
    phone: s.phone || "—",
    class_name: s.class_name || "—",
    age: s.age ?? "—",
  })),
);

async function load() {
  if (!schoolId.value) {
    loading.value = false;
    chartsLoading.value = false;
    return;
  }
  loading.value = true;
  chartsLoading.value = true;
  errorMessage.value = "";
  try {
    const [statsResp, studentsResp] = await Promise.all([
      api.get("/api/psychologist/stats"),
      api.get("/api/psychologist/students"),
    ]);
    const statsData = statsObject(statsResp.data);
    const students = psychologistStudentsItems(studentsResp.data);
    const allResults = coerceResultsArray(statsResp.data);
    const userIds = new Set(students.map((s) => s.id).filter(Boolean));
    const results = allResults.filter((r) => userIds.has(r.user_id));
    resultsRaw.value = results;
    schoolName.value = statsData.schoolName || authStore.currentUser?.schoolName || "";

    studentsRaw.value = students.map((s) => {
      const sid = s.student_id || s.studentId || "";
      const userResults = results.filter((r) => r.user_id === s.id);
      const last = [...userResults].sort((a, b) => new Date(b.taken_at) - new Date(a.taken_at))[0];
      return {
        ...s,
        student_code: sid,
        risk_level: last?.risk_level || "normal",
        last_test_date: last?.taken_at || null,
      };
    });

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const testersWeek = new Set(
      results
        .filter((r) => {
          const t = new Date(r.taken_at || 0).getTime();
          return !Number.isNaN(t) && t >= weekAgo;
        })
        .map((r) => r.user_id)
        .filter(Boolean),
    );
    totals.value = {
      students: students.length,
      weekTesters: testersWeek.size,
      notTested: Math.max(0, students.length - new Set(results.map((r) => r.user_id)).size),
    };

    const psych = results.filter((r) => r.test_type === "psychological");
    const catKeys = ["delinquency", "addiction", "aggression", "self_harm"];
    const catSums = Object.fromEntries(catKeys.map((k) => [k, { sum: 0, n: 0 }]));
    for (const r of psych) {
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

    const labels = [];
    const pCounts = [];
    const oCounts = [];
    for (let i = 29; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
      pCounts.push(results.filter((r) => dayKey(r.taken_at) === key && r.test_type === "psychological").length);
      oCounts.push(results.filter((r) => dayKey(r.taken_at) === key && r.test_type === "portrait").length);
    }
    areaLabels.value = labels;
    areaPsych.value = pCounts;
    areaPortrait.value = oCounts;
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error, "Ma'lumotlarni yuklashda xatolik.");
  } finally {
    loading.value = false;
    setTimeout(() => {
      chartsLoading.value = false;
    }, 320);
  }
}

onMounted(load);

function exportExcel() {
  exportingExcel.value = true;
  try {
    const d = new Date().toISOString().slice(0, 10);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        studentsEnriched.value.map((s) => ({
          Ism: s.full_name,
          Sinf: s.class_name,
          Yosh: s.age,
          Telefon: s.phone,
          Oxirgi_test: s.last_test_date,
          Xavf: riskText(s.risk_level),
          Student_ID: s.student_code,
        })),
      ),
      "O'quvchilar",
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        resultsRaw.value.map((r) => ({
          Sana: r.taken_at,
          User_id: r.user_id,
          Test_turi: r.test_type,
          Stress_foiz: r.total_score,
          Risk: r.risk_level,
        })),
      ),
      "Test natijalari",
    );

    const summary = [
      { Ko_satkich: "Huquqbuzarlik o'rtacha %", Qiymat: radarAvgs.value.delinquency },
      { Ko_satkich: "Zavisimlik o'rtacha %", Qiymat: radarAvgs.value.addiction },
      { Ko_satkich: "Tajovuzkorlik o'rtacha %", Qiymat: radarAvgs.value.aggression },
      { Ko_satkich: "O'z-o'ziga zarar o'rtacha %", Qiymat: radarAvgs.value.self_harm },
      { Ko_satkich: "Sana", Qiymat: d },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), "Statistika");

    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([out], { type: "application/octet-stream" }), `hisobot-${d}.xlsx`);
  } finally {
    exportingExcel.value = false;
  }
}
</script>

<style scoped>
.pdash-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-page, #f1f5f9);
  color: var(--text-primary-prof, #0f172a);
}

.pdash-main {
  flex: 1;
  padding: 1.25rem 1.5rem 2.5rem;
  min-width: 0;
}

.banner-slide-enter-active,
.banner-slide-leave-active {
  transition: opacity 0.35s var(--ease-out, ease), transform 0.35s var(--ease-out, ease);
}

.banner-slide-enter-from,
.banner-slide-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

.risk-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem;
  padding: 0.85rem 1rem;
  margin-bottom: 1rem;
  border-radius: var(--radius-md-prof, 12px);
  background: var(--color-rose-muted, rgba(244, 63, 94, 0.08));
  border: 1px solid color-mix(in srgb, var(--color-rose) 26%, transparent);
  color: var(--color-rose, #F43F5E);
  font-weight: 600;
  animation: slideDownBanner 0.45s var(--ease-out, ease) both;
}

.risk-banner__text {
  flex: 1;
  min-width: 200px;
}

.risk-banner__btn {
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-sm-prof, 8px);
  border: 1px solid color-mix(in srgb, var(--color-rose) 46%, transparent);
  background: transparent;
  color: var(--color-rose, #F43F5E);
  font-weight: 700;
  font-size: 0.8rem;
  text-decoration: none;
  transition: background var(--duration-fast, 150ms) ease;
}

.risk-banner__btn:hover {
  background: color-mix(in srgb, var(--color-rose) 12%, transparent);
}

.risk-banner__close {
  margin-left: auto;
  border: none;
  background: transparent;
  padding: 4px;
  cursor: pointer;
  color: inherit;
  border-radius: var(--radius-xs-prof, 4px);
  transition: background var(--duration-fast, 150ms) ease;
}

.risk-banner__close:hover {
  background: color-mix(in srgb, var(--color-rose) 9%, transparent);
}

.pdash-head {
  margin-bottom: 1.25rem;
}

.pdash-title {
  margin: 0;
  font-size: 1.55rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.pdash-sub {
  margin: 0.35rem 0 0;
  color: var(--text-secondary-prof, #475569);
  font-size: 0.95rem;
}

.pdash-alert {
  padding: 0.75rem 1rem;
  background: var(--color-rose-muted, rgba(244, 63, 94, 0.08));
  color: var(--color-rose, #F43F5E);
  border: 1px solid color-mix(in srgb, var(--color-rose) 18%, transparent);
  border-radius: var(--radius-md-prof, 12px);
  font-weight: 600;
}

.pdash-error-card {
  padding: 1.5rem;
  background: var(--bg-card-prof, #fff);
  border-radius: var(--radius-lg-prof, 16px);
  border: 1px solid var(--border-color, #e2e8f0);
  text-align: center;
  box-shadow: var(--shadow-card, var(--shadow-card-prof));
}

.pdash-btn {
  margin-top: 0.65rem;
  padding: 0.55rem 1.1rem;
  border: none;
  border-radius: var(--radius-sm-prof, 8px);
  background: var(--color-primary, #6366f1);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.pdash-kpi {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

@media (max-width: 1024px) {
  .pdash-kpi {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 520px) {
  .pdash-kpi {
    grid-template-columns: 1fr;
  }
}

.filter-panel {
  margin-bottom: 1.25rem;
}

.filter-panel__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem 1.25rem;
  padding: 1rem 1.5rem;
  background: var(--bg-card-prof, #fff);
  border-radius: var(--radius-md-prof, 12px);
  border: 1px solid var(--border-color, #e2e8f0);
  box-shadow: var(--shadow-xs, 0 1px 2px rgba(0, 0, 0, 0.04));
}

.pf-field span {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary-prof, #475569);
  margin-bottom: 0.35rem;
}

.pf-input {
  min-width: 140px;
  padding: 0.5rem 0.65rem;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-sm-prof, 8px);
  font-size: 0.88rem;
  background: var(--bg-card-prof, #fff);
  color: var(--text-primary-prof, #0f172a);
}

.btn-ghost-clear {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.75rem;
  border: 1px dashed var(--border-color, #e2e8f0);
  border-radius: var(--radius-sm-prof, 8px);
  background: transparent;
  color: var(--text-secondary-prof, #475569);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: border-color var(--duration-fast, 150ms) ease, color var(--duration-fast, 150ms) ease;
}

.btn-ghost-clear:hover {
  border-color: var(--color-rose, #f43f5e);
  color: var(--color-rose, #f43f5e);
}

.pdash-charts {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.chart-full {
  grid-column: 1 / -1;
}

.chart-legend-top {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.25rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary-prof, #475569);
  margin-bottom: 0.5rem;
}

.lg-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 0.35rem;
  vertical-align: middle;
}

.lg-dot.em {
  background: var(--color-emerald, #10b981);
}

.lg-dot.am {
  background: var(--color-amber, #f59e0b);
}

.lg-dot.ro {
  background: var(--color-rose, #f43f5e);
}

.chart-inner {
  position: relative;
  height: 260px;
}

.chart-inner--mid {
  height: 280px;
}

.chart-inner--wide {
  height: 300px;
}

.chart-empty {
  margin: 0;
  padding: 2rem;
  text-align: center;
  color: var(--text-muted-prof, #94a3b8);
}

@media (max-width: 1024px) {
  .pdash-charts {
    grid-template-columns: 1fr;
  }

  .chart-wide,
  .chart-narrow {
    grid-column: auto;
  }
}

.students-panel {
  background: var(--bg-card-prof, #fff);
  border-radius: var(--radius-lg-prof, 16px);
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--border-color, #e2e8f0);
  box-shadow: var(--shadow-card, var(--shadow-card-prof));
}

.students-panel__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.students-panel__left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.panel-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
}

.badge-count {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: var(--radius-full-prof, 9999px);
  background: var(--color-teal-muted, rgba(20, 184, 166, 0.12));
  color: var(--color-teal, #14b8a6);
}

.btn-outline-dl {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 0.95rem;
  border-radius: var(--radius-md-prof, 12px);
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-card-prof, #fff);
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  color: var(--text-primary-prof, #0f172a);
  transition: border-color var(--duration-base, 250ms) ease, color var(--duration-base, 250ms) ease;
}

.btn-outline-dl:hover:not(:disabled) {
  border-color: var(--color-primary, #6366f1);
  color: var(--color-primary, #6366f1);
}

.btn-outline-dl:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-spin {
  width: 16px;
  height: 16px;
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

.name-cell {
  font-weight: 600;
}

.last-test {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.last-test__d {
  font-weight: 600;
  font-size: 0.85rem;
}

.last-test__sub {
  font-size: 0.72rem;
  color: var(--text-muted-prof, #94a3b8);
}

.risk-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-full-prof, 9999px);
}

.rp-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.risk-pill.r-high {
  background: #ffe4e6;
  color: #be123c;
}

.risk-pill.r-high .rp-dot {
  background: var(--color-rose, #f43f5e);
}

.risk-pill.r-medium {
  background: #ffedd5;
  color: #c2410c;
}

.risk-pill.r-medium .rp-dot {
  background: var(--color-amber, #f59e0b);
}

.risk-pill.r-low {
  background: #d1fae5;
  color: #047857;
}

.risk-pill.r-low .rp-dot {
  background: var(--color-emerald, #10b981);
}

.risk-pill.r-not_tested {
  background: var(--bg-page, #f1f5f9);
  color: var(--text-muted-prof, #94a3b8);
}

.risk-pill.r-not_tested .rp-dot {
  background: var(--text-muted-prof, #94a3b8);
}

.row-action {
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--color-primary, #6366f1);
  text-decoration: none;
  opacity: 0;
  transition: opacity var(--duration-fast, 150ms) ease;
}

:deep(.dt-row:hover) .row-action {
  opacity: 1;
}

@media (hover: none) {
  .row-action {
    opacity: 1;
  }
}

.row-action--disabled {
  opacity: 1;
  color: var(--text-muted-prof, #94a3b8);
  pointer-events: none;
  font-weight: 500;
}
</style>
