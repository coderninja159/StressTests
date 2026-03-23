<template>
  <div class="test-page">
    <div v-if="!testStore.currentTest && !testStore.isLoading" class="selection">
      <h1>Testni tanlang</h1>
      <p class="lead">O'zingizga mos test turini bitta tanlang va boshlang.</p>

      <div class="cards">
        <button type="button" class="card" @click="pickPsychological">
          <h2>Psixologik test</h2>
          <p class="meta">75 savol • 20–25 daqiqa • Stress va xavf darajasini aniqlaydi</p>
        </button>
        <button type="button" class="card" @click="pickPortrait">
          <h2>Psixologik portret testi</h2>
          <p class="meta">25 savol • 10 daqiqa • Shaxsiyat turini aniqlaydi</p>
        </button>
      </div>

      <p v-if="testStore.errorMessage" class="error">{{ testStore.errorMessage }}</p>
    </div>

    <div v-else-if="testStore.isLoading && !testStore.questions.length" class="loading-wrap">
      <div class="spinner" aria-hidden="true" />
      <p>Savollar yuklanmoqda...</p>
    </div>

    <div v-else-if="testStore.currentTest && testStore.currentQuestion" class="session">
      <div class="top-bar">
        <button type="button" class="link-btn" :disabled="testStore.isLoading" @click="cancelTest">
          ← Test tanloviga
        </button>
        <div class="progress-line">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }" />
        </div>
        <span class="progress-text">{{ progressCurrent }} / {{ testStore.totalQuestions }}</span>
      </div>

      <div class="question-card">
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
  min-height: 100vh;
  padding: var(--space-5);
  max-width: 720px;
  margin: 0 auto;
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
  gap: var(--space-4);
}

.card {
  text-align: left;
  padding: var(--space-5);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
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
  gap: var(--space-3);
  margin-bottom: var(--space-4);
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
  height: 8px;
  background: var(--color-border);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.2s ease;
}

.progress-text {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  min-width: 4.5rem;
  text-align: right;
}

.question-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
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
  border-radius: var(--radius-sm);
  border: 2px solid var(--color-border);
  background: #fff;
  cursor: pointer;
  font-weight: 600;
}

.answer-btn.selected {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 12%, white);
  color: var(--color-text);
}

.portrait {
  display: grid;
  gap: var(--space-2);
}

.radio-card {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--color-border);
  background: #fff;
  cursor: pointer;
  font-weight: 500;
}

.radio-card.selected {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, white);
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
  border-radius: var(--radius-sm);
  background: var(--color-primary);
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
</style>
