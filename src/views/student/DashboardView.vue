<template>
  <div class="dash">
    <header class="top">
      <h1>Salom, {{ studentName }}! 👋</h1>
      <BaseButton variant="secondary" @click="onLogout">Chiqish</BaseButton>
    </header>

    <div v-if="!supabaseOk" class="alert">Supabase sozlanmagan.</div>
    <LoadingSpinner v-else-if="loading" text="Ma'lumotlar yuklanmoqda..." />

    <template v-else>
      <p v-if="loadError" class="alert">{{ loadError }}</p>

      <BaseCard class="mb">
        <h2 class="card-title">O'quvchi ma'lumotlari</h2>
        <ul class="info-list">
          <li><span>Student ID:</span> {{ studentIdDisplay }}</li>
          <li><span>Sinf:</span> {{ classDisplay }}</li>
          <li><span>Yosh:</span> {{ ageDisplay }}</li>
        </ul>
      </BaseCard>

      <BaseCard class="mb">
        <h2 class="card-title">Oxirgi test natijasi</h2>
        <template v-if="latestResult">
          <ul class="info-list">
            <li><span>Test turi:</span> {{ testTypeLabel(latestResult.test_type) }}</li>
            <li><span>Xavf / natija:</span> {{ resultRiskOrPortrait(latestResult) }}</li>
            <li><span>Sana:</span> {{ formatDate(latestResult.taken_at) }}</li>
          </ul>
          <BaseButton variant="primary" class="mt" @click="openResult">Natijani ko'rish</BaseButton>
        </template>
        <p v-else class="muted">Hali test topshirilmagan.</p>
      </BaseCard>

      <BaseButton variant="primary" class="big-btn" @click="goTest">Yangi test boshlash</BaseButton>

      <p class="disclaimer">
        ⚠️ Diqqat: Bu test tibbiy tashxis emas. Muammo sezilsa ishonchli kattaga yoki mutaxassisga
        murojaat qiling.
      </p>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import BaseButton from "../../components/ui/BaseButton.vue";
import BaseCard from "../../components/ui/BaseCard.vue";
import LoadingSpinner from "../../components/ui/LoadingSpinner.vue";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const supabaseOk = Boolean(supabase);
const loading = ref(true);
const loadError = ref("");
const latestResult = ref(null);

const studentName = computed(() => authStore.currentUser?.full_name || "O'quvchi");
const studentIdDisplay = computed(() => authStore.currentUser?.student_id || "—");
const classDisplay = computed(() => authStore.currentUser?.class_name || "—");
const ageDisplay = computed(() =>
  authStore.currentUser?.age != null ? String(authStore.currentUser.age) : "—",
);

function testTypeLabel(t) {
  if (t === "psychological") return "Psixologik test";
  if (t === "portrait") return "Psixologik portret testi";
  return t || "—";
}

function riskLabel(level) {
  if (level === "high") return "Yuqori xavf";
  if (level === "medium") return "O'rta xavf";
  if (level === "normal") return "Normal";
  return level || "—";
}

function portraitLabel(t) {
  const map = {
    leadership: "Yo'lboshchi",
    social: "Muloqotchi",
    intellectual: "Mutafakkir",
    emotional: "Sezgir",
  };
  return map[t] || t || "—";
}

function resultRiskOrPortrait(r) {
  if (r.test_type === "psychological") {
    return riskLabel(r.risk_level);
  }
  return portraitLabel(r.personality_type);
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

async function loadLatest() {
  loadError.value = "";
  latestResult.value = null;

  const uid = authStore.currentUser?.id;
  if (!supabase || !uid) {
    return;
  }

  try {
    const { data, error } = await supabase
      .from("results")
      .select("*")
      .eq("user_id", uid)
      .order("taken_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    latestResult.value = data || null;
  } catch {
    loadError.value = "Oxirgi natijani yuklab bo'lmadi.";
  }
}

function openResult() {
  if (!latestResult.value?.id) {
    return;
  }
  router.push({ path: "/student/result", query: { id: latestResult.value.id } });
}

function goTest() {
  router.push("/student/test");
}

async function onLogout() {
  try {
    await authStore.logout();
  } catch {
    // store
  }
}

onMounted(async () => {
  loading.value = true;
  await loadLatest();
  loading.value = false;
});
</script>

<style scoped>
.dash {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--space-5);
  min-height: 100vh;
}

.top {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}

h1 {
  margin: 0;
  font-size: 1.5rem;
}

.mb {
  margin-bottom: var(--space-4);
}

.card-title {
  margin: 0 0 var(--space-3);
  font-size: 1.05rem;
}

.info-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-2);
}

.info-list span {
  font-weight: 700;
  margin-right: 8px;
}

.muted {
  margin: 0;
  color: var(--color-muted);
}

.mt {
  margin-top: var(--space-3);
}

.big-btn {
  width: 100%;
  padding: 16px;
  font-size: 1.05rem;
}

.disclaimer {
  margin-top: var(--space-5);
  font-size: 0.9rem;
  color: var(--color-muted);
  line-height: 1.5;
}

.alert {
  color: var(--color-danger);
  font-weight: 600;
}
</style>
