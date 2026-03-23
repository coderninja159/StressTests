<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="title">StressTest</h1>
      <p class="subtitle">Tizimga kirish</p>

      <div class="tabs">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'admin' }"
          @click="setTab('admin')"
        >
          Admin
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'psychologist' }"
          @click="setTab('psychologist')"
        >
          Psixolog
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'student' }"
          @click="setTab('student')"
        >
          O'quvchi
        </button>
      </div>

      <form v-if="activeTab === 'admin'" class="form" @submit.prevent="submitAdmin">
        <label for="admin-email">Email</label>
        <input id="admin-email" v-model.trim="adminForm.email" type="email" placeholder="admin@mail.com" />
        <p v-if="adminErrors.email" class="field-error">{{ adminErrors.email }}</p>

        <label for="admin-password">Parol</label>
        <input id="admin-password" v-model="adminForm.password" type="password" placeholder="******" />
        <p v-if="adminErrors.password" class="field-error">{{ adminErrors.password }}</p>

        <button class="submit-btn" :disabled="authStore.isLoading" type="submit">
          <span v-if="authStore.isLoading">Yuklanmoqda...</span>
          <span v-else>Kirish</span>
        </button>
      </form>

      <form v-else-if="activeTab === 'psychologist'" class="form" @submit.prevent="submitPsychologist">
        <label for="psy-email">Email</label>
        <input id="psy-email" v-model.trim="psychologistForm.email" type="email" placeholder="psy@mail.com" />
        <p v-if="psychologistErrors.email" class="field-error">{{ psychologistErrors.email }}</p>

        <label for="psy-password">Parol</label>
        <input id="psy-password" v-model="psychologistForm.password" type="password" placeholder="******" />
        <p v-if="psychologistErrors.password" class="field-error">{{ psychologistErrors.password }}</p>

        <button class="submit-btn" :disabled="authStore.isLoading" type="submit">
          <span v-if="authStore.isLoading">Yuklanmoqda...</span>
          <span v-else>Kirish</span>
        </button>
      </form>

      <div v-else class="form">
        <div class="student-mode">
          <button
            type="button"
            class="mode-btn"
            :class="{ active: studentMode === 'register' }"
            @click="studentMode = 'register'"
          >
            Ro'yxatdan o'tish
          </button>
          <button
            type="button"
            class="mode-btn"
            :class="{ active: studentMode === 'relogin' }"
            @click="studentMode = 'relogin'"
          >
            Qayta kirish
          </button>
        </div>

        <form v-if="studentMode === 'register'" @submit.prevent="submitStudentCode">
          <label>Maktab kodi</label>
          <div class="pin-wrap">
            <input
              v-for="(value, index) in schoolCodeParts"
              :key="index"
              :ref="(el) => setPinRef(el, index)"
              v-model="schoolCodeParts[index]"
              class="pin-input"
              type="text"
              maxlength="1"
              @input="onPinInput(index)"
            />
          </div>
          <p v-if="studentErrors.schoolCode" class="field-error">{{ studentErrors.schoolCode }}</p>

          <button class="submit-btn" :disabled="authStore.isLoading" type="submit">
            <span v-if="authStore.isLoading">Yuklanmoqda...</span>
            <span v-else>Davom etish</span>
          </button>
        </form>

        <form v-else @submit.prevent="submitStudentId">
          <label for="student-id">Student ID</label>
          <input id="student-id" v-model.trim="studentId" type="text" placeholder="ST-2025-0001" />
          <p v-if="studentErrors.studentId" class="field-error">{{ studentErrors.studentId }}</p>

          <button class="submit-btn" :disabled="authStore.isLoading" type="submit">
            <span v-if="authStore.isLoading">Yuklanmoqda...</span>
            <span v-else>Kirish</span>
          </button>
        </form>
      </div>

      <p v-if="authStore.errorMessage" class="global-error">{{ authStore.errorMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";

import { useAuthStore } from "../../stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const activeTab = ref("admin");
const studentMode = ref("register");
const pinRefs = ref([]);

const adminForm = reactive({
  email: "",
  password: "",
});

const psychologistForm = reactive({
  email: "",
  password: "",
});

const schoolCodeParts = ref(["", "", "", ""]);
const studentId = ref("");

const adminErrors = reactive({ email: "", password: "" });
const psychologistErrors = reactive({ email: "", password: "" });
const studentErrors = reactive({ schoolCode: "", studentId: "" });

const setTab = (tab) => {
  activeTab.value = tab;
  authStore.clearError();
};

const resetErrors = (errors) => {
  Object.keys(errors).forEach((key) => {
    errors[key] = "";
  });
};

const setPinRef = (element, index) => {
  pinRefs.value[index] = element;
};

const onPinInput = (index) => {
  schoolCodeParts.value[index] = schoolCodeParts.value[index].toUpperCase().slice(0, 1);
  if (schoolCodeParts.value[index] && index < 3) {
    pinRefs.value[index + 1]?.focus();
  }
};

const submitAdmin = async () => {
  resetErrors(adminErrors);
  authStore.clearError();

  if (!adminForm.email) {
    adminErrors.email = "Email kiriting";
  }
  if (!adminForm.password) {
    adminErrors.password = "Parol kiriting";
  }
  if (adminErrors.email || adminErrors.password) {
    return;
  }

  try {
    await authStore.loginAdmin(adminForm);
    if (!authStore.isAuthenticated) {
      return;
    }
    await router.push("/admin/dashboard");
  } catch (error) {
    // error store ichida boshqariladi
  }
};

const submitPsychologist = async () => {
  resetErrors(psychologistErrors);
  authStore.clearError();

  if (!psychologistForm.email) {
    psychologistErrors.email = "Email kiriting";
  }
  if (!psychologistForm.password) {
    psychologistErrors.password = "Parol kiriting";
  }
  if (psychologistErrors.email || psychologistErrors.password) {
    return;
  }

  try {
    await authStore.loginPsychologist(psychologistForm);
    if (!authStore.isAuthenticated) {
      return;
    }
    await router.push("/psychologist/dashboard");
  } catch (error) {
    // error store ichida boshqariladi
  }
};

const submitStudentCode = async () => {
  resetErrors(studentErrors);
  authStore.clearError();

  const schoolCode = schoolCodeParts.value.join("").trim();
  if (schoolCode.length !== 4) {
    studentErrors.schoolCode = "4 belgidan iborat maktab kodini kiriting";
    return;
  }

  try {
    const school = await authStore.loginStudentWithCode(schoolCode);
    if (!school?.schoolId) {
      return;
    }
    await router.push({
      path: "/auth/register",
      query: {
        schoolId: school.schoolId,
        schoolName: school.schoolName,
      },
    });
  } catch (error) {
    // error store ichida boshqariladi
  }
};

const submitStudentId = async () => {
  resetErrors(studentErrors);
  authStore.clearError();

  if (!studentId.value) {
    studentErrors.studentId = "Student ID kiriting";
    return;
  }

  try {
    await authStore.loginStudentWithId(studentId.value.toUpperCase());
  } catch (error) {
    // error store ichida boshqariladi
  }
};
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: var(--space-5);
}

.auth-card {
  width: min(520px, 100%);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-6);
}

.title {
  margin: 0;
  text-align: center;
}

.subtitle {
  margin: var(--space-2) 0 var(--space-5);
  color: var(--color-muted);
  text-align: center;
}

.tabs,
.student-mode {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.student-mode {
  grid-template-columns: repeat(2, 1fr);
}

.tab-btn,
.mode-btn {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #fff;
  padding: 10px 12px;
  cursor: pointer;
}

.tab-btn.active,
.mode-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.form {
  display: grid;
  gap: var(--space-2);
}

label {
  margin-top: var(--space-2);
  font-weight: 600;
}

input,
select {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 12px;
  outline: none;
}

input:focus,
select:focus {
  border-color: var(--color-primary);
}

.submit-btn {
  margin-top: var(--space-3);
  border: none;
  border-radius: var(--radius-sm);
  padding: 12px;
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.field-error,
.global-error {
  margin: 2px 0 0;
  color: var(--color-danger);
  font-size: 0.9rem;
}

.global-error {
  margin-top: var(--space-3);
}

.pin-wrap {
  display: flex;
  gap: var(--space-2);
}

.pin-input {
  width: 54px;
  text-align: center;
  font-size: 1.1rem;
}
</style>
