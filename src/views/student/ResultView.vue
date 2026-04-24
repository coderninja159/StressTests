<template>
  <div class="result-page">
    <div class="result-bg-orb orb-a"></div>
    <div class="result-bg-orb orb-b"></div>
    <div v-if="loading" class="loading-wrap">
      <div class="spinner" aria-hidden="true" />
      <p>Natija yuklanmoqda...</p>
    </div>

    <div v-else-if="errorMessage" class="card error-card">
      <ApiErrorAlert
        :message="errorMessage"
        :retryable="true"
        :show-details="isDev"
        :details="errorDetails"
        @retry="loadResult"
      />
      <button type="button" class="btn primary mt-12" @click="goTest">Testlar sahifasiga</button>
    </div>

    <template v-else-if="result">
      <div class="card hero-card">
        <template v-if="result.test_type === 'psychological'">
          <p class="kicker">Natija Markazi</p>
          <h1>Psixologik test natijasi</h1>
          <p class="sub">Umumiy xavf darajasi (eng yuqori kategoriya bo‘yicha)</p>
          <div class="badge" :class="'risk-' + (result.risk_level || 'normal')">
            {{ riskLabel(result.risk_level) }}
          </div>

          <section class="bars">
            <h2>Kategoriyalar</h2>
            <div
              v-for="key in psychBarKeys"
              :key="key"
              class="bar-row"
            >
              <div class="bar-head">
                <span>{{ psychCategoryLabel(key) }}</span>
                <span class="bar-meta">
                  {{ psychBlock(key)?.score ?? 0 }} / {{ psychBlock(key)?.max ?? 0 }}
                  ({{ psychBlock(key)?.percentage ?? 0 }}%)
                </span>
              </div>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :class="'lvl-' + (psychBlock(key)?.level || 'normal')"
                  :style="{ width: (psychBlock(key)?.percentage ?? 0) + '%' }"
                />
              </div>
            </div>
          </section>

          <p v-if="lieNote" class="lie-note">{{ lieNote }}</p>

          <div class="alert alert-warn disclaimer">
            <svg class="alert-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
            </svg>
            <span>Bu test tibbiy tashxis emas. Muammo sezilsa mutaxassisga murojaat qiling.</span>
          </div>
        </template>

        <template v-else>
          <p class="kicker">Natija Markazi</p>
          <h1>Psixologik portret</h1>
          <p class="portrait-lead">{{ portraitTitle }}</p>
          <p class="portrait-desc">{{ portraitDescription }}</p>

          <section class="bars">
            <h2>Shaxsiyat yo‘nalishlari</h2>
            <div
              v-for="key in portraitKeys"
              :key="key"
              class="bar-row"
            >
              <div class="bar-head">
                <span>{{ portraitShortLabel(key) }}</span>
                <span class="bar-meta">{{ portraitPct(key) }}%</span>
              </div>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :class="{ highlight: key === result.personality_type }"
                  :style="{ width: portraitPct(key) + '%' }"
                />
              </div>
            </div>
          </section>

          <div class="alert alert-warn disclaimer">
            <svg class="alert-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
            </svg>
            <span>Bu test tibbiy tashxis emas.</span>
          </div>
        </template>

        <div class="ai-advice-card">
          <h2 class="ai-title">AI Maslahat</h2>
          <div v-if="aiLoading" class="ai-loading">
            <div class="spinner ai-spin" aria-hidden="true" />
            <span>AI tahlil qilyapti...</span>
          </div>
          <div v-else-if="aiParagraphs.length" class="ai-body">
            <p v-for="(para, idx) in aiParagraphs" :key="idx">{{ para }}</p>
          </div>
          <p v-else class="ai-fallback">Hozircha AI tahlil mavjud emas.</p>
        </div>

        <div class="footer-actions">
          <button type="button" class="btn secondary" @click="goDashboard">Bosh sahifaga</button>
          <button type="button" class="btn primary" @click="goTest">Yana test topshirish</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import ApiErrorAlert from "../../components/ui/ApiErrorAlert.vue";
import { getStudentExplanationByResultId } from "../../lib/ai";
import {
  api,
  getApiErrorMessage,
  normalizeStudentResultItem,
  technicalErrorDetails,
} from "../../lib/api";
import { useAuthStore } from "../../stores/auth";
import { useTestStore } from "../../stores/test";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const testStore = useTestStore();

const loading = ref(true);
const errorMessage = ref("");
const errorDetails = ref(null);
const result = ref(null);
const isDev = import.meta.env.DEV;

const aiLoading = ref(false);
const aiParagraphs = ref([]);

const psychBarKeys = ["delinquency", "addiction", "aggression", "self_harm"];
const portraitKeys = ["leadership", "social", "intellectual", "emotional"];

const psychBlock = (key) => {
  const cs = result.value?.category_scores;
  return cs?.[key] || null;
};

const lieNote = computed(() => {
  const cs = result.value?.category_scores?.lie_scale;
  if (!cs) {
    return "";
  }
  return `Yolg‘on ko‘rsatkichi (natijaga kirmaydi): ${cs.score} / ${cs.max} (${cs.percentage}%).`;
});

const portraitTitle = computed(() => {
  const t = result.value?.personality_type;
  const map = {
    leadership: "Yo‘lboshchi",
    social: "Muloqotchi",
    intellectual: "Mutafakkir",
    emotional: "Sezgir",
  };
  return map[t] || "Natija";
});

const portraitTypePlain = computed(() => {
  const t = result.value?.personality_type;
  const map = {
    leadership: "Yo'lboshchi",
    social: "Muloqotchi",
    intellectual: "Mutafakkir",
    emotional: "Sezgir",
  };
  return map[t] || "Aniqlanmagan";
});

const portraitDescription = computed(() => {
  const t = result.value?.personality_type;
  const texts = {
    leadership:
      "Siz qaror qabul qilish, boshqarish va maqsad sari harakatlanishni afzal ko‘rasiz. Odatda o‘zingizni mas’ul va tashabbuskor his qilasiz; jamoada yo‘l ko‘rsatish va vaziyatni tartibga solish sizga xos bo‘lishi mumkin.",
    social:
      "Siz odamlar, hamjihatlik va ochiq muloqot orqali energiya olasiz. Yangi muhitlarga moslashish, do‘stona munosabatlar va hamkorlik siz uchun muhim bo‘lishi mumkin.",
    intellectual:
      "Siz tahlil qilish, bilim va mantiqiy tizimlarga qiziqasiz. Chuqur o‘ylash, rejalashtirish va tushunchalarni tartibga solish sizning kuchli tomonlaringizdan biri bo‘lishi mumkin.",
    emotional:
      "Siz hissiyotlar, ichki tajriba va muhit bilan chuqur bog‘liqlikni qadrlaysiz. Empatiya, ijodkorlik va insoniy iliqlik siz uchun muhim bo‘lishi mumkin.",
  };
  return texts[t] || "";
});

const portraitPct = (key) => {
  const cs = result.value?.category_scores?.[key];
  return cs?.percentage ?? 0;
};

const portraitShortLabel = (key) =>
  ({
    leadership: "Yo‘lboshchi",
    social: "Muloqotchi",
    intellectual: "Mutafakkir",
    emotional: "Sezgir",
  }[key]);

const psychCategoryLabel = (key) => psychBlock(key)?.label || key;

const riskLabel = (level) =>
  ({
    normal: "Normal",
    medium: "O‘rta",
    high: "Yuqori",
  }[level] || "Normal");

function splitAiParagraphs(text) {
  return text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

async function fetchStudentAi(r) {
  aiParagraphs.value = [];
  if (!r?.category_scores) {
    return;
  }

  aiLoading.value = true;
  try {
    const text = await getStudentExplanationByResultId(r.id);
    aiParagraphs.value = text ? splitAiParagraphs(text) : [];
  } finally {
    aiLoading.value = false;
  }
}

const loadResult = async () => {
  errorMessage.value = "";
  errorDetails.value = null;
  result.value = null;

  const id = route.query.id;
  if (!id || typeof id !== "string") {
    loading.value = false;
    errorMessage.value = "Natija topilmadi (id yo‘q).";
    return;
  }

  loading.value = true;

  try {
    const { data: resp } = await api.get(`/api/students/me/results/${encodeURIComponent(id)}`);
    const data = normalizeStudentResultItem(resp?.result);
    if (!resp?.success || !data) {
      throw new Error("empty");
    }

    const uid = authStore.currentUser?.id;
    if (uid && data.user_id !== uid) {
      errorMessage.value = "Bu natijani ko‘rish huquqingiz yo‘q.";
      result.value = null;
      return;
    }

    result.value = data;
    await fetchStudentAi(data);
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error, "Natija yuklanmadi yoki topilmadi.");
    errorDetails.value = technicalErrorDetails(error);
  } finally {
    loading.value = false;
  }
};

const goTest = () => {
  testStore.resetForSelection();
  router.push("/student/test");
};

const goDashboard = () => {
  router.push("/student/dashboard");
};

onMounted(() => {
  loadResult();
});

watch(
  () => route.query.id,
  () => {
    loadResult();
  },
);
</script>

<style scoped>
.result-page {
  min-height: 100dvh;
  padding: var(--s-7);
  max-width: 1320px;
  margin: 0 auto;
  position: relative;
  isolation: isolate;
}

.mt-12 {
  margin-top: 12px;
}

.result-page::before,
.result-page::after {
  content: "";
  position: absolute;
  pointer-events: none;
  border-radius: 999px;
  z-index: -1;
}

.result-page::before {
  width: 360px;
  height: 360px;
  left: -140px;
  top: -130px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.18), transparent 72%);
  animation: cornerDriftA 10.2s ease-in-out infinite;
}

.result-page::after {
  width: 300px;
  height: 300px;
  right: -120px;
  top: -110px;
  background: radial-gradient(circle, rgba(45, 212, 191, 0.13), transparent 72%);
  animation: cornerDriftB 11.4s ease-in-out infinite;
}

.result-bg-orb {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  animation: floatOrb 11s ease-in-out infinite;
}
.orb-a { width: 340px; height: 340px; left: -120px; top: -100px; background: radial-gradient(circle, rgba(99, 102, 241, 0.16), transparent 70%); }
.orb-b { width: 280px; height: 280px; right: -100px; bottom: -40px; background: radial-gradient(circle, rgba(45, 212, 191, 0.1), transparent 70%); animation-delay: 1s; }

.loading-wrap {
  display: grid;
  place-items: center;
  gap: var(--s-3);
  padding: var(--s-6);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes floatOrb { 0%,100% { transform: translateY(0); } 50% { transform: translateY(14px); } }
@keyframes cornerDriftA {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.86; }
  50% { transform: translate(14px, 12px) scale(1.07); opacity: 1; }
}
@keyframes cornerDriftB {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.72; }
  50% { transform: translate(-12px, 10px) scale(1.08); opacity: 1; }
}

.card {
  background: var(--surface);
  border-radius: var(--r-2xl);
  padding: var(--s-6);
  box-shadow: var(--sh-lg);
  border: 1px solid var(--border);
}

.hero-card { animation: slideUp .28s var(--ease-out); }

.kicker {
  font-size: .76rem;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--brand);
  font-weight: 700;
  margin: 0 0 var(--s-2);
}

h1 { margin: 0 0 var(--s-2); font-size: 1.35rem; }
.sub { margin: 0 0 var(--s-3); color: var(--text-3); }

.badge { display: inline-block; padding: 8px 16px; border-radius: 999px; font-weight: 700; margin-bottom: var(--s-5); }
.risk-normal { background: color-mix(in srgb, #22c55e 25%, white); color: #166534; }
.risk-medium { background: color-mix(in srgb, #eab308 28%, white); color: #854d0e; }
.risk-high { background: color-mix(in srgb, #ef4444 22%, white); color: #991b1b; }

[data-theme="dark"] .risk-normal { background: rgba(34, 197, 94, 0.18); color: #86efac; }
[data-theme="dark"] .risk-medium { background: rgba(234, 179, 8, 0.2); color: #fde68a; }
[data-theme="dark"] .risk-high { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }

.portrait-lead { font-size: 1.35rem; font-weight: 800; margin: 0 0 var(--s-3); }
.portrait-desc { margin: 0 0 var(--s-5); line-height: 1.55; color: var(--text); }
.bars h2 { font-size: 1rem; margin: 0 0 var(--s-3); }
.bar-row { margin-bottom: var(--s-4); padding: var(--s-2) 0; }
.bar-head { display: flex; justify-content: space-between; gap: var(--s-2); font-size: 0.9rem; margin-bottom: 6px; }
.bar-meta { color: var(--text-3); font-variant-numeric: tabular-nums; }
.bar-track { height: 10px; background: var(--border); border-radius: 999px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 999px; transition: width 0.35s ease; }
.bar-fill.lvl-normal { background: linear-gradient(90deg, #34d399, #22c55e); }
.bar-fill.lvl-medium { background: linear-gradient(90deg, #facc15, #eab308); }
.bar-fill.lvl-high { background: linear-gradient(90deg, #fb7185, #ef4444); }
.bar-fill.highlight { background: linear-gradient(90deg, var(--brand-light), var(--brand)); }

.lie-note { font-size: 0.9rem; color: var(--text-3); margin: var(--s-4) 0; }
.disclaimer { margin: var(--s-5) 0 var(--s-3); font-size: 0.95rem; line-height: 1.5; }

.ai-advice-card {
  padding: var(--s-5);
  border-radius: var(--r-xl);
  background: linear-gradient(145deg, var(--n-950), var(--n-850));
  border: 1px solid rgba(99,102,241,0.22);
  margin-bottom: var(--s-5);
  color: white;
  position: relative;
  overflow: hidden;
}
.ai-advice-card::before {
  content: '';
  position: absolute;
  width: 220px;
  height: 220px;
  right: -60px;
  top: -100px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99,102,241,0.28), transparent 70%);
}
.ai-title { margin: 0 0 var(--s-3); font-size: 1.15rem; color: #c7d2fe; position: relative; }
.ai-loading { display: flex; align-items: center; gap: var(--s-3); color: rgba(255,255,255,0.75); font-weight: 600; }
.ai-spin { width: 28px; height: 28px; border-width: 3px; }
.ai-body p { margin: 0 0 var(--s-3); line-height: 1.55; color: rgba(255,255,255,0.82); position: relative; }
.ai-body p:last-child { margin-bottom: 0; }
.ai-fallback { margin: 0; color: rgba(255,255,255,0.7); }

.footer-actions { display: flex; flex-wrap: wrap; gap: var(--s-3); }
.btn { padding: 12px 18px; border-radius: var(--r-md); border: none; font-weight: 600; cursor: pointer; }
.btn.primary { background: var(--brand); color: #fff; }
.btn.secondary { background: var(--surface-3); color: var(--text); }
.error-card { text-align: center; }
.error-card p { color: var(--risk); margin-bottom: var(--s-4); }

@media (max-width: 900px) {
  .result-page { padding: var(--s-4); }
}
</style>
