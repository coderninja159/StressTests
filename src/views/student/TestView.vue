<template>
  <div class="test-page">
    <div class="test-bg-orb orb-1"></div>
    <div class="test-bg-orb orb-2"></div>
    <div v-if="!testStore.currentTest && !testStore.isLoading" class="selection">
      <div class="selection-head">
        <div>
          <p class="kicker">StressTest Lab</p>
          <h1>Testni tanlang</h1>
          <p class="lead">O'zingizga mos test turini tanlang va baholashni boshlang.</p>
        </div>
        <div class="selection-badges">
          <span class="badge badge-brand">AI izoh</span>
          <span class="badge badge-accent">Xavfsiz jarayon</span>
          <span class="badge badge-gray">Natija darhol</span>
        </div>
      </div>

      <div class="cards">
        <button type="button" class="card" @click="pickPsychological">
          <div class="card-icon brand">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
          </div>
          <h2>Psixologik test</h2>
          <p class="meta">75 savol • 20–25 daqiqa • Stress va xavf darajasini aniqlaydi</p>
          <p class="meta-sub">5 yo'nalish bo'yicha chuqur baholash va vizual natija</p>
        </button>
        <button type="button" class="card" @click="pickPortrait">
          <div class="card-icon accent">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2s8 4 8 10-8 10-8 10-8-4-8-10 8-10 8-10Z"/><path d="M12 7v5l3 2"/></svg>
          </div>
          <h2>Psixologik portret testi</h2>
          <p class="meta">25 savol • 10 daqiqa • Shaxsiyat turini aniqlaydi</p>
          <p class="meta-sub">4 profil bo'yicha muvozanat va kuchli tomonlar tahlili</p>
        </button>
      </div>

      <p v-if="testStore.errorMessage" class="error">{{ testStore.errorMessage }}</p>
    </div>

    <div v-else-if="testStore.isLoading && !testStore.questions.length" class="loading-wrap">
      <div class="spinner" aria-hidden="true" />
      <p>Savollar yuklanmoqda...</p>
    </div>

    <div v-else-if="testStore.currentTest && testStore.currentQuestion" class="session">
      <div class="top-bar card-shell">
        <button type="button" class="link-btn" :disabled="testStore.isLoading" @click="cancelTest">
          ← Test tanloviga
        </button>
        <div class="progress-line">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }" />
        </div>
        <span class="progress-text">{{ progressCurrent }} / {{ testStore.totalQuestions }}</span>
      </div>

      <div class="session-grid">
        <aside class="session-side card-shell">
          <h3>Jarayon</h3>
          <ul>
            <li>
              <span class="key">Turi</span>
              <span class="val">{{ currentTest === "psychological" ? "Psixologik" : "Portret" }}</span>
            </li>
            <li>
              <span class="key">Savol</span>
              <span class="val">{{ progressCurrent }} / {{ testStore.totalQuestions }}</span>
            </li>
            <li>
              <span class="key">Tayyorlik</span>
              <span class="val">{{ Math.round(progressPercent) }}%</span>
            </li>
          </ul>
          <div class="tip-box">
            <p class="tip-title">Tavsiyalar</p>
            <p>Har bir savolga tabiiy holatingizga mos javob bering. Tez, lekin o'ylab javob berish aniq natija beradi.</p>
          </div>
        </aside>

        <div class="question-card card-shell">
          <p class="question-label">Savol #{{ progressCurrent }}</p>
          <p class="question-text">{{ testStore.currentQuestion.question_text }}</p>

          <div v-if="testStore.currentTest === 'psychological'" class="answers psych">
            <button
              v-for="opt in psychOptions"
              :key="opt.value"
              type="button"
              class="answer-btn"
              :class="{ selected: psychValue === opt.value }"
              :disabled="testStore.isLoading"
              @click="testStore.setPsychologicalAnswer(testStore.currentQuestion.id, opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>

          <div v-else class="answers portrait">
            <label
              v-for="opt in testStore.portraitOptionsForCurrent"
              :key="opt.id"
              class="radio-card"
              :class="{ selected: portraitSelectedId === opt.id }"
            >
              <input
                type="radio"
                class="sr-only"
                :name="'q-' + testStore.currentQuestion.id"
                :value="opt.id"
                :checked="portraitSelectedId === opt.id"
                @change="testStore.setPortraitAnswer(testStore.currentQuestion.id, opt)"
              />
              <span>{{ opt.option_text }}</span>
            </label>
          </div>

          <p v-if="testStore.errorMessage" class="error">{{ testStore.errorMessage }}</p>

          <div class="actions">
            <button
              type="button"
              class="primary"
              :disabled="!canProceed || testStore.isLoading"
              @click="onPrimary"
            >
              <span v-if="testStore.isLoading">Yuklanmoqda...</span>
              <span v-else-if="isLastQuestion">Natijani ko'rish</span>
              <span v-else>Keyingi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { storeToRefs } from "pinia";

import { useAuthStore } from "../../stores/auth";
import { useTestStore } from "../../stores/test";

const testStore = useTestStore();
const authStore = useAuthStore();
const { currentQuestion, currentQuestionIndex, totalQuestions, answers, currentTest } =
  storeToRefs(testStore);

const psychOptions = [
  { value: "ha", label: "Ha" },
  { value: "bazan", label: "Ba'zan" },
  { value: "yoq", label: "Yo'q" },
];

const progressCurrent = computed(() => currentQuestionIndex.value + 1);
const progressPercent = computed(() =>
  totalQuestions.value ? ((currentQuestionIndex.value + 1) / totalQuestions.value) * 100 : 0,
);

const isLastQuestion = computed(
  () => currentQuestionIndex.value >= totalQuestions.value - 1,
);

const psychValue = computed(() =>
  currentQuestion.value ? answers.value[currentQuestion.value.id] : null,
);

const portraitSelectedId = computed(() => {
  if (!currentQuestion.value) {
    return null;
  }
  const a = answers.value[currentQuestion.value.id];
  return a?.optionId ?? null;
});

const canProceed = computed(() => {
  if (!currentQuestion.value) {
    return false;
  }
  if (currentTest.value === "psychological") {
    return psychOptions.some((o) => o.value === psychValue.value);
  }
  return Boolean(portraitSelectedId.value);
});

const pickPsychological = async () => {
  testStore.resetForSelection();
  testStore.startTest("psychological");
  try {
    await testStore.loadQuestions("psychological");
  } catch {
    testStore.resetForSelection();
  }
};

const pickPortrait = async () => {
  testStore.resetForSelection();
  testStore.startTest("portrait");
  try {
    await testStore.loadQuestions("portrait");
  } catch {
    testStore.resetForSelection();
  }
};

const cancelTest = () => {
  testStore.resetForSelection();
};

const onPrimary = async () => {
  if (!canProceed.value) {
    return;
  }
  if (!isLastQuestion.value) {
    testStore.goNext();
    return;
  }

  const userId = authStore.currentUser?.id;
  try {
    await testStore.submitTest(userId);
  } catch {
    // xabar store da
  }
};

onMounted(() => {
  testStore.resetForSelection();
});
</script>

<style scoped>
.test-page {
  min-height: 100dvh;
  padding: var(--s-7);
  max-width: 1360px;
  margin: 0 auto;
  position: relative;
}

.test-bg-orb {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(3px);
  animation: floatOrb 10s ease-in-out infinite;
}
.orb-1 {
  width: 340px;
  height: 340px;
  top: -100px;
  left: -120px;
  background: radial-gradient(circle, rgba(79,70,229,0.18), transparent 70%);
}
.orb-2 {
  width: 260px;
  height: 260px;
  right: -70px;
  bottom: 20px;
  background: radial-gradient(circle, rgba(16,185,129,0.14), transparent 70%);
  animation-delay: 1s;
}

.selection-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--s-5);
  margin-bottom: var(--s-6);
}

.kicker {
  font-size: .75rem;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--brand);
  font-weight: 700;
  margin-bottom: var(--s-2);
}

.selection-badges {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  flex-wrap: wrap;
}

.card-shell {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-2xl);
  box-shadow: var(--sh-md);
  backdrop-filter: blur(6px);
}

.selection h1 {
  margin: 0 0 var(--space-2);
}

.lead {
  color: var(--color-muted);
  margin: 0 0 var(--space-5);
}

.cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--s-4);
}

.card {
  text-align: left;
  padding: var(--s-6);
  border-radius: var(--r-2xl);
  border: 1px solid var(--border);
  background: var(--surface);
  box-shadow: var(--sh-sm);
  cursor: pointer;
  transition: var(--t-spr);
}

.card-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--r-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--s-3);
}
.card-icon.brand { background: var(--brand-soft); color: var(--brand); }
.card-icon.accent { background: var(--accent-soft); color: var(--accent); }
.meta-sub {
  font-size: .83rem;
  color: var(--text-3);
  margin-top: var(--s-2);
}

.card:hover {
  border-color: var(--brand);
  box-shadow: var(--sh-lg);
  transform: translateY(-4px);
}

.card h2 {
  margin: 0 0 var(--space-2);
  color: var(--color-text);
}

.card .meta {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.95rem;
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

.session .top-bar {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  margin-bottom: var(--s-4);
  padding: var(--s-4) var(--s-5);
}

.link-btn {
  border: none;
  background: none;
  color: var(--color-primary);
  cursor: pointer;
  font-weight: 600;
  padding: var(--space-2);
}

.link-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.progress-line {
  flex: 1;
  height: 10px;
  background: var(--border);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--brand-light), var(--brand));
  transition: width 0.28s var(--ease);
}

.progress-text {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  min-width: 4.5rem;
  text-align: right;
}

.session-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: var(--s-4);
}

.session-side {
  padding: var(--s-5);
  align-self: start;
}

.session-side h3 {
  margin: 0 0 var(--s-4);
}

.session-side ul {
  display: grid;
  gap: var(--s-3);
}

.session-side li {
  display: flex;
  justify-content: space-between;
  gap: var(--s-2);
}

.session-side .key {
  color: var(--text-3);
  font-size: .85rem;
}

.session-side .val {
  font-weight: 700;
  color: var(--text);
}

.tip-box {
  margin-top: var(--s-5);
  padding: var(--s-4);
  border-radius: var(--r-lg);
  background: var(--surface-2);
  border: 1px solid var(--border);
}

.tip-title {
  font-size: .82rem;
  font-weight: 700;
  color: var(--brand);
  margin-bottom: var(--s-2);
}

.tip-box p {
  font-size: .86rem;
  margin: 0;
  line-height: 1.6;
}

.question-card {
  padding: var(--s-6);
  animation: slideUp .22s var(--ease-out);
}

.question-label {
  font-size: .78rem;
  font-weight: 700;
  color: var(--brand);
  text-transform: uppercase;
  letter-spacing: .08em;
  margin-bottom: var(--s-3);
}

.question-text {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.45;
  margin: 0 0 var(--space-5);
}

.answers.psych {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.answer-btn {
  flex: 1;
  min-width: 100px;
  padding: 14px 18px;
  border-radius: var(--r-lg);
  border: 2px solid var(--border);
  background: var(--surface);
  cursor: pointer;
  font-weight: 600;
  transition: var(--t-spr);
}

.answer-btn:hover {
  transform: translateY(-2px);
  border-color: var(--brand-light);
}

.answer-btn.selected {
  border-color: var(--brand);
  background: var(--brand-soft);
  color: var(--brand);
  box-shadow: 0 0 0 3px var(--brand-glow);
}

.portrait {
  display: grid;
  gap: var(--space-2);
}

.radio-card {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-radius: var(--r-lg);
  border: 2px solid var(--border);
  background: var(--surface);
  cursor: pointer;
  font-weight: 500;
  transition: var(--t-spr);
}

.radio-card:hover {
  transform: translateX(4px);
  border-color: var(--brand-light);
}

.radio-card.selected {
  border-color: var(--brand);
  background: var(--brand-soft);
  box-shadow: 0 0 0 3px var(--brand-glow);
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

.actions {
  margin-top: var(--space-5);
}

.primary {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: var(--r-xl);
  background: linear-gradient(135deg, var(--brand), var(--brand-hover));
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.error {
  color: var(--color-danger);
  margin-top: var(--space-3);
  font-size: 0.95rem;
}

@keyframes floatOrb {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(16px); }
}

@media (max-width: 1080px) {
  .session-grid { grid-template-columns: 1fr; }
  .session-side { order: 2; }
  .cards { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .test-page { padding: var(--s-4); }
  .selection-head { flex-direction: column; }
}
</style>
