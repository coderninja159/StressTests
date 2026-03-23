<template>
  <div class="register-page">
    <div class="register-card">
      <h1>O'quvchi ro'yxatdan o'tishi</h1>
      <p class="school">Maktab: {{ schoolName || "Noma'lum" }}</p>

      <form class="form" @submit.prevent="submitRegister">
        <label for="full-name">To'liq ism</label>
        <input id="full-name" v-model.trim="form.fullName" type="text" placeholder="Ism Familiya" />
        <p v-if="errors.fullName" class="field-error">{{ errors.fullName }}</p>

        <label for="age">Yosh</label>
        <input id="age" v-model.number="form.age" type="number" min="7" max="18" placeholder="7 - 18" />
        <p v-if="errors.age" class="field-error">{{ errors.age }}</p>

        <label for="class-name">Sinf</label>
        <select id="class-name" v-model="form.className">
          <option value="">Sinfni tanlang</option>
          <option v-for="item in classOptions" :key="item" :value="item">{{ item }}</option>
        </select>
        <p v-if="errors.className" class="field-error">{{ errors.className }}</p>

        <button class="submit-btn" :disabled="authStore.isLoading" type="submit">
          <span v-if="authStore.isLoading">Yuklanmoqda...</span>
          <span v-else>Ro'yxatdan o'tish</span>
        </button>
      </form>

      <p v-if="pageError || authStore.errorMessage" class="field-error">{{ pageError || authStore.errorMessage }}</p>
    </div>

    <div v-if="showModal" class="modal-backdrop">
      <div class="modal">
        <h3>Ro'yxatdan o'tish muvaffaqiyatli</h3>
        <p>Sizning ID: {{ createdStudentId }} — eslab qoling!</p>
        <button class="submit-btn" @click="goToDashboard">Dashboardga o'tish</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useAuthStore } from "../../stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const schoolId = computed(() => route.query.schoolId || "");
const schoolName = computed(() => route.query.schoolName || "");

const form = reactive({
  fullName: "",
  age: null,
  className: "",
});

const errors = reactive({
  fullName: "",
  age: "",
  className: "",
});

const showModal = ref(false);
const createdStudentId = ref("");
const pageError = ref("");

const classOptions = Array.from({ length: 11 }, (_, i) => i + 1)
  .flatMap((grade) => ["A", "B", "V"].map((letter) => `${grade}-${letter}`));

const resetErrors = () => {
  errors.fullName = "";
  errors.age = "";
  errors.className = "";
  pageError.value = "";
  authStore.clearError();
};

const submitRegister = async () => {
  resetErrors();

  if (!schoolId.value) {
    pageError.value = "Avval maktab kodini tasdiqlang.";
    await router.push("/auth/login");
    return;
  }

  if (!form.fullName) {
    errors.fullName = "To'liq ism kiriting";
  }
  if (!form.age || form.age < 7 || form.age > 18) {
    errors.age = "Yosh 7 dan 18 gacha bo'lishi kerak";
  }
  if (!form.className) {
    errors.className = "Sinfni tanlang";
  }
  if (errors.fullName || errors.age || errors.className) {
    return;
  }

  try {
    const studentId = await authStore.registerStudent({
      fullName: form.fullName,
      age: form.age,
      className: form.className,
      schoolId: schoolId.value,
    });

    if (!studentId) {
      return;
    }

    createdStudentId.value = studentId;
    showModal.value = true;
  } catch (error) {
    // error store ichida boshqariladi
  }
};

const goToDashboard = async () => {
  showModal.value = false;
  await router.push("/student/dashboard");
};
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: var(--space-5);
}

.register-card {
  width: min(520px, 100%);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-6);
}

h1 {
  margin: 0;
  font-size: 1.4rem;
}

.school {
  margin: var(--space-2) 0 var(--space-4);
  color: var(--color-muted);
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
}

input:focus,
select:focus {
  outline: none;
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

.field-error {
  margin: 0;
  color: var(--color-danger);
  font-size: 0.9rem;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  padding: var(--space-4);
}

.modal {
  width: min(420px, 100%);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  box-shadow: var(--shadow-md);
}

.modal h3 {
  margin: 0 0 var(--space-2);
}

.modal p {
  margin: 0 0 var(--space-4);
}
</style>
