<template>
  <div class="students-pro">
    <PsychologistSidebar />
    <main class="students-main">
      <MobileHeader />

      <header class="top-bar">
        <div class="top-bar__titles">
          <h1>O'quvchilar</h1>
          <p class="top-bar__sub">Maktab psixologi uchun professional boshqaruv paneli</p>
        </div>
      </header>

      <div v-if="!schoolId" class="panel-warn">
        <AlertCircle :size="22" stroke-width="2" class="panel-warn__ic" />
        <span>Maktab biriktirilmagan.</span>
      </div>

      <div v-else-if="loading" class="panel-loading">
        <div class="spinner" />
        <span>Yuklanmoqda...</span>
      </div>

      <div v-else-if="loadError" class="panel-warn" style="border-color: var(--st-border2, #cbd5e1)">
        <AlertCircle :size="22" stroke-width="2" class="panel-warn__ic" />
        <span>{{ loadError }}</span>
      </div>

      <template v-else>
        <section class="stats-grid">
          <article class="stat-card stat-card--1" :style="{ animationDelay: '0ms' }">
            <div class="stat-card__blob" aria-hidden="true" />
            <Users :size="22" stroke-width="2" class="stat-card__ic" />
            <div class="stat-card__body">
              <span class="stat-card__val mono">{{ students.length }}</span>
              <span class="stat-card__lbl">Jami</span>
            </div>
          </article>
          <article class="stat-card stat-card--2" :style="{ animationDelay: '100ms' }">
            <div class="stat-card__blob" aria-hidden="true" />
            <Filter :size="22" stroke-width="2" class="stat-card__ic" />
            <div class="stat-card__body">
              <span class="stat-card__val mono">{{ filteredRows.length }}</span>
              <span class="stat-card__lbl">Filtrlangan</span>
            </div>
          </article>
          <article class="stat-card stat-card--3" :style="{ animationDelay: '200ms' }">
            <div class="stat-card__blob" aria-hidden="true" />
            <ClipboardCheck :size="22" stroke-width="2" class="stat-card__ic" />
            <div class="stat-card__body">
              <span class="stat-card__val mono">{{ testedCount }}</span>
              <span class="stat-card__lbl">Test topshirgan</span>
              <span class="stat-card__hint mono">{{ testedPct }}%</span>
            </div>
          </article>
          <article class="stat-card stat-card--4" :style="{ animationDelay: '300ms' }">
            <div class="stat-card__blob" aria-hidden="true" />
            <AlertTriangle :size="22" stroke-width="2" class="stat-card__ic" />
            <div class="stat-card__body">
              <span class="stat-card__val mono">{{ highRiskTotal }}</span>
              <span class="stat-card__lbl">Yuqori xavf</span>
            </div>
          </article>
        </section>

        <section class="filters-card">
          <div class="filters-grid">
            <div class="glow-field glow-field--wide">
              <label class="field-lbl">Qidiruv</label>
              <div class="glow-field__inner">
                <Search :size="18" stroke-width="2" class="field-icon" />
                <input v-model.trim="filterQuery" type="search" class="field-input" placeholder="Ism yoki telefon" />
              </div>
            </div>

            <div ref="classMsRef" class="glow-field glow-field--wide class-ms">
              <label class="field-lbl">Sinf (ko'p tanlov)</label>
              <button type="button" class="class-ms__trigger glow-field__inner" @click.stop="toggleClassOpen">
                <div class="class-ms__tags">
                  <template v-if="!selectedClasses.length">
                    <span class="class-ms__placeholder">Barchasi</span>
                  </template>
                  <template v-else-if="selectedClasses.length <= 3">
                    <span v-for="c in selectedClasses" :key="c" class="mini-tag">{{ c }}</span>
                  </template>
                  <template v-else>
                    <span v-for="c in selectedClasses.slice(0, 3)" :key="c" class="mini-tag">{{ c }}</span>
                    <span class="mini-tag mini-tag--more">+{{ selectedClasses.length - 3 }} ta</span>
                  </template>
                </div>
                <ChevronDown class="class-ms__chev" :class="{ open: classOpen }" :size="18" stroke-width="2" />
              </button>
              <Transition name="ms-drop">
                <div v-if="classOpen" class="class-ms__panel">
                  <div class="class-ms__head">
                    <span class="class-ms__count">{{ selectedClasses.length }} ta tanlangan</span>
                    <button type="button" class="class-ms__clear" @click="selectedClasses = []">Tozalash</button>
                  </div>
                  <div class="glow-field glow-field--sm class-ms__search-wrap">
                    <div class="glow-field__inner">
                      <Search :size="16" stroke-width="2" class="field-icon" />
                      <input v-model.trim="classSearch" type="search" class="field-input" placeholder="Sinf qidirish" @click.stop />
                    </div>
                  </div>
                  <div class="class-ms__list">
                    <label v-for="c in filteredClassOptions" :key="c" class="class-ms__row">
                      <span class="cb" :class="{ on: selectedClasses.includes(c) }">
                        <Check v-if="selectedClasses.includes(c)" :size="14" stroke-width="2.5" />
                      </span>
                      <input type="checkbox" class="sr-only" :value="c" v-model="selectedClasses" @click.stop />
                      <span>{{ c }}</span>
                    </label>
                    <p v-if="!filteredClassOptions.length" class="class-ms__empty">Sinf topilmadi</p>
                  </div>
                </div>
              </Transition>
            </div>

            <div ref="riskMsRef" class="glow-field class-ms risk-ms">
              <label class="field-lbl">Xavf darajasi</label>
              <button type="button" class="class-ms__trigger glow-field__inner risk-ms__trigger" @click.stop="toggleRiskOpen">
                <span class="risk-ms__value">{{ riskOptionLabel }}</span>
                <ChevronDown class="class-ms__chev" :class="{ open: riskOpen }" :size="18" stroke-width="2" />
              </button>
              <Transition name="ms-drop">
                <div v-if="riskOpen" class="class-ms__panel risk-ms__panel">
                  <button
                    v-for="opt in riskOptions"
                    :key="opt.value"
                    type="button"
                    class="risk-ms__row"
                    :class="{ 'risk-ms__row--on': filterRisk === opt.value }"
                    @click.stop="selectRisk(opt.value)"
                  >
                    <span class="risk-ms__tick" aria-hidden="true">
                      <Check v-if="filterRisk === opt.value" :size="16" stroke-width="2.5" />
                    </span>
                    <span class="risk-ms__text">{{ opt.label }}</span>
                  </button>
                </div>
              </Transition>
            </div>

            <div class="glow-field">
              <label class="field-lbl">Yosh min</label>
              <div class="glow-field__inner">
                <input v-model="filterAgeMin" type="number" min="0" max="99" class="field-input mono" placeholder="—" />
              </div>
            </div>

            <div class="glow-field">
              <label class="field-lbl">Yosh max</label>
              <div class="glow-field__inner">
                <input v-model="filterAgeMax" type="number" min="0" max="99" class="field-input mono" placeholder="—" />
              </div>
            </div>
          </div>

          <div class="pills-section">
            <span class="pills-title">Yo'nalish</span>
            <div class="pills-row" role="group" aria-label="Yo'nalish">
              <button
                v-for="key in directionKeys"
                :key="key"
                type="button"
                class="pill"
                :class="['pill--dir', `pill--${key}`, { active: filterDirections.includes(key) }]"
                @click="toggleDirection(key)"
              >
                {{ directionUz[key] }}
              </button>
            </div>
          </div>

          <div class="pills-section">
            <span class="pills-title">Test turi</span>
            <div class="pills-row" role="group" aria-label="Test turi">
              <button
                type="button"
                class="pill pill--test"
                :class="{ active: filterTestKinds.includes('psych') }"
                @click="toggleTestKind('psych')"
              >
                Psixologik
              </button>
              <button
                type="button"
                class="pill pill--test"
                :class="{ active: filterTestKinds.includes('portrait') }"
                @click="toggleTestKind('portrait')"
              >
                Portret
              </button>
            </div>
          </div>

          <div class="filters-actions">
            <button type="button" class="btn-reset" @click="resetFilters">
              <X :size="18" stroke-width="2" />
              Tozalash
            </button>
            <button type="button" class="btn-excel" :disabled="exporting || !filteredRows.length" @click="exportExcel">
              <span v-if="exporting" class="btn-excel__spin" />
              <Download v-else :size="18" stroke-width="2" />
              Excel eksport
            </button>
          </div>
        </section>

        <div class="table-shell">
          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th>O'quvchi ismi</th>
                  <th>Sinf</th>
                  <th>Yoshi</th>
                  <th>Telefon raqami</th>
                  <th>So'ngi test sanasi</th>
                  <th>Yo'nalish</th>
                  <th>Xavf darajasi</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <TransitionGroup name="st-row" tag="tbody" :key="tbodyKey">
                <tr
                  v-for="(row, idx) in filteredRows"
                  :key="row._rowKey"
                  class="data-row"
                  :style="{ '--row-d': `${Math.min(idx, 40) * 28}ms` }"
                >
                  <td>
                    <div class="name-cell">
                      <div class="avatar" :style="avatarVars(idx)">{{ studentInitials(row.full_name) }}</div>
                      <span class="name-text">{{ row.full_name }}</span>
                    </div>
                  </td>
                  <td class="mono muted-strong">{{ row.class_name || "—" }}</td>
                  <td class="mono muted-strong">{{ row.age ?? "—" }}</td>
                  <td class="mono">{{ row.phoneDisplay }}</td>
                  <td class="mono">{{ row.lastTestDisplay || "—" }}</td>
                  <td>
                    <span
                      v-if="row.yonalishKey"
                      class="dir-badge"
                      :class="`dir-badge--${row.yonalishKey}`"
                    >
                      {{ row.yonalishLabel }}
                    </span>
                    <span v-else class="dir-badge dir-badge--empty">—</span>
                  </td>
                  <td>
                    <span class="risk-badge" :class="riskBadgeClass(row)">
                      <i v-if="row.xavfLabel !== 'Test topshirilmagan'" class="risk-dot" />
                      {{ row.xavfLabel }}
                    </span>
                  </td>
                  <td>
                    <div class="act-cell">
                      <RouterLink
                        v-if="row.detailRouteParam"
                        class="btn-view"
                        :to="{ name: 'psychologist-student-detail', params: { studentId: row.detailRouteParam } }"
                      >
                        Ko'rish
                      </RouterLink>
                      <span v-else class="btn-view btn-view--disabled">—</span>
                      <button
                        type="button"
                        class="btn-del"
                        :disabled="deleteLoadingId === row.detailRouteParam"
                        @click="removeStudent(row)"
                      >
                        O'chirish
                      </button>
                    </div>
                  </td>
                </tr>
              </TransitionGroup>
            </table>
          </div>
          <div v-if="!filteredRows.length" class="empty-state">
            <SearchX :size="48" stroke-width="1.5" class="empty-state__ic" />
            <p>Hech qanday natija topilmadi</p>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { onClickOutside } from "@vueuse/core";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  ChevronDown,
  ClipboardCheck,
  Download,
  Filter,
  Search,
  SearchX,
  Users,
  X,
} from "lucide-vue-next";

import PsychologistSidebar from "../../components/layout/PsychologistSidebar.vue";
import MobileHeader from "../../components/layout/MobileHeader.vue";
import { api, getApiErrorMessage, psychologistStudentsItems, coerceResultsArray } from "../../lib/api";
import { logError, logInfo } from "../../lib/logger";
import { useAuthStore } from "../../stores/auth";
import {
  DIRECTION_KEYS,
  DIRECTION_UZ,
  avatarVars,
  buildStudentRows,
  filterStudentRows,
  studentInitials,
} from "../../lib/studentsListHelpers.js";

const authStore = useAuthStore();
const schoolId = computed(() => authStore.currentUser?.school_id || authStore.currentUser?.schoolId || null);

const loading = ref(true);
const loadError = ref("");
const students = ref([]);
const results = ref([]);
const deleteLoadingId = ref(null);
const exporting = ref(false);

const filterQuery = ref("");
const selectedClasses = ref([]);
const filterRisk = ref("all");
const filterAgeMin = ref("");
const filterAgeMax = ref("");
const filterDirections = ref([]);
const filterTestKinds = ref([]);

const classOpen = ref(false);
const classSearch = ref("");
const classMsRef = ref(null);

const riskOpen = ref(false);
const riskMsRef = ref(null);

const riskOptions = [
  { value: "all", label: "Barchasi" },
  { value: "high", label: "Yuqori" },
  { value: "medium", label: "O'rta" },
  { value: "normal", label: "Normal" },
  { value: "none", label: "Test topshirilmagan" },
];

const riskOptionLabel = computed(() => riskOptions.find((o) => o.value === filterRisk.value)?.label ?? "Barchasi");

function toggleClassOpen() {
  classOpen.value = !classOpen.value;
  if (classOpen.value) riskOpen.value = false;
}

function toggleRiskOpen() {
  riskOpen.value = !riskOpen.value;
  if (riskOpen.value) classOpen.value = false;
}

function selectRisk(value) {
  filterRisk.value = value;
  riskOpen.value = false;
}

onClickOutside(classMsRef, () => {
  classOpen.value = false;
});

onClickOutside(riskMsRef, () => {
  riskOpen.value = false;
});

const directionKeys = DIRECTION_KEYS;
const directionUz = DIRECTION_UZ;

function buildPresetClasses() {
  const letters = ["A", "B", "C", "D"];
  const out = [];
  for (let g = 1; g <= 11; g += 1) {
    for (const L of letters) out.push(`${g}-${L}`);
  }
  return out;
}

const presetClasses = buildPresetClasses();

const classOptions = computed(() => {
  const set = new Set([...presetClasses, ...students.value.map((s) => s.class_name).filter(Boolean)]);
  return [...set].sort((a, b) => a.localeCompare(b, "uz"));
});

const filteredClassOptions = computed(() => {
  const q = classSearch.value.trim().toLowerCase();
  if (!q) return classOptions.value;
  return classOptions.value.filter((c) => c.toLowerCase().includes(q));
});

const enrichedRows = computed(() => buildStudentRows({ students: students.value, results: results.value }));

const filterPayload = computed(() => ({
  query: filterQuery.value,
  classes: selectedClasses.value,
  risk: filterRisk.value,
  ageMin: filterAgeMin.value,
  ageMax: filterAgeMax.value,
  directions: filterDirections.value,
  testKinds: filterTestKinds.value,
}));

const filteredRows = computed(() => filterStudentRows(enrichedRows.value, filterPayload.value));

const tbodyKey = computed(() => JSON.stringify(filterPayload.value));

const testedCount = computed(() => enrichedRows.value.filter((r) => r.lastAny).length);
const testedPct = computed(() => {
  const t = students.value.length;
  if (!t) return 0;
  return Math.round((testedCount.value / t) * 100);
});

const highRiskTotal = computed(() => enrichedRows.value.filter((r) => r.xavfLabel === "Yuqori").length);

function toggleDirection(key) {
  const i = filterDirections.value.indexOf(key);
  if (i === -1) filterDirections.value = [...filterDirections.value, key];
  else filterDirections.value = filterDirections.value.filter((k) => k !== key);
}

function toggleTestKind(k) {
  const i = filterTestKinds.value.indexOf(k);
  if (i === -1) filterTestKinds.value = [...filterTestKinds.value, k];
  else filterTestKinds.value = filterTestKinds.value.filter((x) => x !== k);
}

function resetFilters() {
  filterQuery.value = "";
  selectedClasses.value = [];
  filterRisk.value = "all";
  filterAgeMin.value = "";
  filterAgeMax.value = "";
  filterDirections.value = [];
  filterTestKinds.value = [];
  classSearch.value = "";
  classOpen.value = false;
  riskOpen.value = false;
}

function riskBadgeClass(row) {
  if (row.xavfLabel === "Yuqori") return "risk-badge--high";
  if (row.xavfLabel === "O'rta") return "risk-badge--mid";
  if (row.xavfLabel === "Normal") return "risk-badge--ok";
  return "risk-badge--none";
}

async function exportExcel() {
  exporting.value = true;
  try {
    // backend export endpoint mavjud bo'lsa, shu faylni yuklab olamiz
    const d = new Date().toISOString().slice(0, 10);
    try {
      const resp = await api.get("/api/psychologist/export", { responseType: "blob" });
      saveAs(new Blob([resp.data]), `oquvchilar_${d}.xlsx`);
      return;
    } catch {
      // fallback
    }
    const wb = XLSX.utils.book_new();
    const sheetData = filteredRows.value.map((r) => ({
      "Ism Familiya": r.full_name,
      Sinf: r.class_name || "",
      Yoshi: r.age ?? "",
      "Telefon raqami": r.phoneDisplay === "—" ? "" : r.phoneDisplay,
      "So'ngi test sanasi": r.lastTestDisplay || "",
      "Yo'nalish": r.yonalishLabel === "—" ? "" : r.yonalishLabel,
      "Xavf darajasi": r.xavfLabel,
      "Test turi": r.lastTestTypeUz || "",
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    ws["!cols"] = [
      { wch: 28 },
      { wch: 10 },
      { wch: 6 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 18 },
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "O'quvchilar");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([out], { type: "application/octet-stream" }), `oquvchilar_${d}.xlsx`);
  } finally {
    exporting.value = false;
  }
}

async function load() {
  logInfo("PSY_STUDENTS", "LOAD_START", { schoolId: schoolId.value || null });
  loading.value = true;
  loadError.value = "";
  students.value = [];
  results.value = [];
  try {
    const [{ data: studentsResp }, { data: statsResp }] = await Promise.all([
      api.get("/api/psychologist/students"),
      api.get("/api/psychologist/stats"),
    ]);
    students.value = psychologistStudentsItems(studentsResp);
    results.value = coerceResultsArray(statsResp);
    logInfo("PSY_STUDENTS", "LOAD_OK", {
      students: students.value.length,
      results: results.value.length,
    });
  } catch (error) {
    loadError.value = getApiErrorMessage(error, "Psixolog ma'lumotlarini yuklashda xatolik.");
    students.value = [];
    results.value = [];
    logError("PSY_STUDENTS", "LOAD_FAIL", { message: loadError.value });
  } finally {
    loading.value = false;
  }
}

async function removeStudent(row) {
  alert(`"${row.full_name}" uchun o'chirish backend endpointi hozircha belgilanmagan.`);
}

onMounted(() => {
  load();
});

watch(schoolId, () => load());
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:ital,wght@0,400..800;1,400..800&display=swap");

.students-pro {
  --st-font: "Plus Jakarta Sans", system-ui, sans-serif;
  --st-mono: "IBM Plex Mono", ui-monospace, monospace;

  /* Light (default layer; dark overrides below) */
  --st-bg: #f8fafc;
  --st-bg2: #f1f5f9;
  --st-bg3: #e2e8f0;
  --st-border: #e2e8f0;
  --st-border2: #cbd5e1;
  --st-text: #0f172a;
  --st-text2: #475569;
  --st-text3: #94a3b8;
  --st-accent: #6366f1;
  --st-glow: rgba(99, 102, 241, 0.35);

  --st-grad1-a: #eef2ff;
  --st-grad1-b: #e0e7ff;
  --st-grad1-br: #c7d2fe;
  --st-grad2-a: #ecfdf5;
  --st-grad2-b: #d1fae5;
  --st-grad2-br: #a7f3d0;
  --st-grad3-a: #fffbeb;
  --st-grad3-b: #fef3c7;
  --st-grad3-br: #fde68a;
  --st-grad4-a: #fff1f2;
  --st-grad4-b: #ffe4e6;
  --st-grad4-br: #fecdd3;

  --st-av-1a: #6366f1;
  --st-av-1b: #8b5cf6;
  --st-av-2a: #14b8a6;
  --st-av-2b: #06b6d4;
  --st-av-3a: #f59e0b;
  --st-av-3b: #f97316;
  --st-av-4a: #ec4899;
  --st-av-4b: #a855f7;
  --st-av-5a: #10b981;
  --st-av-5b: #22c55e;
  --st-av-6a: #3b82f6;
  --st-av-6b: #6366f1;

  display: flex;
  min-height: 100vh;
  background: var(--st-bg);
  color: var(--st-text);
  font-family: var(--st-font);
  transition:
    background-color 0.45s cubic-bezier(0.4, 0, 0.2, 1),
    color 0.35s ease;
}

.students-main {
  flex: 1;
  padding: clamp(16px, 2.2vw, 28px);
  min-width: 0;
  width: 100%;
  position: relative;
  z-index: 1;
  isolation: isolate;
}

.students-main::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.42;
  background:
    radial-gradient(ellipse 85% 50% at 95% 0%, color-mix(in srgb, var(--st-accent) 26%, transparent), transparent 58%),
    radial-gradient(ellipse 65% 42% at 5% 100%, color-mix(in srgb, var(--st-accent) 14%, transparent), transparent 52%);
  transition: opacity 0.5s ease;
}

.students-main > * {
  position: relative;
  z-index: 1;
}

.mono {
  font-family: var(--st-mono);
}

.top-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.top-bar h1 {
  margin: 0;
  font-size: clamp(1.45rem, 2.4vw, 1.85rem);
  font-weight: 800;
  letter-spacing: -0.03em;
}

.top-bar__sub {
  margin: 6px 0 0;
  color: var(--st-text2);
  font-size: 0.92rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  padding: 16px 16px 14px;
  border: 1px solid transparent;
  min-height: 108px;
  animation: stFadeUp 0.62s cubic-bezier(0.22, 1, 0.36, 1) both;
  transition:
    transform 0.32s cubic-bezier(0.34, 1.2, 0.64, 1),
    box-shadow 0.32s ease,
    border-color 0.25s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 12px 40px color-mix(in srgb, var(--st-accent) 18%, transparent),
    0 4px 16px rgba(0, 0, 0, 0.06);
}

.stat-card__blob {
  position: absolute;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  right: -48px;
  top: -48px;
  background: radial-gradient(circle, var(--st-glow), transparent 68%);
  opacity: 0.58;
  pointer-events: none;
  animation: stBlobFloat 8s ease-in-out infinite;
}

@keyframes stBlobFloat {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.52;
  }
  50% {
    transform: translate(-6px, 8px) scale(1.06);
    opacity: 0.68;
  }
}

.stat-card__ic {
  position: relative;
  z-index: 1;
  color: var(--st-text2);
  margin-bottom: 8px;
  opacity: 0.9;
}

.stat-card__body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-card__val {
  font-size: 1.45rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.stat-card__lbl {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--st-text2);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.stat-card__hint {
  font-size: 0.8rem;
  color: var(--st-text3);
  font-weight: 600;
}

.stat-card--1 {
  background: linear-gradient(135deg, var(--st-grad1-a), var(--st-grad1-b));
  border-color: var(--st-grad1-br);
}

.stat-card--2 {
  background: linear-gradient(135deg, var(--st-grad2-a), var(--st-grad2-b));
  border-color: var(--st-grad2-br);
}

.stat-card--3 {
  background: linear-gradient(135deg, var(--st-grad3-a), var(--st-grad3-b));
  border-color: var(--st-grad3-br);
}

.stat-card--4 {
  background: linear-gradient(135deg, var(--st-grad4-a), var(--st-grad4-b));
  border-color: var(--st-grad4-br);
}

.filters-card {
  background: var(--st-bg2);
  border: 1px solid var(--st-border);
  border-radius: 18px;
  padding: 18px;
  margin-bottom: 18px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 0 0 1px color-mix(in srgb, var(--st-accent) 6%, transparent) inset;
  animation: stFadeUp 0.58s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both;
  transition: box-shadow 0.35s ease, border-color 0.3s ease;
}

.filters-card:hover {
  border-color: color-mix(in srgb, var(--st-accent) 28%, var(--st-border));
  box-shadow:
    0 8px 28px color-mix(in srgb, var(--st-accent) 12%, transparent),
    0 0 0 1px color-mix(in srgb, var(--st-accent) 10%, transparent) inset;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px 16px;
}

.glow-field {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.glow-field--wide {
  grid-column: span 2;
}

@media (max-width: 900px) {
  .glow-field--wide {
    grid-column: span 1;
  }
}

.field-lbl {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--st-text3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.glow-field__inner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--st-border);
  background: var(--st-bg3);
  transition:
    border-color 0.35s ease,
    box-shadow 0.35s ease,
    transform 0.22s cubic-bezier(0.34, 1.2, 0.64, 1);
}

.glow-field__inner::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: 13px;
  padding: 1px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.glow-field:hover .glow-field__inner {
  transform: translateY(-1px);
}

.glow-field:hover .glow-field__inner::before {
  opacity: 0.82;
}

.glow-field:focus-within .glow-field__inner::before {
  opacity: 1;
}

.glow-field:focus-within .glow-field__inner {
  transform: translateY(-1px);
  box-shadow:
    0 0 0 3px rgba(99, 102, 241, 0.28),
    0 10px 36px var(--st-glow),
    0 4px 14px color-mix(in srgb, var(--st-accent) 15%, transparent);
}

.field-input,
.field-select {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: var(--st-text);
  font: inherit;
  outline: none;
}

.field-select {
  cursor: pointer;
}

.field-icon {
  flex-shrink: 0;
  color: var(--st-text3);
}

.class-ms {
  position: relative;
}

.class-ms__trigger {
  width: 100%;
  cursor: pointer;
  text-align: left;
  min-height: 44px;
}

.class-ms__tags {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  min-height: 24px;
}

.class-ms__placeholder {
  color: var(--st-text3);
  font-weight: 600;
  font-size: 0.9rem;
}

.mini-tag {
  display: inline-flex;
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 0.72rem;
  font-weight: 800;
  background: rgba(99, 102, 241, 0.12);
  color: #818cf8;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.mini-tag--more {
  background: rgba(99, 102, 241, 0.08);
}

.class-ms__chev {
  flex-shrink: 0;
  color: var(--st-text3);
  transition: transform 0.25s ease;
}

.class-ms__chev.open {
  transform: rotate(180deg);
}

.class-ms__panel {
  position: absolute;
  z-index: 30;
  left: 0;
  right: 0;
  top: calc(100% + 8px);
  background: var(--st-bg2);
  border: 1px solid var(--st-border);
  border-radius: 14px;
  padding: 10px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
}

.risk-ms__value {
  flex: 1;
  min-width: 0;
  text-align: left;
  font-weight: 600;
  font-size: 0.92rem;
  color: var(--st-text);
}

.risk-ms__panel {
  padding: 6px;
}

.risk-ms__row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 8px;
  margin: 0;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--st-text);
  font: inherit;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease, color 0.15s ease;
}

.risk-ms__row:hover {
  background: var(--st-bg3);
}

.risk-ms__row--on {
  background: color-mix(in srgb, var(--st-accent) 12%, var(--st-bg3));
}

.risk-ms__tick {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1px solid var(--st-border2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
}

.risk-ms__row--on .risk-ms__tick {
  background: var(--st-accent);
  border-color: var(--st-accent);
}

.risk-ms__text {
  flex: 1;
  line-height: 1.35;
}

.class-ms__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.class-ms__count {
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--st-text2);
}

.class-ms__clear {
  border: none;
  background: transparent;
  color: var(--st-accent);
  font-weight: 800;
  font-size: 0.78rem;
  cursor: pointer;
}

.class-ms__search-wrap {
  margin-bottom: 8px;
}

.class-ms__list {
  max-height: 220px;
  overflow-y: auto;
  padding-right: 4px;
}

.class-ms__list::-webkit-scrollbar {
  width: 6px;
}

.class-ms__list::-webkit-scrollbar-thumb {
  background: var(--st-border2);
  border-radius: 999px;
}

.class-ms__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 6px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.88rem;
  color: var(--st-text);
  transition: background 0.12s ease;
}

.class-ms__row:hover {
  background: var(--st-bg3);
}

.cb {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  border: 1px solid var(--st-border2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.cb.on {
  background: var(--st-accent);
  border-color: var(--st-accent);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.class-ms__empty {
  padding: 12px;
  text-align: center;
  color: var(--st-text3);
  font-size: 0.88rem;
}

.ms-drop-enter-active {
  transition:
    opacity 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.32s cubic-bezier(0.34, 1.2, 0.64, 1);
}

.ms-drop-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.2s ease;
}

.ms-drop-enter-from,
.ms-drop-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-8px);
}

.pills-section {
  margin-top: 16px;
}

.pills-title {
  display: block;
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--st-text3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}

.pills-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.pill {
  border: 1px solid var(--st-border);
  background: var(--st-bg3);
  color: var(--st-text2);
  font-weight: 700;
  font-size: 0.85rem;
  padding: 8px 14px;
  border-radius: 999px;
  cursor: pointer;
  transition:
    transform 0.2s cubic-bezier(0.34, 1.2, 0.64, 1),
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    background 0.25s ease,
    color 0.2s ease;
}

.pill:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--st-accent) 42%, var(--st-border2));
  background: color-mix(in srgb, var(--st-accent) 11%, var(--st-bg3));
  color: var(--st-text);
  box-shadow:
    0 8px 26px color-mix(in srgb, var(--st-accent) 18%, transparent),
    0 0 0 1px color-mix(in srgb, var(--st-accent) 22%, transparent);
}

.pill.active {
  border-color: var(--st-accent);
  box-shadow:
    0 0 0 3px rgba(99, 102, 241, 0.22),
    0 6px 20px color-mix(in srgb, var(--st-accent) 18%, transparent);
  color: var(--st-text);
  background: color-mix(in srgb, var(--st-accent) 14%, var(--st-bg3));
}

.pill.active:hover {
  transform: translateY(-2px);
  filter: brightness(1.05);
  box-shadow:
    0 0 0 3px rgba(99, 102, 241, 0.28),
    0 10px 28px color-mix(in srgb, var(--st-accent) 22%, transparent);
}

.pill:active {
  transform: scale(0.96);
}

.filters-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
  align-items: center;
}

.btn-reset {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px dashed var(--st-border2);
  background: transparent;
  color: var(--st-text2);
  font-weight: 800;
  font-size: 0.88rem;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.btn-reset:hover {
  border-color: var(--st-accent);
  color: var(--st-accent);
}

.btn-excel {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 12px;
  border: 1px solid var(--st-border2);
  background: var(--st-bg3);
  color: var(--st-text);
  font-weight: 800;
  font-size: 0.88rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-excel:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 22px rgba(99, 102, 241, 0.2);
}

.btn-excel::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 40%, rgba(255, 255, 255, 0.35) 50%, transparent 60%);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
  pointer-events: none;
}

.btn-excel:hover:not(:disabled)::after {
  transform: translateX(100%);
}

.btn-excel:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-excel__spin {
  width: 18px;
  height: 18px;
  border: 2px solid var(--st-border);
  border-top-color: var(--st-accent);
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

.table-shell {
  position: relative;
  background: var(--st-bg2);
  border: 1px solid var(--st-border);
  border-radius: 18px;
  overflow: hidden;
  animation: stFadeUp 0.58s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
  transition: box-shadow 0.35s ease, border-color 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.table-shell:hover {
  border-color: color-mix(in srgb, var(--st-accent) 22%, var(--st-border));
  box-shadow: 0 10px 36px color-mix(in srgb, var(--st-accent) 10%, transparent);
}

.table-scroll {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th,
.data-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid var(--st-border);
}

.data-table th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--st-bg3);
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--st-text3);
  box-shadow: 0 1px 0 var(--st-border);
}

.data-table tbody tr {
  transition:
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.data-table tbody tr:hover {
  background: color-mix(in srgb, var(--st-accent) 9%, transparent);
  box-shadow: inset 3px 0 0 var(--st-accent);
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.78rem;
  color: #fff;
  background: linear-gradient(135deg, var(--av-c1), var(--av-c2));
  flex-shrink: 0;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--st-accent) 25%, transparent);
  transition: transform 0.22s cubic-bezier(0.34, 1.2, 0.64, 1), box-shadow 0.22s ease;
}

.data-table tbody tr:hover .avatar {
  transform: scale(1.05);
  box-shadow: 0 6px 18px color-mix(in srgb, var(--st-accent) 35%, transparent);
}

.name-text {
  font-weight: 700;
}

.muted-strong {
  color: var(--st-text2);
  font-weight: 600;
}

.dir-badge {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
  border: 1px solid transparent;
}

.dir-badge--leadership {
  background: rgba(99, 102, 241, 0.12);
  color: #818cf8;
  border-color: rgba(99, 102, 241, 0.2);
}

.dir-badge--emotional {
  background: rgba(244, 63, 94, 0.1);
  color: #fb7185;
  border-color: rgba(244, 63, 94, 0.2);
}

.dir-badge--intellectual {
  background: rgba(16, 185, 129, 0.1);
  color: #34d399;
  border-color: rgba(16, 185, 129, 0.2);
}

.dir-badge--social {
  background: rgba(245, 158, 11, 0.1);
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.2);
}

.dir-badge--empty {
  background: color-mix(in srgb, var(--st-text3) 8%, transparent);
  color: var(--st-text3);
  border-color: var(--st-border);
}

.risk-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
  border: 1px solid transparent;
}

.risk-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.risk-badge--high {
  background: rgba(244, 63, 94, 0.1);
  color: #fb7185;
  border-color: rgba(244, 63, 94, 0.2);
}

.risk-badge--high .risk-dot {
  background: #fb7185;
}

.risk-badge--mid {
  background: rgba(245, 158, 11, 0.1);
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.2);
}

.risk-badge--mid .risk-dot {
  background: #fbbf24;
}

.risk-badge--ok {
  background: rgba(16, 185, 129, 0.1);
  color: #34d399;
  border-color: rgba(16, 185, 129, 0.2);
}

.risk-badge--ok .risk-dot {
  background: #34d399;
}

.risk-badge--none {
  background: color-mix(in srgb, var(--st-text3) 10%, transparent);
  color: var(--st-text3);
  border-color: var(--st-border);
}

.act-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn-view {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 14px;
  border-radius: 10px;
  border: 1px solid var(--st-accent);
  color: var(--st-accent);
  font-weight: 800;
  font-size: 0.8rem;
  text-decoration: none;
  transition: background 0.18s ease, color 0.18s ease;
}

.btn-view:hover {
  background: var(--st-accent);
  color: #fff;
}

.btn-view--disabled {
  border-color: var(--st-border);
  color: var(--st-text3);
  cursor: default;
  pointer-events: none;
}

.btn-del {
  padding: 7px 12px;
  border-radius: 10px;
  border: 1px solid var(--st-border);
  background: transparent;
  color: var(--st-text2);
  font-weight: 800;
  font-size: 0.78rem;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.btn-del:hover:not(:disabled) {
  background: rgba(244, 63, 94, 0.12);
  color: #fb7185;
  border-color: rgba(244, 63, 94, 0.35);
}

.btn-del:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  padding: 36px 20px;
  text-align: center;
  color: var(--st-text3);
}

.empty-state__ic {
  margin: 0 auto 12px;
  opacity: 0.35;
  color: var(--st-text3);
}

.panel-warn,
.panel-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid var(--st-border);
  background: var(--st-bg2);
  color: var(--st-text2);
  font-weight: 700;
}

.panel-warn__ic {
  flex-shrink: 0;
  color: #f59e0b;
}

.spinner {
  width: 26px;
  height: 26px;
  border: 3px solid var(--st-border);
  border-top-color: var(--st-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.st-row-enter-active {
  transition:
    opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1) var(--row-d, 0ms),
    transform 0.45s cubic-bezier(0.34, 1.2, 0.64, 1) var(--row-d, 0ms);
}

.st-row-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.22s ease;
}

.st-row-enter-from,
.st-row-leave-to {
  opacity: 0;
  transform: translateY(14px) scale(0.985);
}

.st-row-move {
  transition: transform 0.38s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes stFadeUp {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .stat-card__blob {
    animation: none;
  }

  .st-row-enter-active,
  .st-row-leave-active,
  .st-row-move {
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
}
</style>

<!-- Qorong'u rejim: scoped emas — faqat html atributi bilan (ishonchli) -->
<style>
html[data-theme="dark"] .students-pro {
  --st-bg: #12121a;
  --st-bg2: #1a1a24;
  --st-bg3: #23232e;
  --st-border: #2e2e3a;
  --st-border2: #454552;
  --st-text: #f4f4f5;
  --st-text2: #b4b4c0;
  --st-text3: #8b8b99;

  --st-grad1-a: #1e1b4b;
  --st-grad1-b: #312e81;
  --st-grad1-br: #4338ca;
  --st-grad2-a: #064e3b;
  --st-grad2-b: #065f46;
  --st-grad2-br: #059669;
  --st-grad3-a: #451a03;
  --st-grad3-b: #78350f;
  --st-grad3-br: #b45309;
  --st-grad4-a: #4c0519;
  --st-grad4-b: #881337;
  --st-grad4-br: #be123c;
}

html[data-theme="dark"] .students-pro .students-main::before {
  opacity: 0.32;
}

html[data-theme="dark"] .students-pro .stat-card:hover {
  box-shadow:
    0 16px 48px rgba(99, 102, 241, 0.22),
    0 6px 20px rgba(0, 0, 0, 0.28);
}

html[data-theme="dark"] .students-pro .filters-card {
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.28),
    0 0 0 1px rgba(99, 102, 241, 0.1) inset;
}

html[data-theme="dark"] .students-pro .filters-card:hover {
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.38),
    0 0 32px rgba(99, 102, 241, 0.1),
    0 0 0 1px rgba(129, 140, 248, 0.18) inset;
}

html[data-theme="dark"] .students-pro .class-ms__panel {
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
}

html[data-theme="dark"] .students-pro .table-shell {
  box-shadow: 0 4px 28px rgba(0, 0, 0, 0.28);
}

html[data-theme="dark"] .students-pro .table-shell:hover {
  box-shadow:
    0 14px 48px rgba(0, 0, 0, 0.38),
    0 0 40px rgba(99, 102, 241, 0.08);
}
</style>
