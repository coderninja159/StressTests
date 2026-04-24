<template>
  <div class="layout">
    <PsychologistSidebar />
    <main class="main">
      <MobileHeader />
      <div v-if="loading" class="loading">
        <div class="spinner" />
        <span>Yuklanmoqda...</span>
      </div>

      <div v-else-if="errorMessage" class="card err">{{ errorMessage }}</div>

      <template v-else-if="student">
        <div class="head">
          <RouterLink to="/psychologist/students" class="back">← Ro'yxatga</RouterLink>
          <div class="head-row">
            <h1>{{ student.full_name }}</h1>
            <button type="button" class="btn-pdf" @click="downloadPdf">PDF hisobot</button>
          </div>
        </div>

        <div ref="reportRef" class="report-print">
        <section class="card">
          <h2>Ma'lumotlar</h2>
          <ul class="info">
            <li><span>Sinf:</span> {{ student.class_name || "—" }}</li>
            <li><span>Yosh:</span> {{ student.age ?? "—" }}</li>
            <li><span>Student ID:</span> {{ student.student_id || "—" }}</li>
            <li><span>Jami testlar:</span> {{ allResults.length }}</li>
          </ul>
        </section>

        <section v-if="latestPsych" class="card">
          <h2>Oxirgi psixologik test</h2>
          <div class="badge" :class="'risk-' + (latestPsych.risk_level || 'normal')">
            {{ riskLabel(latestPsych.risk_level) }}
          </div>

          <div class="bars">
            <div v-for="key in psychKeys" :key="key" class="bar-row">
              <div class="bar-head">
                <span>{{ block(key)?.label || key }}</span>
                <span class="meta">
                  {{ block(key)?.score ?? 0 }} / {{ block(key)?.max ?? 0 }}
                  ({{ block(key)?.percentage ?? 0 }}%)
                </span>
              </div>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :class="'lvl-' + (block(key)?.level || 'normal')"
                  :style="{ width: (block(key)?.percentage ?? 0) + '%' }"
                />
              </div>
            </div>
          </div>

          <div v-if="latestPsych" class="answers-block">
            <h3 class="answers-title">Savol va javoblar tahlili</h3>
            <p class="muted small">
              {{ formatDate(latestPsych.taken_at) }} — {{ typeLabel("psychological") }}
            </p>
            <template v-if="answersForResult(latestPsych.id).length">
              <div
                v-if="latestPsych.test_type === 'psychological'"
                class="accordion-list"
              >
                <details
                  v-for="grp in psychAnswerGroups(latestPsych.id)"
                  :key="grp.category"
                  class="acc-item"
                  open
                >
                  <summary class="acc-sum">
                    <span class="acc-chevron" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                    <span>{{ categoryTitle(grp.category) }}</span>
                    <span class="acc-meta">
                      {{ grp.score }}/{{ grp.max }} &nbsp; {{ grp.pct }}%
                    </span>
                  </summary>
                  <div class="acc-body">
                    <div
                      v-for="(row, idx) in grp.rows"
                      :key="row.id || idx"
                      class="qa-row"
                    >
                      <p class="qa-q">
                        {{ idx + 1 }}. “{{ row.question?.question_text || "—" }}”
                      </p>
                      <p class="qa-a">
                        O'quvchi javobi:
                        <span
                          class="ans-badge"
                          :class="psychBadgeClass(row.answer_value)"
                        >
                          {{ psychAnswerLabel(row.answer_value) }}
                        </span>
                        <span class="qa-pts">({{ row.points ?? 0 }} ball)</span>
                      </p>
                    </div>
                  </div>
                </details>
              </div>
            </template>
            <p v-else class="muted small">
              Bu test uchun javoblar jadvalida yozuvlar yo'q (faqat yangi topshirilgan testlar).
            </p>
          </div>

          <div class="ai-pro">
            <h3>AI professional tahlil</h3>
            <div v-if="aiProLoading" class="ai-loading">
              <div class="spinner sm" />
              <span>AI tahlil qilyapti...</span>
            </div>
            <div v-else-if="aiProText" class="ai-text">
              <p v-for="(para, i) in splitParas(aiProText)" :key="i">{{ para }}</p>
            </div>
            <p v-else class="muted">Hozircha AI professional tahlil mavjud emas.</p>
          </div>
        </section>

        <p v-else class="muted card flat">Hozircha psixologik test natijasi yo'q.</p>

        <section v-if="psychLineLabels.length" class="card">
          <h2>Kategoriyalar / stress dinamikasi</h2>
          <p class="muted small">Psixologik testlar bo'yicha stress foizi (vaqt bo'yicha)</p>
          <div class="chart-box">
            <Line :data="psychLineData" :options="psychLineOptions" />
          </div>
        </section>

        <section class="card">
          <h2>Barcha testlar tarixi</h2>
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Sana</th>
                  <th>Test turi</th>
                  <th>Xavf / natija</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in allResults" :key="r.id">
                  <td>{{ formatDate(r.taken_at) }}</td>
                  <td>{{ typeLabel(r.test_type) }}</td>
                  <td>{{ summaryCell(r) }}</td>
                  <td>
                    <button type="button" class="btn-ghost" @click="toggleHistory(r)">
                      Ko'rish
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-if="!allResults.length" class="muted inner">Yozuvlar yo'q.</p>
          </div>

          <div v-if="historyFocus" class="focus-panel">
            <h3>Tanlangan natija</h3>
            <p class="muted">{{ formatDate(historyFocus.taken_at) }} • {{ typeLabel(historyFocus.test_type) }}</p>

            <template v-if="historyFocus.test_type === 'psychological' && historyFocus.category_scores">
              <div class="badge small" :class="'risk-' + (historyFocus.risk_level || 'normal')">
                {{ riskLabel(historyFocus.risk_level) }}
              </div>
              <div class="bars tight">
                <div v-for="key in psychKeys" :key="key" class="bar-row">
                  <div class="bar-head">
                    <span>{{ histBlock(historyFocus, key)?.label || key }}</span>
                    <span class="meta">{{ histBlock(historyFocus, key)?.percentage ?? 0 }}%</span>
                  </div>
                  <div class="bar-track">
                    <div
                      class="bar-fill"
                      :class="'lvl-' + (histBlock(historyFocus, key)?.level || 'normal')"
                      :style="{ width: (histBlock(historyFocus, key)?.percentage ?? 0) + '%' }"
                    />
                  </div>
                </div>
              </div>
            </template>

            <template v-else-if="historyFocus.test_type === 'portrait'">
              <p><strong>Asosiy tur:</strong> {{ portraitName(historyFocus.personality_type) }}</p>
            </template>

            <div class="answers-block focus-answers">
              <h4 class="answers-title">Savol va javoblar tahlili</h4>
              <p class="muted small">
                {{ formatDate(historyFocus.taken_at) }} — {{ typeLabel(historyFocus.test_type) }}
              </p>
              <template v-if="answersForResult(historyFocus.id).length">
                <div
                  v-if="historyFocus.test_type === 'psychological'"
                  class="accordion-list"
                >
                  <details
                    v-for="grp in psychAnswerGroups(historyFocus.id)"
                    :key="grp.category"
                    class="acc-item"
                    open
                  >
                    <summary class="acc-sum">
                      <span class="acc-chevron" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                      <span>{{ categoryTitle(grp.category) }}</span>
                      <span class="acc-meta">
                        {{ grp.score }}/{{ grp.max }} &nbsp; {{ grp.pct }}%
                      </span>
                    </summary>
                    <div class="acc-body">
                      <div
                        v-for="(row, idx) in grp.rows"
                        :key="row.id || idx"
                        class="qa-row"
                      >
                        <p class="qa-q">
                          {{ idx + 1 }}. “{{ row.question?.question_text || "—" }}”
                        </p>
                        <p class="qa-a">
                          O'quvchi javobi:
                          <span
                            class="ans-badge"
                            :class="psychBadgeClass(row.answer_value)"
                          >
                            {{ psychAnswerLabel(row.answer_value) }}
                          </span>
                          <span class="qa-pts">({{ row.points ?? 0 }} ball)</span>
                        </p>
                      </div>
                    </div>
                  </details>
                </div>
                <div v-else-if="historyFocus.test_type === 'portrait'" class="portrait-answers">
                  <div
                    v-for="(row, idx) in answersForResult(historyFocus.id)"
                    :key="row.id || idx"
                    class="qa-row portrait-qa"
                  >
                    <p class="qa-q">
                      {{ idx + 1 }}. “{{ row.question?.question_text || "—" }}”
                    </p>
                    <p class="qa-a">
                      Tanlangan: “{{ row.option?.option_text || "—" }}”
                    </p>
                    <p class="qa-dir">
                      Yo'nalish: {{ portraitName(row.option?.personality_type) }}
                      <span class="qa-pts">+{{ row.points ?? 0 }} ball</span>
                    </p>
                  </div>
                </div>
              </template>
              <p v-else class="muted small">
                Bu natija uchun javoblar jadvalida yozuvlar yo'q.
              </p>
            </div>
          </div>
        </section>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { Line } from "vue-chartjs";
import "../../lib/chartSetup.js";

import PsychologistSidebar from "../../components/layout/PsychologistSidebar.vue";
import MobileHeader from "../../components/layout/MobileHeader.vue";
import { getProfessionalAnalysisByResultId } from "../../lib/ai";
import { api, getApiErrorMessage, coerceResultsArray } from "../../lib/api";
import { useAuthStore } from "../../stores/auth";

const route = useRoute();
const authStore = useAuthStore();

const loading = ref(true);
const errorMessage = ref("");
const student = ref(null);
const allResults = ref([]);
const historyFocus = ref(null);
/** result_id -> enriched test_answers */
const answersByResultId = ref({});

const aiProLoading = ref(false);
const aiProText = ref("");
const reportRef = ref(null);

const psychKeys = ["delinquency", "addiction", "aggression", "self_harm"];

const psychLineLabels = ref([]);
const psychLineScores = ref([]);

const psychLineData = computed(() => ({
  labels: psychLineLabels.value,
  datasets: [
    {
      label: "Stress %",
      data: psychLineScores.value,
      borderColor: "#4F46E5",
      backgroundColor: "rgba(79, 70, 229, 0.1)",
      fill: true,
      tension: 0.35,
    },
  ],
}));

const psychLineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: true } },
  scales: { y: { beginAtZero: true, suggestedMax: 100 } },
};

async function downloadPdf() {
  const el = reportRef.value;
  if (!el) return;
  try {
    const html2pdf = (await import("html2pdf.js")).default;
    await html2pdf()
      .set({
        margin: 12,
        filename: `oquvchi-${student.value?.student_id || "hisobot"}.pdf`,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(el)
      .save();
  } catch {
    errorMessage.value = "PDF yaratishda xatolik.";
  }
}

const schoolId = computed(() => authStore.currentUser?.school_id ?? null);

const latestPsych = computed(() => {
  const psych = allResults.value.filter((r) => r.test_type === "psychological");
  if (!psych.length) {
    return null;
  }
  return [...psych].sort((a, b) => new Date(b.taken_at) - new Date(a.taken_at))[0];
});

const cs = computed(() => latestPsych.value?.category_scores || null);

function block(key) {
  return cs.value?.[key] || null;
}

function histBlock(row, key) {
  return row?.category_scores?.[key] || null;
}

function riskLabel(level) {
  if (level === "high") return "Yuqori";
  if (level === "medium") return "O'rta";
  if (level === "normal") return "Normal";
  return level || "—";
}

function typeLabel(t) {
  if (t === "psychological") return "Psixologik";
  if (t === "portrait") return "Portret";
  return t || "—";
}

function summaryCell(r) {
  if (r.test_type === "psychological") {
    return riskLabel(r.risk_level);
  }
  if (r.test_type === "portrait") {
    return portraitName(r.personality_type);
  }
  return "—";
}

function portraitName(t) {
  const map = {
    leadership: "Yo'lboshchi",
    social: "Muloqotchi",
    intellectual: "Mutafakkir",
    emotional: "Sezgir",
  };
  return map[t] || t || "—";
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString("uz-UZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso || "—";
  }
}

function splitParas(text) {
  return text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function toggleHistory(r) {
  historyFocus.value = historyFocus.value?.id === r.id ? null : r;
}

const PSYCH_CAT_ORDER = ["lie_scale", "delinquency", "addiction", "aggression", "self_harm"];

function answersForResult(resultId) {
  return answersByResultId.value[resultId] || [];
}

function categoryTitle(cat) {
  const map = {
    lie_scale: "Yolg'on shkalasi",
    delinquency: "Huquqbuzarlik moyilligi",
    addiction: "Zavisimlik",
    aggression: "Tajovuzkorlik",
    self_harm: "O'z-o'ziga zarar",
    other: "Boshqa",
  };
  return map[cat] || cat || "—";
}

function psychAnswerLabel(val) {
  const v = String(val || "").toLowerCase();
  if (v === "ha") return "HA";
  if (v === "bazan") return "BA'ZAN";
  return "YO'Q";
}

function psychBadgeClass(val) {
  const v = String(val || "").toLowerCase();
  if (v === "ha") return "ans-ha";
  if (v === "bazan") return "ans-bazan";
  return "ans-yoq";
}

function psychAnswerGroups(resultId) {
  const list = answersForResult(resultId).filter(
    (r) => r.answer_value != null && r.answer_value !== "",
  );
  const map = {};
  for (const row of list) {
    const cat = row.question?.category || "other";
    if (!map[cat]) map[cat] = [];
    map[cat].push(row);
  }
  return PSYCH_CAT_ORDER.filter((c) => map[c]?.length).map((category) => {
    const rows = map[category];
    const score = rows.reduce((s, r) => s + (Number(r.points) || 0), 0);
    const max = rows.length * 2;
    const pct = max > 0 ? Math.round((score / max) * 1000) / 10 : 0;
    return { category, rows, score, max, pct };
  });
}

async function loadAnswersForResults(results) {
  answersByResultId.value = {};
  if (!results?.length) return;
}

async function loadProfessionalAi() {
  const lp = latestPsych.value;
  aiProText.value = "";
  if (!lp?.category_scores) {
    return;
  }

  aiProLoading.value = true;
  try {
    const text = await getProfessionalAnalysisByResultId(lp.id);
    aiProText.value = text || "";
  } finally {
    aiProLoading.value = false;
  }
}

watch(
  latestPsych,
  () => {
    loadProfessionalAi();
  },
  { immediate: true },
);

async function load() {
  loading.value = true;
  errorMessage.value = "";
  student.value = null;
  allResults.value = [];
  historyFocus.value = null;
  aiProText.value = "";
  psychLineLabels.value = [];
  psychLineScores.value = [];

  const studentId = route.params.studentId;
  if (!studentId || typeof studentId !== "string") {
    errorMessage.value = "Noto'g'ri manzil.";
    loading.value = false;
    return;
  }

  if (!schoolId.value) {
    errorMessage.value = "Maktab ma'lumoti topilmadi.";
    loading.value = false;
    return;
  }

  try {
    const { data: uResp } = await api.get(
      `/api/psychologist/students/${encodeURIComponent(studentId)}`,
    );
    const u = uResp?.student;
    if (!uResp?.success || !u) throw new Error("notfound");

    if (u.school_id !== schoolId.value) {
      errorMessage.value = "Bu o'quvchini ko'rish huquqingiz yo'q.";
      loading.value = false;
      return;
    }

    student.value = u;

    const { data: rResp } = await api.get(
      `/api/psychologist/students/${encodeURIComponent(studentId)}/results`,
    );
    const list = coerceResultsArray(rResp);
    allResults.value = list;

    const psych = list
      .filter((r) => r.test_type === "psychological")
      .sort((a, b) => new Date(a.taken_at) - new Date(b.taken_at));
    psychLineLabels.value = psych.map((r) => {
      try {
        return new Date(r.taken_at).toLocaleDateString("uz-UZ", { day: "2-digit", month: "short" });
      } catch {
        return "";
      }
    });
    psychLineScores.value = psych.map((r) => Number(r.total_score || 0));

    await loadAnswersForResults(list);
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error, "O'quvchi yuklanmadi yoki topilmadi.");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  load();
});

watch(
  () => route.params.studentId,
  () => {
    load();
  },
);
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

.loading {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner.sm {
  width: 22px;
  height: 22px;
  border-width: 2px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.head {
  margin-bottom: var(--space-4);
}

.head-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.btn-pdf {
  padding: 10px 16px;
  border-radius: var(--r-md);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
}

.btn-pdf:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.report-print {
  background: var(--color-bg);
}

.chart-box {
  height: 260px;
  position: relative;
  margin-top: var(--space-3);
}

.small {
  font-size: 0.85rem;
  margin-top: 0;
}

.back {
  display: inline-block;
  margin-bottom: var(--space-2);
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
}

h1 {
  margin: 0;
}

h2 {
  margin: 0 0 var(--space-3);
  font-size: 1.1rem;
}

h3 {
  margin: 0 0 var(--space-2);
  font-size: 1rem;
}

.card {
  background: var(--surface);
  border-radius: var(--r-xl);
  padding: var(--s-5);
  margin-bottom: var(--s-4);
  border: 1px solid var(--border);
  box-shadow: var(--sh-sm);
  transition: var(--t);
}

.card:hover {
  box-shadow: var(--sh-md);
}

.card.flat {
  border-style: dashed;
}

.card.err {
  color: var(--color-danger);
  font-weight: 600;
}

.info {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-2);
}

.info span {
  font-weight: 700;
  margin-right: 8px;
}

.badge {
  display: inline-block;
  padding: 8px 14px;
  border-radius: 999px;
  font-weight: 800;
  margin-bottom: var(--space-4);
}

.badge.small {
  padding: 4px 10px;
  font-size: 0.85rem;
}

.risk-normal {
  background: color-mix(in srgb, #22c55e 22%, white);
  color: #166534;
}

.risk-medium {
  background: color-mix(in srgb, #eab308 25%, white);
  color: #854d0e;
}

.risk-high {
  background: color-mix(in srgb, #ef4444 20%, white);
  color: #991b1b;
}

.bars {
  margin-bottom: var(--space-4);
}

.bars.tight {
  margin-top: var(--space-3);
}

.bar-row {
  margin-bottom: var(--space-3);
}

.bar-head {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  font-size: 0.9rem;
  margin-bottom: 6px;
}

.meta {
  color: var(--color-muted);
  font-variant-numeric: tabular-nums;
}

.bar-track {
  height: 10px;
  background: var(--color-border);
  border-radius: 999px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
}

.bar-fill.lvl-normal {
  background: #22c55e;
}

.bar-fill.lvl-medium {
  background: #eab308;
}

.bar-fill.lvl-high {
  background: #ef4444;
}

.ai-pro {
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}

.ai-loading {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-muted);
}

.ai-text p {
  margin: 0 0 var(--space-3);
  line-height: 1.55;
}

.muted {
  color: var(--color-muted);
}

.table-wrap {
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.table th,
.table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}

.table th {
  background: var(--color-bg);
}

.btn-ghost {
  border: 1px solid var(--color-primary);
  background: #fff;
  color: var(--color-primary);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
}

.inner {
  padding: var(--space-3);
  margin: 0;
}

.focus-panel {
  margin-top: var(--s-4);
  padding: var(--s-4);
  background: var(--surface-2);
  border-radius: var(--r-lg);
  border: 1px dashed var(--border);
}

@media (max-width: 768px) {
  .main { padding: var(--s-4); }
}

@media (max-width: 520px) {
  .table { min-width: 640px; }
}

.answers-block {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-color, var(--border));
}

.answers-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary, var(--color-text));
  margin: 0 0 0.5rem;
}

.focus-answers {
  margin-top: 1rem;
  border-top: 1px solid var(--border-color, var(--border));
  padding-top: 1rem;
}

.accordion-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.acc-item {
  border: 1px solid var(--border-color, var(--border));
  border-radius: var(--radius-md, 12px);
  background: var(--bg-card, var(--surface));
  overflow: hidden;
}

.acc-sum {
  list-style: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  font-weight: 600;
  color: var(--text-primary, var(--color-text));
}

.acc-sum::-webkit-details-marker {
  display: none;
}

.acc-chevron {
  display: flex;
  transition: transform 0.2s ease;
  color: var(--text-muted, var(--color-text));
}

details[open] .acc-chevron {
  transform: rotate(180deg);
}

.acc-meta {
  margin-left: auto;
  font-weight: 600;
  color: var(--text-secondary, var(--color-text));
  font-size: 0.9rem;
}

.acc-body {
  padding: 0 1rem 1rem;
  border-top: 1px solid var(--border-color, var(--border));
}

.qa-row {
  margin-top: 1rem;
}

.qa-q {
  margin: 0 0 0.35rem;
  font-size: 0.95rem;
  color: var(--text-primary, var(--color-text));
}

.qa-a,
.qa-dir {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary, var(--color-text));
}

.ans-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm, 8px);
  font-weight: 700;
  font-size: 0.8rem;
  margin: 0 0.25rem;
}

.ans-ha {
  background: var(--color-rose-muted, rgba(244, 63, 94, 0.12));
  color: var(--color-rose, #f43f5e);
}

.ans-bazan {
  background: var(--color-amber-muted, rgba(245, 158, 11, 0.12));
  color: var(--color-amber, #f59e0b);
}

.ans-yoq {
  background: var(--color-emerald-muted, rgba(16, 185, 129, 0.12));
  color: var(--color-emerald, #10b981);
}

.qa-pts {
  font-weight: 600;
  margin-left: 0.25rem;
}

.portrait-answers {
  margin-top: 0.75rem;
}

.portrait-qa {
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color, var(--border));
}

.portrait-qa:last-child {
  border-bottom: none;
}
</style>
