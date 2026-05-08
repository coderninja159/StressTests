<template>
  <div class="student-page">
    <section class="hero">
      <div>
        <p class="hero-kicker">Student Dashboard</p>
        <h1>Salom, {{ studentName }}</h1>
        <p class="hero-sub">Stress holatini kuzatish, testlarni boshlash va natijalarni bir joyda ko'rish mumkin.</p>
      </div>
      <div class="hero-actions">
        <BaseButton variant="secondary" @click="onLogout">Chiqish</BaseButton>
      </div>
    </section>

    <LoadingSpinner v-if="loading" text="Ma'lumotlar yuklanmoqda..." />

    <template v-else>
      <div class="quick-stats">
        <BaseCard class="stat-card">
          <p class="stat-label">Student ID</p>
          <p class="stat-value">{{ studentIdDisplay }}</p>
        </BaseCard>
        <BaseCard class="stat-card">
          <p class="stat-label">Sinf</p>
          <p class="stat-value">{{ classDisplay }}</p>
        </BaseCard>
        <BaseCard class="stat-card">
          <p class="stat-label">Yosh</p>
          <p class="stat-value">{{ ageDisplay }}</p>
        </BaseCard>
      </div>

      <BaseCard class="panel mb">
        <h2 class="card-title">Oxirgi test natijasi</h2>
        <template v-if="resultLoading">
          <div class="result-skeleton" aria-hidden="true">
            <div class="sk-line w-40" />
            <div class="sk-line w-70" />
            <div class="sk-line w-55" />
          </div>
        </template>
        <ApiErrorAlert
          v-else-if="loadError"
          :message="loadError"
          :retryable="true"
          :show-details="isDev"
          :details="loadErrorDetails"
          @retry="loadLatest"
        />
        <template v-else-if="latestResult">
          <ul class="info-list">
            <li><span>Test turi:</span> {{ testTypeLabel(latestResult.test_type) }}</li>
            <li><span>Xavf / natija:</span> {{ resultRiskOrPortrait(latestResult) }}</li>
            <li><span>Sana:</span> {{ formatDate(latestResult.taken_at || "Noma'lum vaqt") }}</li>
          </ul>
          <BaseButton variant="primary" class="mt" @click="openResult">Natijani ko'rish</BaseButton>
        </template>
        <p v-else class="muted">Hali test topshirilmagan.</p>
      </BaseCard>

      <div class="cta-row">
        <BaseButton variant="primary" class="big-btn" @click="goTest">Yangi test boshlash</BaseButton>
      </div>

      <div class="alert alert-warn disclaimer">
        <svg class="alert-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
        </svg>
        <span>Diqqat: bu test tibbiy tashxis emas. Muammo sezilsa ishonchli katta yoki mutaxassisga murojaat qiling.</span>
      </div>

      <section class="extra-grid">
        <BaseCard class="extra-card motion-card">
          <h3>Kunlik tavsiya</h3>
          <p>10-15 daqiqa yurish, chuqur nafas mashqlari va uxlash rejimini barqaror ushlash stressni sezilarli kamaytiradi.</p>
        </BaseCard>
        <BaseCard class="extra-card pulse-card">
          <h3>Keyingi qadam</h3>
          <p>Bugungi holatingizni yangilash uchun testni qayta boshlang yoki oxirgi natijani ochib AI izohni o'qing.</p>
        </BaseCard>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import BaseButton from "../../components/ui/BaseButton.vue";
import BaseCard from "../../components/ui/BaseCard.vue";
import ApiErrorAlert from "../../components/ui/ApiErrorAlert.vue";
import LoadingSpinner from "../../components/ui/LoadingSpinner.vue";
import {
  api,
  getApiErrorMessage,
  normalizeStudentResults,
  technicalErrorDetails,
} from "../../lib/api";
import { logError, logInfo } from "../../lib/logger";
import { useAuthStore } from "../../stores/auth";
import { useTestStore } from "../../stores/test";

const router = useRouter();
const authStore = useAuthStore();
const testStore = useTestStore();

const loading = ref(true);
const resultLoading = ref(false);
const loadError = ref("");
const loadErrorDetails = ref(null);
const latestResult = ref(null);
const isDev = import.meta.env.DEV;

const studentName = computed(
  () => authStore.currentUser?.full_name || authStore.currentUser?.fullName || "O'quvchi",
);
const studentIdDisplay = computed(
  () => authStore.currentUser?.student_id || authStore.currentUser?.studentId || "—",
);
const classDisplay = computed(
  () => authStore.currentUser?.class_name || authStore.currentUser?.className || "—",
);
const ageDisplay = computed(() => {
  const a = authStore.currentUser?.age;
  return a != null && a !== "" ? String(a) : "—";
});

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
  logInfo("STUDENT_DASHBOARD", "LOAD_LATEST_START");
  resultLoading.value = true;
  loadError.value = "";
  loadErrorDetails.value = null;
  latestResult.value = null;

  try {
    const { data } = await api.get("/api/students/me/results", {
      params: { limit: 1, offset: 0 },
    });
    const list = data?.success ? normalizeStudentResults(data) : [];
    latestResult.value = list[0] || null;
    logInfo("STUDENT_DASHBOARD", "LOAD_LATEST_OK", {
      hasResult: Boolean(latestResult.value?.id),
      resultId: latestResult.value?.id || null,
    });
  } catch (error) {
    loadError.value = getApiErrorMessage(error, "Oxirgi natijani yuklab bo'lmadi.");
    loadErrorDetails.value = technicalErrorDetails(error);
    logError("STUDENT_DASHBOARD", "LOAD_LATEST_FAIL", { message: loadError.value });
  } finally {
    resultLoading.value = false;
  }
}

function openResult() {
  if (!latestResult.value?.id) {
    return;
  }
  router.push({ path: "/student/result", query: { id: latestResult.value.id } });
}

function goTest() {
  logInfo("STUDENT_DASHBOARD", "GO_TEST");
  testStore.resetForSelection();
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
  logInfo("STUDENT_DASHBOARD", "MOUNT_START");
  loading.value = true;
  try {
    await authStore.fetchCurrentUser();
  } catch {
    /* sessiya / tarmoq */
  }
  await loadLatest();
  loading.value = false;
  logInfo("STUDENT_DASHBOARD", "MOUNT_DONE");
});
</script>

<style scoped>
.student-page {
  min-height: 100dvh;
  padding: var(--s-7);
  background:
    radial-gradient(ellipse 110% 80% at 100% 0%, rgba(99, 102, 241, 0.06), transparent 56%),
    radial-gradient(ellipse 120% 90% at 0% 100%, rgba(45, 212, 191, 0.05), transparent 58%),
    transparent;
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--s-4);
  margin-bottom: var(--s-6);
  padding: var(--s-6);
  border-radius: var(--r-2xl);
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  box-shadow: var(--sh-sm);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  animation: slideUp 0.25s var(--ease-out);
}

.hero-actions {
  display: flex;
  align-items: center;
}
.hero-actions :deep(.btn) {
  border-radius: var(--r-lg);
}

.result-skeleton {
  display: grid;
  gap: 10px;
}

.sk-line {
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 300% 100%;
  animation: sk 1.2s infinite linear;
}

.w-40 {
  width: 40%;
}
.w-55 {
  width: 55%;
}
.w-70 {
  width: 70%;
}

@keyframes sk {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: 0 0;
  }
}

.hero-kicker {
  color: var(--brand);
  font-weight: 700;
  font-size: .78rem;
  letter-spacing: .08em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(1.5rem, 2.5vw, 2rem);
}

.hero-sub {
  margin-top: var(--s-2);
  max-width: 640px;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--s-4);
  margin-bottom: var(--s-5);
}

.stat-card {
  border-radius: var(--r-xl);
  border: 1px solid var(--border);
  box-shadow: var(--sh-sm);
  background:
    linear-gradient(160deg, color-mix(in srgb, var(--surface) 96%, transparent), color-mix(in srgb, var(--surface-2) 92%, transparent));
  transition: var(--t-spr);
}

.stat-card:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--brand) 38%, var(--border));
  box-shadow: var(--sh-md);
}

.stat-label {
  font-size: .78rem;
  color: var(--text-3);
  margin: 0 0 var(--s-2);
}

.stat-value {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 800;
  font-family: 'Space Grotesk', sans-serif;
  color: var(--text);
}

.mb { margin-bottom: var(--s-4); }

.panel {
  border-radius: var(--r-2xl);
  border: 1px solid var(--border);
  box-shadow: var(--sh-md);
  background: color-mix(in srgb, var(--surface) 94%, transparent);
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
  margin-top: var(--s-3);
}

.cta-row {
  display: flex;
  justify-content: flex-start;
}

.big-btn {
  min-width: 260px;
  width: auto;
  font-size: 1rem;
  border-radius: var(--r-xl);
  box-shadow: var(--sh-brand);
}

.disclaimer {
  margin-top: var(--s-5);
  align-items: center;
}

.alert {
  color: var(--color-danger);
  font-weight: 600;
}

.extra-grid {
  margin-top: var(--s-5);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--s-4);
}

.extra-card {
  min-height: 156px;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border);
  box-shadow: var(--sh-sm);
  background: color-mix(in srgb, var(--surface) 94%, transparent);
}

.extra-card h3 {
  margin: 0 0 var(--s-2);
  font-size: 1rem;
}

.extra-card p {
  margin: 0;
  font-size: 0.92rem;
  color: var(--text-2);
}

.motion-card::after,
.pulse-card::after {
  content: "";
  position: absolute;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  right: -70px;
  bottom: -80px;
  pointer-events: none;
}

.motion-card::after {
  background: radial-gradient(circle, rgba(99, 102, 241, 0.2), transparent 68%);
  animation: driftGlow 8.2s ease-in-out infinite;
}

.pulse-card::after {
  background: radial-gradient(circle, rgba(45, 212, 191, 0.16), transparent 68%);
  animation: driftGlow 9.4s ease-in-out infinite reverse;
}

@keyframes driftGlow {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.8; }
  50% { transform: translate(-12px, -16px) scale(1.08); opacity: 1; }
}

@media (max-width: 900px) {
  .quick-stats { grid-template-columns: 1fr; }
  .extra-grid { grid-template-columns: 1fr; }
  .cta-row .big-btn { width: 100%; }
  .student-page { padding: var(--s-5); }
  .hero-actions { width: 100%; }
  .hero-actions :deep(.btn) { width: 100%; }
}

[data-theme="dark"] .hero,
[data-theme="dark"] .panel,
[data-theme="dark"] .extra-card,
[data-theme="dark"] .stat-card {
  border-color: rgba(129, 140, 248, 0.22);
}
</style>
