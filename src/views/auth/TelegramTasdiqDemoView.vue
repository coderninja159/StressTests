<template>
  <div class="tg-page">
    <div class="tg-card card">
      <h1 class="page-title">Telegram tasdiq (demo)</h1>
      <p class="label-std tg-lead">
        Bosqichma-bosqich: sessiya yarating → botda Start → saytda holatni tekshiring.
      </p>

      <ol class="tg-steps">
        <li :class="{ done: step >= 1 }">Sessiya yaratish</li>
        <li :class="{ done: step >= 2 }">Telegramda havola bilan Start</li>
        <li :class="{ done: step >= 3 }">Tasdiq tekshiruvi</li>
      </ol>

      <div v-if="errorMsg" class="tg-alert" role="alert">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        <span>{{ errorMsg }}</span>
      </div>

      <div v-if="!linkToken" class="tg-actions">
        <button type="button" class="tg-btn primary" :disabled="loading" @click="createSession">
          <span v-if="loading">Yaratilmoqda...</span>
          <span v-else>1. Sessiya yaratish</span>
        </button>
      </div>

      <template v-else>
        <p class="label-std">2. Quyidagi havolani bosing (Telegram ochiladi):</p>
        <a :href="deepLink" class="tg-link" target="_blank" rel="noopener noreferrer" @click="step = Math.max(step, 2)">
          {{ deepLink }}
        </a>
        <p class="label-std tg-hint">Botda Start avtomatik yuboriladi. Keyin «Holatni tekshirish» ni bosing.</p>

        <div class="tg-actions">
          <button type="button" class="tg-btn" :disabled="polling" @click="checkStatus">
            {{ polling ? "Tekshirilmoqda..." : "Holatni tekshirish" }}
          </button>
          <button type="button" class="tg-btn ghost" @click="resetFlow">Qayta boshlash</button>
        </div>

        <p class="tg-status">
          Holat: <strong>{{ statusLabel }}</strong>
        </p>
      </template>

      <p class="tg-foot label-std">
        <RouterLink to="/auth/register">Ro‘yxatdan o‘tish</RouterLink>
        ·
        <RouterLink to="/auth/login">Kirish</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";

const loading = ref(false);
const polling = ref(false);
const errorMsg = ref("");
const linkToken = ref("");
const deepLink = ref("");
const status = ref("");
const step = ref(0);

const statusLabel = computed(() => {
  if (!linkToken.value) return "—";
  const s = status.value;
  if (s === "confirmed") return "Tasdiqlandi ✅";
  if (s === "pending") return "Kutilmoqda (botda Start bosing)";
  if (s === "expired") return "Muddati tugagan";
  if (s === "not_found") return "Topilmadi";
  return s || "—";
});

async function createSession() {
  errorMsg.value = "";
  loading.value = true;
  step.value = 1;
  try {
    const r = await fetch("/api/telegram/session", { method: "POST", headers: { "Content-Type": "application/json" } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      throw new Error(j.error || `HTTP ${r.status}`);
    }
    linkToken.value = j.link_token;
    deepLink.value = j.deep_link;
  } catch (e) {
    errorMsg.value =
      String(e.message || e) +
      " — telegram-bot ishlamoqdamimi? (telegram-bot da npm run dev) va Supabase service_role qo‘yilganmi?";
    step.value = 0;
  } finally {
    loading.value = false;
  }
}

async function checkStatus() {
  if (!linkToken.value) return;
  errorMsg.value = "";
  polling.value = true;
  try {
    const r = await fetch(`/api/telegram/session/${encodeURIComponent(linkToken.value)}`);
    const j = await r.json().catch(() => ({}));
    status.value = j.status || "error";
    if (j.status === "confirmed") {
      step.value = 3;
    }
  } catch (e) {
    errorMsg.value = String(e.message || e);
  } finally {
    polling.value = false;
  }
}

function resetFlow() {
  linkToken.value = "";
  deepLink.value = "";
  status.value = "";
  step.value = 0;
  errorMsg.value = "";
}
</script>

<style scoped>
.tg-page {
  min-height: 100dvh;
  padding: 1.75rem;
  max-width: 560px;
  margin: 0 auto;
  background: var(--bg-page, #f1f5f9);
}

.tg-card {
  background: var(--bg-card, #fff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-lg, 16px);
  padding: 1.5rem;
  box-shadow: var(--shadow-card, 0 1px 3px rgba(0, 0, 0, 0.06));
}

.tg-lead {
  margin: 0.5rem 0 1.25rem;
  line-height: 1.5;
}

.tg-steps {
  margin: 0 0 1.25rem;
  padding-left: 1.25rem;
  color: var(--text-secondary, #475569);
  line-height: 1.7;
}

.tg-steps li.done {
  color: var(--text-primary, #0f172a);
  font-weight: 600;
}

.tg-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm, 8px);
  background: color-mix(in srgb, var(--color-rose, #f43f5e) 12%, transparent);
  color: var(--color-rose, #be123c);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.tg-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 1rem 0;
}

.tg-btn {
  padding: 0.625rem 1.1rem;
  border-radius: var(--radius-sm, 8px);
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-card, #fff);
  color: var(--text-primary, #0f172a);
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.tg-btn:hover:not(:disabled) {
  border-color: var(--color-primary, #6366f1);
}

.tg-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tg-btn.primary {
  background: var(--color-primary, #6366f1);
  border-color: var(--color-primary, #6366f1);
  color: #fff;
}

.tg-btn.ghost {
  background: transparent;
}

.tg-link {
  display: block;
  word-break: break-all;
  color: var(--color-primary, #6366f1);
  font-weight: 600;
  margin: 0.5rem 0;
}

.tg-hint {
  margin-top: 0.75rem;
}

.tg-status {
  margin: 1rem 0 0;
  font-size: 1rem;
  color: var(--text-primary, #0f172a);
}

.tg-foot {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color, #e2e8f0);
}

.tg-foot a {
  color: var(--color-primary, #6366f1);
  font-weight: 600;
  text-decoration: none;
}

.tg-foot a:hover {
  text-decoration: underline;
}
</style>
