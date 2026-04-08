<template>
  <div class="auth-page">
    <AppTopbar :show-nav-toggle="false">
      <template #title>
        <span class="page-title" style="font-size: 1.1rem">StressTest</span>
      </template>
    </AppTopbar>
    <div class="register-shell">
    <div class="register-card">
      <div class="reg-header">
        <div class="reg-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" x2="19" y1="8" y2="14" />
            <line x1="22" x2="16" y1="11" y2="11" />
          </svg>
        </div>
        <div>
          <h1>Ro'yxatdan o'tish</h1>
          <p class="reg-school">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; margin-right: 4px">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
            {{ schoolName || "Noma'lum maktab" }}
          </p>
        </div>
      </div>

      <div v-if="pageError || authStore.errorMessage" class="alert alert-error" style="margin-bottom: var(--s-5)">
        <svg class="alert-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{{ pageError || authStore.errorMessage }}</span>
      </div>

      <form class="reg-form" @submit.prevent="submitRegister">
        <div class="field">
          <label class="field-label">Ism</label>
          <div class="input-wrap">
            <span class="input-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <input
              v-model.trim="form.firstName"
              type="text"
              class="input"
              :class="{ 'is-error': errors.firstName }"
              placeholder="Masalan: Ali"
              autocomplete="given-name"
              @input="onFirstNameInput"
              @blur="onFirstNameBlur"
            />
          </div>
          <span v-if="errors.firstName" class="field-error">{{ errors.firstName }}</span>
        </div>

        <div class="field">
          <label class="field-label">Familiya</label>
          <div class="input-wrap">
            <span class="input-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <input
              v-model.trim="form.lastName"
              type="text"
              class="input"
              :class="{ 'is-error': errors.lastName }"
              placeholder="Masalan: Valiyev"
              autocomplete="family-name"
              @input="onLastNameInput"
              @blur="onLastNameBlur"
            />
          </div>
          <span v-if="errors.lastName" class="field-error">{{ errors.lastName }}</span>
        </div>

        <div class="field">
          <label class="field-label">Yosh</label>
          <div class="input-wrap">
            <span class="input-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
            </span>
            <input
              v-model.number="form.age"
              type="number"
              class="input"
              :class="{ 'is-error': errors.age }"
              placeholder="7 — 18"
              min="7"
              max="18"
              @input="onAgeInput"
              @blur="onAgeBlur"
            />
          </div>
          <span v-if="errors.age" class="field-error">{{ errors.age }}</span>
        </div>

        <div class="field">
          <label class="field-label">Telefon</label>
          <div class="input-wrap">
            <span class="input-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.11 4.18 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.72c.12.86.3 1.7.54 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.1a2 2 0 0 1 2.11-.45c.8.24 1.64.42 2.5.54A2 2 0 0 1 22 16.92z" />
              </svg>
            </span>
            <input
              v-model="form.phone"
              type="tel"
              class="input"
              :class="{ 'is-error': errors.phone }"
              placeholder="+998901234567"
              autocomplete="tel"
              @input="onPhoneInput"
              @blur="onPhoneBlur"
            />
          </div>
          <span v-if="errors.phone" class="field-error">{{ errors.phone }}</span>
        </div>

        <div class="field">
          <label class="field-label">Sinf</label>
          <div class="input-wrap">
            <span class="input-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </span>
            <select
              v-model="form.className"
              class="select"
              :class="{ 'is-error': errors.className }"
              style="padding-left: var(--s-10)"
              @change="onClassChange"
              @blur="onClassBlur"
            >
              <option value="">Sinfni tanlang</option>
              <option v-for="item in classOptions" :key="item" :value="item">{{ item }}</option>
            </select>
          </div>
          <span v-if="errors.className" class="field-error">{{ errors.className }}</span>
        </div>

        <button type="submit" class="btn btn-primary btn-xl btn-full" :disabled="isSubmitDisabled" style="margin-top: var(--s-2)">
          <span v-if="authStore.isLoading" class="spin"></span>
          <span v-else>Ro'yxatdan o'tish</span>
        </button>
      </form>
    </div>

    <div v-if="showModal" class="overlay">
      <div class="modal">
        <div class="modal-head">
          <h3>Muvaffaqiyatli ro'yxatdan o'tdingiz</h3>
        </div>
        <div class="modal-body">
          <div class="id-block">
            <p class="id-label">Sizning Student ID:</p>
            <div class="id-value">{{ createdStudentId }}</div>
            <p class="id-hint">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; margin-right: 4px">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
              Bu ID ni eslab qoling — keyingi kirishda kerak bo'ladi
            </p>
          </div>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn btn-primary btn-lg" @click="goToDashboard">
            Dashboardga o'tish
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import AppTopbar from "../../components/layout/AppTopbar.vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const schoolId = computed(() => route.query.schoolId || "");
const schoolName = computed(() => route.query.schoolName || "");

const form = reactive({ firstName: "", lastName: "", age: null, className: "", phone: "" });
const errors = reactive({ firstName: "", lastName: "", age: "", className: "", phone: "" });
const touched = reactive({ firstName: false, lastName: false, age: false, phone: false, className: false });

const showModal = ref(false);
const createdStudentId = ref("");
const pageError = ref("");

const PHONE_RE = /^\+998[0-9]{9}$/;

const classOptions = Array.from({ length: 11 }, (_, i) => i + 1).flatMap((grade) => ["A", "B", "D"].map((letter) => `${grade}-${letter}`));

/** Faqat harflar va lotincha qisqartma uchun ' (defis, raqam, bo'sh joy yo'q) */
const NAME_PART_RE = /^[\p{L}']+$/u;

function validateFirstName(showEmpty) {
  const t = String(form.firstName || "").trim();
  if (!t) {
    errors.firstName = showEmpty ? "Ismingizni kiriting" : "";
    return false;
  }
  if (t.length < 2) {
    errors.firstName = "Ism kamida 2 ta harfdan iborat bo'lsin";
    return false;
  }
  if (!NAME_PART_RE.test(t)) {
    errors.firstName = "Faqat harflar: defis (-), raqam va boshqa belgilar mumkin emas";
    return false;
  }
  errors.firstName = "";
  return true;
}

function validateLastName(showEmpty) {
  const t = String(form.lastName || "").trim();
  if (!t) {
    errors.lastName = showEmpty ? "Familiyangizni kiriting" : "";
    return false;
  }
  if (t.length < 2) {
    errors.lastName = "Familiya kamida 2 ta harfdan iborat bo'lsin";
    return false;
  }
  if (!NAME_PART_RE.test(t)) {
    errors.lastName = "Faqat harflar: defis (-), raqam va boshqa belgilar mumkin emas";
    return false;
  }
  errors.lastName = "";
  return true;
}

function validateAge(showEmpty) {
  const value = form.age;
  if (value === null || value === undefined || String(value) === "") {
    errors.age = showEmpty ? "7 dan 18 gacha yosh kiriting" : "";
    return false;
  }
  if (!Number.isInteger(Number(value)) || value < 7 || value > 18) {
    errors.age = "7 dan 18 gacha yosh kiriting";
    return false;
  }
  errors.age = "";
  return true;
}

function validatePhone(showEmpty) {
  const cleaned = String(form.phone || "").replace(/\s/g, "").trim();
  form.phone = cleaned;
  if (!cleaned) {
    errors.phone = showEmpty ? "Telefon raqam kiriting" : "";
    return false;
  }
  if (!PHONE_RE.test(cleaned)) {
    errors.phone = "+998 bilan boshlab 12 ta raqam kiriting";
    return false;
  }
  errors.phone = "";
  return true;
}

function validateClass(showEmpty) {
  if (!form.className) {
    errors.className = showEmpty ? "Sinfni tanlang" : "";
    return false;
  }
  errors.className = "";
  return true;
}

function cleanNamePart(e) {
  return String(e.target.value || "")
    .replace(/[^\p{L}']/gu, "")
    .trimStart();
}

const onFirstNameInput = (e) => {
  form.firstName = cleanNamePart(e);
  if (touched.firstName) validateFirstName(true);
};

const onFirstNameBlur = () => {
  touched.firstName = true;
  form.firstName = String(form.firstName || "").trim();
  validateFirstName(true);
};

const onLastNameInput = (e) => {
  form.lastName = cleanNamePart(e);
  if (touched.lastName) validateLastName(true);
};

const onLastNameBlur = () => {
  touched.lastName = true;
  form.lastName = String(form.lastName || "").trim();
  validateLastName(true);
};

const onAgeInput = () => {
  if (touched.age) validateAge(true);
};

const onAgeBlur = () => {
  touched.age = true;
  validateAge(true);
};

const onPhoneInput = (e) => {
  let v = String(e.target.value || "").replace(/\s/g, "");
  if (v && !v.startsWith("+")) {
    v = v.replace(/^0+/, "");
    if (!v.startsWith("998")) v = `998${v}`;
    v = `+${v}`;
  }
  form.phone = v;
  if (touched.phone) validatePhone(true);
};

const onPhoneBlur = () => {
  touched.phone = true;
  validatePhone(true);
};

const onClassChange = () => {
  touched.className = true;
  validateClass(true);
};

const onClassBlur = () => {
  touched.className = true;
  validateClass(true);
};

const resetErrors = () => {
  errors.firstName = "";
  errors.lastName = "";
  errors.age = "";
  errors.className = "";
  errors.phone = "";
  pageError.value = "";
  authStore.clearError();
};

const isSubmitDisabled = computed(() => {
  if (authStore.isLoading) return true;
  return Boolean(errors.firstName || errors.lastName || errors.age || errors.className || errors.phone);
});

const submitRegister = async () => {
  resetErrors();
  touched.firstName = true;
  touched.lastName = true;
  touched.age = true;
  touched.phone = true;
  touched.className = true;

  if (!schoolId.value) {
    pageError.value = "Avval maktab kodini tasdiqlang.";
    await router.push("/auth/login");
    return;
  }

  const okFirst = validateFirstName(true);
  const okLast = validateLastName(true);
  const okAge = validateAge(true);
  const okPhone = validatePhone(true);
  const okClass = validateClass(true);

  if (!okFirst || !okLast || !okAge || !okPhone || !okClass) return;

  try {
    const studentId = await authStore.registerStudent({
      firstName: form.firstName,
      lastName: form.lastName,
      age: form.age,
      className: form.className,
      schoolId: schoolId.value,
      phone: form.phone.replace(/\s/g, "").trim(),
    });
    if (!studentId) return;
    createdStudentId.value = studentId;
    showModal.value = true;
  } catch {
    /* store xabar beradi */
  }
};

const goToDashboard = async () => {
  showModal.value = false;
  await router.push("/student/dashboard");
};
</script>

<style scoped>
.reg-header {
  display: flex;
  align-items: center;
  gap: var(--s-4);
  margin-bottom: var(--s-7);
  padding-bottom: var(--s-6);
  border-bottom: 1px solid var(--border);
}

.reg-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--r-lg);
  background: linear-gradient(135deg, var(--brand), var(--brand-light));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--sh-brand);
}

.reg-header h1 {
  font-size: 1.4rem;
  margin-bottom: 4px;
}

.reg-school {
  font-size: 0.825rem;
  color: var(--text-3);
  margin: 0;
}

.reg-form {
  display: flex;
  flex-direction: column;
  gap: var(--s-5);
}

.id-block {
  background: var(--surface-2);
  border-radius: var(--r-lg);
  padding: var(--s-5);
  text-align: center;
  border: 1px solid var(--border);
}

.id-label {
  font-size: 0.825rem;
  color: var(--text-3);
  margin-bottom: var(--s-3);
}

.id-value {
  font-size: 1.75rem;
  font-weight: 800;
  font-family: "Space Grotesk", sans-serif;
  letter-spacing: 0.06em;
  color: var(--brand);
  margin-bottom: var(--s-4);
}

.id-hint {
  font-size: 0.78rem;
  color: var(--warn);
  margin: 0;
  line-height: 1.5;
}
</style>
