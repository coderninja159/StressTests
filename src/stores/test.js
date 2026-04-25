import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { supabase } from "../lib/supabase";
import { api, getTestSubmitErrorMessage } from "../lib/api";
import { logError, logInfo } from "../lib/logger";
import { useAuthStore } from "./auth";
import { getLocalQuestionsFixture } from "../lib/seedQuestions";
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

// Massivdan n ta random element olish
function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

function isSchoolIdSchemaError(error) {
  const t = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`.toLowerCase();
  return t.includes("school_id") && (t.includes("does not exist") || t.includes("schema cache"));
}

/**
 * Savollar: avvalo maktab filtri; xato yoki bo‘sh bo‘lsa — barcha faol savollar (RLS cheklovi).
 */
async function fetchQuestionsForTest(testType, studentSchoolId) {
  if (!supabase) {
    return { data: [], error: new Error("Supabase yo‘q") };
  }

  const baseSelect = () =>
    supabase.from("questions").select("*").eq("test_type", testType).eq("is_active", true);

  let q = baseSelect().order("order_num", { ascending: true });

  if (studentSchoolId) {
    q = q.or(`school_id.is.null,school_id.eq.${studentSchoolId}`);
  } else {
    q = q.is("school_id", null);
  }

  let { data: qs, error } = await q;

  if (error && isSchoolIdSchemaError(error)) {
    const r = await baseSelect().order("order_num", { ascending: true });
    qs = r.data;
    error = r.error;
  }

  if (!error && (!qs || !qs.length)) {
    const r2 = await baseSelect().order("order_num", { ascending: true });
    if (!r2.error && r2.data?.length) {
      qs = r2.data;
    }
  }

  return { data: qs || [], error };
}

export const useTestStore = defineStore("test", () => {
  const authStore = useAuthStore();
  const currentTest = ref(null);
  const questions = ref([]);
  const answerOptionsByQuestionId = ref({});
  const answers = ref({});
  const isLoading = ref(false);
  const errorMessage = ref("");
  const currentQuestionIndex = ref(0);

  const totalQuestions = computed(() => questions.value.length);

  const currentQuestion = computed(() => {
    if (!questions.value.length) return null;
    return questions.value[currentQuestionIndex.value] || null;
  });

  const portraitOptionsForCurrent = computed(() => {
    const q = currentQuestion.value;
    if (!q || currentTest.value !== "portrait") return [];
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
    logInfo("TEST", "START_TEST", { testType });
  };

  const loadQuestions = async (testType, studentSchoolId = null) => {
    logInfo("TEST", "LOAD_QUESTIONS_START", { testType, studentSchoolId });
    isLoading.value = true;
    clearError();

    try {
      if (!supabase) {
        const local = getLocalQuestionsFixture(testType);
        if (!local.questions.length) {
          errorMessage.value = missingSupabaseMessage;
          logError("TEST", "LOAD_QUESTIONS_FAIL_NO_SUPABASE", { message: errorMessage.value });
          return;
        }
        questions.value = testType === "psychological"
          ? pickRandom(local.questions.filter((q) => q.category === "lie_scale"), 3)
              .concat(
                pickRandom(local.questions.filter((q) => q.category === "delinquency"), 3),
                pickRandom(local.questions.filter((q) => q.category === "addiction"), 3),
                pickRandom(local.questions.filter((q) => q.category === "aggression"), 3),
                pickRandom(local.questions.filter((q) => q.category === "self_harm"), 3),
              )
              .sort(() => Math.random() - 0.5)
          : pickRandom(local.questions, 15);
        if (testType === "portrait") {
          const map = {};
          for (const row of local.options) {
            if (!map[row.question_id]) map[row.question_id] = [];
            map[row.question_id].push(row);
          }
          answerOptionsByQuestionId.value = map;
        } else {
          answerOptionsByQuestionId.value = {};
        }
        currentQuestionIndex.value = 0;
        logInfo("TEST", "LOAD_QUESTIONS_LOCAL_FALLBACK_OK", {
          testType,
          count: questions.value.length,
        });
        return;
      }

      const { data: qs, error } = await fetchQuestionsForTest(testType, studentSchoolId);

      if (error) throw error;

      if (!qs?.length) {
        throw new Error("Savollar topilmadi.");
      }

      let selectedQuestions = [];

      if (testType === "psychological") {
        // 5 ta kategoriyadan har biridan 3 ta random → jami 15 ta
        const categories = [
          "lie_scale",
          "delinquency",
          "addiction",
          "aggression",
          "self_harm",
        ];

        categories.forEach((cat) => {
          const catQs = qs.filter((q) => q.category === cat);
          const picked = pickRandom(catQs, 3);
          selectedQuestions.push(...picked);
        });

        // Aralashtiramiz — foydalanuvchi kategoriyani sezmasin
        selectedQuestions = selectedQuestions.sort(() => Math.random() - 0.5);

        if (!selectedQuestions.length) {
          throw new Error(
            "Psixologik savollar bazada yetarli emas (kategoriyalar bo‘yicha). Administratorga murojaat qiling.",
          );
        }
      } else if (testType === "portrait") {
        // 25 ta savoldan 15 ta random
        selectedQuestions = pickRandom(qs, 15);
        if (!selectedQuestions.length) {
          throw new Error("Portret savollari topilmadi.");
        }
      } else {
        selectedQuestions = qs;
      }

      questions.value = selectedQuestions;

      // Portrait uchun answer_options yuklash
      if (testType === "portrait") {
        const ids = selectedQuestions.map((q) => q.id);
        const { data: opts, error: optErr } = await supabase
          .from("answer_options")
          .select("*")
          .in("question_id", ids);

        if (optErr) throw optErr;

        const map = {};
        for (const row of opts || []) {
          if (!map[row.question_id]) map[row.question_id] = [];
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
      logInfo("TEST", "LOAD_QUESTIONS_OK", {
        testType,
        count: questions.value.length,
      });
    } catch (error) {
      const hintRaw = `${error?.message || ""} ${error?.details || ""}`.toLowerCase();
      const shouldUseLocal =
        hintRaw.includes("403") ||
        hintRaw.includes("429") ||
        hintRaw.includes("forbidden") ||
        hintRaw.includes("too many requests");
      if (shouldUseLocal) {
        const local = getLocalQuestionsFixture(testType);
        if (local.questions.length) {
          questions.value = testType === "psychological"
            ? pickRandom(local.questions.filter((q) => q.category === "lie_scale"), 3)
                .concat(
                  pickRandom(local.questions.filter((q) => q.category === "delinquency"), 3),
                  pickRandom(local.questions.filter((q) => q.category === "addiction"), 3),
                  pickRandom(local.questions.filter((q) => q.category === "aggression"), 3),
                  pickRandom(local.questions.filter((q) => q.category === "self_harm"), 3),
                )
                .sort(() => Math.random() - 0.5)
            : pickRandom(local.questions, 15);
          if (testType === "portrait") {
            const map = {};
            for (const row of local.options) {
              if (!map[row.question_id]) map[row.question_id] = [];
              map[row.question_id].push(row);
            }
            answerOptionsByQuestionId.value = map;
          } else {
            answerOptionsByQuestionId.value = {};
          }
          currentQuestionIndex.value = 0;
          errorMessage.value = "";
          logInfo("TEST", "LOAD_QUESTIONS_LOCAL_FALLBACK_OK", {
            testType,
            count: questions.value.length,
            reason: "supabase_403_429",
          });
          return;
        }
      }

      const hint = error?.message || error?.details || "";
      errorMessage.value = hint
        ? `Savollarni yuklashda xatolik: ${hint}`
        : "Savollarni yuklashda xatolik yuz berdi.";
      questions.value = [];
      answerOptionsByQuestionId.value = {};
      logError("TEST", "LOAD_QUESTIONS_FAIL", { testType, message: errorMessage.value });
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const setPsychologicalAnswer = (questionId, value) => {
    answers.value = { ...answers.value, [questionId]: value };
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

    const overallPercentage =
      worstPercent < 0 ? 0 : Math.round(worstPercent * 10) / 10;
    const overallRisk = percentToRiskLevel(overallPercentage);

    categoryScores.summary = {
      overall_risk_level: overallRisk,
      overall_percentage: overallPercentage,
      worst_category: worstCategory,
    };

    const totalScore = RISK_CATEGORIES.reduce(
      (sum, k) => sum + (byCategory[k]?.score || 0),
      0
    );

    return {
      risk_level: overallRisk,
      total_score: totalScore,
      category_scores: categoryScores,
    };
  };

  const buildPortraitPayload = () => {
    const totals = { leadership: 0, social: 0, intellectual: 0, emotional: 0 };

    for (const q of questions.value) {
      const ans = answers.value[q.id];
      if (!ans?.personality_type) continue;
      totals[ans.personality_type] =
        (totals[ans.personality_type] || 0) + (ans.points || 0);
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
        percentage:
          sum > 0 ? Math.round((totals.leadership / sum) * 1000) / 10 : 0,
      },
      social: {
        score: totals.social,
        percentage:
          sum > 0 ? Math.round((totals.social / sum) * 1000) / 10 : 0,
      },
      intellectual: {
        score: totals.intellectual,
        percentage:
          sum > 0 ? Math.round((totals.intellectual / sum) * 1000) / 10 : 0,
      },
      emotional: {
        score: totals.emotional,
        percentage:
          sum > 0 ? Math.round((totals.emotional / sum) * 1000) / 10 : 0,
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

  const submitTest = async () => {
    logInfo("TEST", "SUBMIT_START", {
      testType: currentTest.value,
      questionCount: questions.value.length,
    });

    if (!authStore.token || authStore.currentUser?.role !== "student") {
      errorMessage.value = "Sessiya yaroqsiz. Iltimos qayta kiring.";
      logError("TEST", "SUBMIT_FAIL_NO_STUDENT_SESSION", {
        hasToken: Boolean(authStore.token),
        role: authStore.currentUser?.role || null,
      });
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
      const submitAnswers = questions.value.map((q) => {
        if (testType === "psychological") {
          return {
            question_id: q.id,
            answer_value: answers.value[q.id],
          };
        }
        return {
          question_id: q.id,
          option_id: answers.value[q.id]?.optionId || null,
        };
      });

      const localMetrics =
        testType === "psychological"
          ? buildPsychologicalPayload()
          : buildPortraitPayload();

      const body = {
        test_type: testType,
        answers: submitAnswers,
        score: localMetrics.total_score,
        // Backend yangi contractda bu maydonlarni ham qabul qilsa, statistika aniqroq saqlanadi.
        total_score: localMetrics.total_score,
        risk_level: localMetrics.risk_level,
        personality_type: localMetrics.personality_type,
        category_scores: localMetrics.category_scores,
      };

      const { data } = await api.post("/api/students/test/submit", body);
      const resultId = data?.resultId || data?.result?.id || data?.data?.id || null;
      if (!data?.success || !resultId) {
        throw new Error("Natija saqlanmadi.");
      }
      try {
        // Backend category_scores ba'zan 0/bo'sh qaytganda result sahifada fallback sifatida ishlatamiz
        sessionStorage.setItem(
          `result_metrics_${resultId}`,
          JSON.stringify({
            test_type: testType,
            total_score: localMetrics.total_score,
            risk_level: localMetrics.risk_level,
            personality_type: localMetrics.personality_type,
            category_scores: localMetrics.category_scores,
          }),
        );
      } catch {
        // ignore storage errors
      }
      logInfo("TEST", "SUBMIT_OK", { testType, resultId });
      await router.push({ path: "/student/result", query: { id: resultId } });
      resetForSelection();
      return resultId;
    } catch (error) {
      errorMessage.value = getTestSubmitErrorMessage(error);
      logError("TEST", "SUBMIT_FAIL", {
        testType: currentTest.value,
        message: errorMessage.value,
      });
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