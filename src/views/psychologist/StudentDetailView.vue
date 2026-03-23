<template>
  <div class="layout">
    <PsychologistSidebar />
    <main class="main">
      <div v-if="loading" class="loading">
        <div class="spinner" />
        <span>Yuklanmoqda...</span>
      </div>

      <div v-else-if="errorMessage" class="card err">{{ errorMessage }}</div>

      <template v-else-if="student">
        <div class="head">
          <RouterLink to="/psychologist/students" class="back">← Ro'yxatga</RouterLink>
          <h1>{{ student.full_name }}</h1>
        </div>

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
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

import PsychologistSidebar from "../../components/layout/PsychologistSidebar.vue";
import { getProfessionalAnalysis } from "../../lib/ai";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/auth";

const route = useRoute();
const authStore = useAuthStore();

const loading = ref(true);
const errorMessage = ref("");
const student = ref(null);
const allResults = ref([]);
const historyFocus = ref(null);

const aiProLoading = ref(false);
const aiProText = ref("");

const psychKeys = ["delinquency", "addiction", "aggression", "self_harm"];

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

async function loadProfessionalAi() {
  const lp = latestPsych.value;
  aiProText.value = "";
  if (!lp?.category_scores) {
    return;
  }

  aiProLoading.value = true;
  try {
    const text = await getProfessionalAnalysis(
      lp.category_scores,
      lp.risk_level,
      {
        age: student.value?.age,
        className: student.value?.class_name,
      },
    );
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

  const id = route.params.id;
  if (!id || typeof id !== "string") {
    errorMessage.value = "Noto'g'ri manzil.";
    loading.value = false;
    return;
  }

  if (!supabase) {
    errorMessage.value = "Supabase sozlanmagan.";
    loading.value = false;
    return;
  }

  if (!schoolId.value) {
    errorMessage.value = "Maktab ma'lumoti topilmadi.";
    loading.value = false;
    return;
  }

  try {
    const { data: u, error: e1 } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .eq("role", "student")
      .single();

    if (e1 || !u) {
      throw new Error("notfound");
    }

    if (u.school_id !== schoolId.value) {
      errorMessage.value = "Bu o'quvchini ko'rish huquqingiz yo'q.";
      loading.value = false;
      return;
    }

    student.value = u;

    const { data: res, error: e2 } = await supabase
      .from("results")
      .select("*")
      .eq("user_id", id)
      .order("taken_at", { ascending: false });

    if (e2) {
      throw e2;
    }

    allResults.value = res || [];
  } catch {
    errorMessage.value = "O'quvchi yuklanmadi yoki topilmadi.";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  load();
});

watch(
  () => route.params.id,
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
  padding: var(--space-5);
  max-width: 800px;
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
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  margin-bottom: var(--space-4);
  border: 1px solid var(--color-border);
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
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
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
  margin-top: var(--space-4);
  padding: var(--space-4);
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  border: 1px dashed var(--color-border);
}
</style>
