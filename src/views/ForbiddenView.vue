<template>
  <div class="forbidden-page">
    <div class="card">
      <h1>403</h1>
      <p>Ruxsat yo'q. Bu sahifaga kirish huquqingiz mavjud emas.</p>
      <RouterLink to="/auth/login" class="back-link">Kirish sahifasiga qaytish</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from "vue-router";
</script>

<style scoped>
.forbidden-page {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 2rem;
}
.card {
  width: min(560px, 100%);
  background: var(--surface, #fff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
}
h1 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
}
.back-link {
  color: var(--brand, #4f46e5);
  font-weight: 600;
}
</style>
