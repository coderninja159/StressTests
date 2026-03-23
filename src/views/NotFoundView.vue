<template>
  <div class="not-found">
    <BaseCard>
      <h1>404 — Sahifa topilmadi</h1>
      <p class="muted">Siz qidirgan sahifa mavjud emas yoki ko'chirilgan.</p>
      <BaseButton variant="primary" @click="goHome">Bosh sahifaga qaytish</BaseButton>
    </BaseCard>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

import BaseButton from "../components/ui/BaseButton.vue";
import BaseCard from "../components/ui/BaseCard.vue";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const goHome = () => {
  const role = authStore.currentUser?.role;
  if (role === "admin") {
    router.push("/admin/dashboard");
  } else if (role === "psychologist") {
    router.push("/psychologist/dashboard");
  } else if (role === "student") {
    router.push("/student/dashboard");
  } else {
    router.push("/auth/login");
  }
};
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: var(--space-5);
  background: var(--color-bg);
}

h1 {
  margin: 0 0 var(--space-2);
}

.muted {
  color: var(--color-muted);
  margin: 0 0 var(--space-4);
}
</style>
