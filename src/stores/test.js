import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { supabase } from "../lib/supabase";
import router from "../router";

const missingSupabaseMessage =
  "Supabase sozlanmagan. .env faylida VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY ni to'ldiring.";

const PSYCH_ANSWER_SCORE = {
  ha: 2,
  bazan: 1,
  yoq: 0,
};

const RISK_CATEGORIES = ["delinquency", "addiction", "aggression", "self_harm"];

function percentToRiskLevel(percentage) {
  if (percentage <= 33) return "normal";
  if (percentage <= 66) return "medium";
  return "high";
}

export const useTestStore = defineStore("test", () => {
  const currentTest = ref(null);
  const questions = ref([]);
  const answerOptionsByQuestionId = ref({});
  const answers = ref({});
  const isLoading = ref(false);
  const errorMessage = ref("");
  const currentQuestionIndex = ref(0);

  const totalQuestions = computed(() => questions.value.length);

  const currentQuestion = computed(() => {
    if (!questions.value.length) {
      return null;
    }
    return questions.value[currentQuestionIndex.value] || null;
  });

  const portraitOptionsForCurrent = computed(() => {
    const q = currentQuestion.value;
    if (!q || currentTest.value !== "portrait") {
      return [];
    }
    return answerOptionsByQuestionId.value[q.id] || [];
  });

  const clearError = () => {
    errorMessage.value = "";
  };

  const resetForSelection = () => {
    currentTest.value = null;
    questions.value = [];
    answerOptionsByQuestionId.value = {};
    answers.value = {};
    currentQuestionIndex.value = 0;
    clearError();
  };

  const startTest = (testType) => {
    currentTest.value = testType;
    answers.value = {};
    currentQuestionIndex.value = 0;
    clearError();
  };

  const loadQuestions = async (testType) => {
    if (!supabase) {
      errorMessage.value = missingSupabaseMessage;
      return;
    }

    isLoading.value = true;
    clearError();

    try {
      const { data: qs, error } = await supabase
        .from("questions")
        .select("*")
        .eq("test_type", testType)
        .eq("is_active", true)
        .order("order_num", { ascending: true });

      if (error) {
        throw error;
      }

      if (!qs?.length) {
        throw new Error("Savollar topilmadi. Avval ma'lumotlarni yuklang (seedQuestions).");
      }

      questions.value = qs;

      if (testType === "portrait") {
        const ids = qs.map((q) => q.id);
        const { data: opts, error: optErr } = await supabase
          .from("answer_options")
          .select("*")
          .in("question_id", ids);

        if (optErr) {
          throw optErr;
        }

        const map = {};
        for (const row of opts || []) {
          if (!map[row.question_id]) {
            map[row.question_id] = [];
          }
          map[row.question_id].push(row);
        }
        for (const id of Object.keys(map)) {
          map[id].sort((a, b) => String(a.id).localeCompare(String(b.id)));
        }
        answerOptionsByQuestionId.value = map;
      } else {
        answerOptionsByQuestionId.value = {};
      }

      currentQuestionIndex.value = 0;
    } catch (error) {
      errorMessage.value = "Savollarni yuklashda xatolik yuz berdi.";
      questions.value = [];
      answerOptionsByQuestionId.value = {};
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const setPsychologicalAnswer = (questionId, value) => {
    answers.value = {
      ...answers.value,
      [questionId]: value,
    };
  };

  const setPortraitAnswer = (questionId, option) => {
    answers.value = {
      ...answers.value,
      [questionId]: {
        optionId: option.id,
        personality_type: option.personality_type,
        points: option.points,
      },
    };
  };

  const goNext = () => {
    if (currentQuestionIndex.value < totalQuestions.value - 1) {
      currentQuestionIndex.value += 1;
    }
  };

  const goPrev = () => {
    if (currentQuestionIndex.value > 0) {
      currentQuestionIndex.value -= 1;
    }
  };

  const buildPsychologicalPayload = () => {
    const byCategory = {};
    let lieScore = 0;
    let lieMax = 0;

    for (const q of questions.value) {
      const raw = answers.value[q.id];
      const score = PSYCH_ANSWER_SCORE[raw] ?? 0;
      const maxForQ = 2;

      if (q.category === "lie_scale") {
        lieScore += score;
        lieMax += maxForQ;
        continue;
      }

      if (!byCategory[q.category]) {
        byCategory[q.category] = { score: 0, max: 0, count: 0 };
      }
      byCategory[q.category].score += score;
      byCategory[q.category].max += maxForQ;
      byCategory[q.category].count += 1;
    }

    const categoryScores = {
      lie_scale: {
        score: lieScore,
        max: lieMax,
        percentage: lieMax > 0 ? Math.round((lieScore / lieMax) * 1000) / 10 : 0,
        note: "Yolg'on ko'rsatkichi — umumiy xavf hisobiga kirmaydi",
      },
    };

    let worstCategory = null;
    let worstPercent = -1;

    for (const key of RISK_CATEGORIES) {
      const block = byCategory[key] || { score: 0, max: 0, count: 0 };
      const percentage = block.max > 0 ? (block.score / block.max) * 100 : 0;
      const level = percentToRiskLevel(percentage);
      categoryScores[key] = {
        score: block.score,
        max: block.max,
        question_count: block.count,
        percentage: Math.round(percentage * 10) / 10,
        level,
        label: {
          delinquency: "Huquqbuzarlik moyilligi",
          addiction: "Zavisimlik moyilligi",
          aggression: "Tajovuzkorlik",
          self_harm: "O'z-o'ziga zarar",
        }[key],
      };

      if (percentage > worstPercent) {
        worstPercent = percentage;
        worstCategory = key;
      }
    }

    const overallPercentage = worstPercent < 0 ? 0 : Math.round(worstPercent * 10) / 10;
    const overallRisk = percentToRiskLevel(overallPercentage);

    categoryScores.summary = {
      overall_risk_level: overallRisk,
      overall_percentage: overallPercentage,
      worst_category: worstCategory,
    };

    const totalScore =
      RISK_CATEGORIES.reduce((sum, k) => sum + (byCategory[k]?.score || 0), 0);

    return {
      risk_level: overallRisk,
      total_score: totalScore,
      category_scores: categoryScores,
    };
  };

  const buildPortraitPayload = () => {
    const totals = {
      leadership: 0,
      social: 0,
      intellectual: 0,
      emotional: 0,
    };

    for (const q of questions.value) {
      const ans = answers.value[q.id];
      if (!ans?.personality_type) {
        continue;
      }
      totals[ans.personality_type] = (totals[ans.personality_type] || 0) + (ans.points || 0);
    }

    const sum = Object.values(totals).reduce((a, b) => a + b, 0);
    const order = ["leadership", "social", "intellectual", "emotional"];

    let winner = order[0];
    let best = totals.leadership;

    for (const t of order) {
      if (totals[t] > best) {
        best = totals[t];
        winner = t;
      }
    }

    const category_scores = {
      leadership: {
        score: totals.leadership,
        percentage: sum > 0 ? Math.round((totals.leadership / sum) * 1000) / 10 : 0,
      },
      social: {
        score: totals.social,
        percentage: sum > 0 ? Math.round((totals.social / sum) * 1000) / 10 : 0,
      },
      intellectual: {
        score: totals.intellectual,
        percentage: sum > 0 ? Math.round((totals.intellectual / sum) * 1000) / 10 : 0,
      },
      emotional: {
        score: totals.emotional,
        percentage: sum > 0 ? Math.round((totals.emotional / sum) * 1000) / 10 : 0,
      },
      total_points: sum,
    };

    return {
      personality_type: winner,
      total_score: sum,
      category_scores,
      risk_level: null,
    };
  };

  const submitTest = async (userId) => {
    if (!supabase) {
      errorMessage.value = missingSupabaseMessage;
      return null;
    }

    if (!userId) {
      errorMessage.value = "Foydalanuvchi aniqlanmadi. Qayta kiring.";
      return null;
    }

    if (!currentTest.value || !questions.value.length) {
      errorMessage.value = "Test boshlanmagan.";
      return null;
    }

    const testType = currentTest.value;

    if (testType === "psychological") {
      for (const q of questions.value) {
        if (answers.value[q.id] === undefined || answers.value[q.id] === null) {
          errorMessage.value = "Barcha savollarga javob bering.";
          return null;
        }
      }
    } else {
      for (const q of questions.value) {
        if (!answers.value[q.id]?.optionId) {
          errorMessage.value = "Barcha savollarga javob bering.";
          return null;
        }
      }
    }

    isLoading.value = true;
    clearError();

    try {
      let insertRow;

      if (testType === "psychological") {
        insertRow = buildPsychologicalPayload();
        const { data, error } = await supabase
          .from("results")
          .insert({
            user_id: userId,
            test_type: "psychological",
            total_score: insertRow.total_score,
            risk_level: insertRow.risk_level,
            category_scores: insertRow.category_scores,
            personality_type: null,
            ai_explanation: null,
            ai_professional: null,
          })
          .select("id")
          .single();

        if (error) {
          throw error;
        }

        await router.push({ path: "/student/result", query: { id: data.id } });
        resetForSelection();
        return data.id;
      }

      insertRow = buildPortraitPayload();
      const { data, error } = await supabase
        .from("results")
        .insert({
          user_id: userId,
          test_type: "portrait",
          total_score: insertRow.total_score,
          risk_level: null,
          category_scores: insertRow.category_scores,
          personality_type: insertRow.personality_type,
          ai_explanation: null,
          ai_professional: null,
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      await router.push({ path: "/student/result", query: { id: data.id } });
      resetForSelection();
      return data.id;
    } catch (error) {
      errorMessage.value = "Natijani saqlashda xatolik yuz berdi.";
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    currentTest,
    questions,
    answerOptionsByQuestionId,
    answers,
    isLoading,
    errorMessage,
    currentQuestionIndex,
    totalQuestions,
    currentQuestion,
    portraitOptionsForCurrent,
    clearError,
    resetForSelection,
    startTest,
    loadQuestions,
    setPsychologicalAnswer,
    setPortraitAnswer,
    goNext,
    goPrev,
    submitTest,
  };
});
