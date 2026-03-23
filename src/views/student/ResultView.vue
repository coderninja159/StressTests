<template>
  <div class="result-page">
    <div v-if="loading" class="loading-wrap">
      <div class="spinner" aria-hidden="true" />
      <p>Natija yuklanmoqda...</p>
    </div>

    <div v-else-if="errorMessage" class="card error-card">
      <p>{{ errorMessage }}</p>
      <button type="button" class="btn primary" @click="goTest">Testlar sahifasiga</button>
    </div>

    <template v-else-if="result">
      <div class="card">
        <template v-if="result.test_type === 'psychological'">
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

          <p class="disclaimer">
            ⚠️ Bu test tibbiy tashxis emas. Muammo sezilsa mutaxassisga murojaat qiling.
          </p>
        </template>

        <template v-else>
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

          <p class="disclaimer">
            ⚠️ Bu test tibbiy tashxis emas.
          </p>
        </template>

        <div class="ai-advice-card">
          <h2 class="ai-title">🤖 AI Maslahat</h2>
          <div v-if="aiLoading" class="ai-loading">
            <div class="spinner ai-spin" aria-hidden="true" />
            <span>🤖 AI tahlil qilyapti...</span>
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

import { getStudentExplanation } from "../../lib/ai";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const errorMessage = ref("");
const result = ref(null);

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
    leadership: "🦅 Yo‘lboshchi",
    social: "🤝 Muloqotchi",
    intellectual: "🧠 Mutafakkir",
    emotional: "💛 Sezgir",
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
    const testType = r.test_type === "psychological" ? "psychological" : "portrait";
    const contextLabel =
      testType === "psychological" ? riskLabel(r.risk_level) : portraitTypePlain.value;

    const text = await getStudentExplanation(r.category_scores, contextLabel, testType);
    aiParagraphs.value = text ? splitAiParagraphs(text) : [];
  } finally {
    aiLoading.value = false;
  }
}

const loadResult = async () => {
  errorMessage.value = "";
  result.value = null;

  const id = route.query.id;
  if (!id || typeof id !== "string") {
    loading.value = false;
    errorMessage.value = "Natija topilmadi (id yo‘q).";
    return;
  }

  if (!supabase) {
    loading.value = false;
    errorMessage.value = "Supabase sozlanmagan.";
    return;
  }

  loading.value = true;

  try {
    const { data, error } = await supabase.from("results").select("*").eq("id", id).single();

    if (error) {
      throw error;
    }

    if (!data) {
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
  } catch {
    errorMessage.value = "Natija yuklanmadi yoki topilmadi.";
  } finally {
    loading.value = false;
  }
};

const goTest = () => {
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
  min-height: 100vh;
  padding: var(--space-5);
  max-width: 640px;
  margin: 0 auto;
}

.loading-wrap {
  display: grid;
  place-items: center;
  gap: var(--space-3);
  padding: var(--space-6);
}

.spinner {
  width: 40px;
  height: 40px;
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

.card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
}

h1 {
  margin: 0 0 var(--space-2);
  font-size: 1.35rem;
}

.sub {
  margin: 0 0 var(--space-3);
  color: var(--color-muted);
}

.badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 999px;
  font-weight: 700;
  margin-bottom: var(--space-5);
}

.risk-normal {
  background: color-mix(in srgb, #22c55e 25%, white);
  color: #166534;
}

.risk-medium {
  background: color-mix(in srgb, #eab308 28%, white);
  color: #854d0e;
}

.risk-high {
  background: color-mix(in srgb, #ef4444 22%, white);
  color: #991b1b;
}

.portrait-lead {
  font-size: 1.35rem;
  font-weight: 800;
  margin: 0 0 var(--space-3);
}

.portrait-desc {
  margin: 0 0 var(--space-5);
  line-height: 1.55;
  color: var(--color-text);
}

.bars h2 {
  font-size: 1rem;
  margin: 0 0 var(--space-3);
}

.bar-row {
  margin-bottom: var(--space-4);
}

.bar-head {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  font-size: 0.9rem;
  margin-bottom: 6px;
}

.bar-meta {
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
  transition: width 0.35s ease;
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

.bar-fill.highlight {
  background: var(--color-primary);
}

.lie-note {
  font-size: 0.9rem;
  color: var(--color-muted);
  margin: var(--space-4) 0;
}

.disclaimer {
  margin: var(--space-5) 0 var(--space-3);
  font-size: 0.95rem;
  color: var(--color-muted);
  line-height: 1.5;
}

.ai-advice-card {
  padding: var(--space-5);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  margin-bottom: var(--space-5);
}

.ai-title {
  margin: 0 0 var(--space-3);
  font-size: 1.15rem;
}

.ai-loading {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-muted);
  font-weight: 600;
}

.ai-spin {
  width: 28px;
  height: 28px;
  border-width: 3px;
}

.ai-body p {
  margin: 0 0 var(--space-3);
  line-height: 1.55;
}

.ai-body p:last-child {
  margin-bottom: 0;
}

.ai-fallback {
  margin: 0;
  color: var(--color-muted);
}

.footer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.btn {
  padding: 12px 18px;
  border-radius: var(--radius-sm);
  border: none;
  font-weight: 600;
  cursor: pointer;
}

.btn.primary {
  background: var(--color-primary);
  color: #fff;
}

.btn.secondary {
  background: var(--color-border);
  color: var(--color-text);
}

.error-card {
  text-align: center;
}

.error-card p {
  color: var(--color-danger);
  margin-bottom: var(--space-4);
}
</style>
