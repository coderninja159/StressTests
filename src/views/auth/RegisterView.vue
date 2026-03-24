<template>
  <div class="register-shell">
    <div class="register-card">

      <!-- Header -->
      <div class="reg-header">
        <div class="reg-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="19" x2="19" y1="8" y2="14"/>
            <line x1="22" x2="16" y1="11" y2="11"/>
          </svg>
        </div>
        <div>
          <h1>Ro'yxatdan o'tish</h1>
          <p class="reg-school">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:4px">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
            {{ schoolName || "Noma'lum maktab" }}
          </p>
        </div>
      </div>

      <!-- Xato -->
      <div v-if="pageError || authStore.errorMessage" class="alert alert-error" style="margin-bottom: var(--s-5);">
        <svg class="alert-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ pageError || authStore.errorMessage }}</span>
      </div>

      <!-- Forma -->
      <form class="reg-form" @submit.prevent="submitRegister">

        <!-- To'liq ism -->
        <div class="field">
          <label class="field-label">To'liq ism</label>
          <div class="input-wrap">
            <span class="input-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <input
              v-model.trim="form.fullName"
              type="text"
              class="input"
              :class="{ 'is-error': errors.fullName }"
              placeholder="Ism Familiya"
              autocomplete="name"
              @input="onFullNameInput"
            />
          </div>
          <span v-if="errors.fullName" class="field-error">{{ errors.fullName }}</span>
        </div>

        <!-- Yosh -->
        <div class="field">
          <label class="field-label">Yosh</label>
          <div class="input-wrap">
            <span class="input-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                <line x1="16" x2="16" y1="2" y2="6"/>
                <line x1="8" x2="8" y1="2" y2="6"/>
                <line x1="3" x2="21" y1="10" y2="10"/>
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
            />
          </div>
          <span v-if="errors.age" class="field-error">{{ errors.age }}</span>
        </div>

        <!-- Sinf -->
        <div class="field">
          <label class="field-label">Sinf</label>
          <div class="input-wrap">
            <span class="input-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </span>
            <select
              v-model="form.className"
              class="select"
              :class="{ 'is-error': errors.className }"
              style="padding-left: var(--s-10);"
            >
              <option value="">Sinfni tanlang</option>
              <option v-for="item in classOptions" :key="item" :value="item">{{ item }}</option>
            </select>
          </div>
          <span v-if="errors.className" class="field-error">{{ errors.className }}</span>
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-xl btn-full"
          :disabled="authStore.isLoading"
          style="margin-top: var(--s-2);"
        >
          <span v-if="authStore.isLoading" class="spin"></span>
          <span v-else>Ro'yxatdan o'tish</span>
        </button>

      </form>
    </div>

    <!-- Modal -->
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
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:4px">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <path d="M12 9v4"/><path d="M12 17h.01"/>
              </svg>
              Bu ID ni eslab qoling — keyingi kirishda kerak bo'ladi
            </p>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-primary btn-lg" @click="goToDashboard">
            Dashboardga o'tish
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()

const schoolId   = computed(() => route.query.schoolId   || '')
const schoolName = computed(() => route.query.schoolName || '')

const form = reactive({ fullName: '', age: null, className: '' })
const errors = reactive({ fullName: '', age: '', className: '' })

const showModal        = ref(false)
const createdStudentId = ref('')
const pageError        = ref('')

const classOptions = Array.from({ length: 11 }, (_, i) => i + 1)
  .flatMap(grade => ['A', 'B', 'V'].map(letter => `${grade}-${letter}`))

const onFullNameInput = (e) => {
  const cleaned = String(e.target.value || '')
    .replace(/[^A-Za-zÀ-ž'\-\s]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trimStart()
  form.fullName = cleaned
}

const resetErrors = () => {
  errors.fullName = ''
  errors.age      = ''
  errors.className = ''
  pageError.value  = ''
  authStore.clearError()
}

const submitRegister = async () => {
  resetErrors()

  if (!schoolId.value) {
    pageError.value = 'Avval maktab kodini tasdiqlang.'
    await router.push('/auth/login')
    return
  }

  if (!form.fullName)                          errors.fullName  = "To'liq ism kiriting"
  else if (!/^[A-Za-zÀ-ž'\-\s]+$/.test(form.fullName)) errors.fullName = "Ismda raqam yoki maxsus belgi bo'lmasin"
  if (!form.age || form.age < 7 || form.age > 18) errors.age   = 'Yosh 7 dan 18 gacha bo\'lishi kerak'
  if (!form.className)                         errors.className = 'Sinfni tanlang'

  if (errors.fullName || errors.age || errors.className) return

  try {
    const studentId = await authStore.registerStudent({
      fullName:  form.fullName,
      age:       form.age,
      className: form.className,
      schoolId:  schoolId.value,
    })
    if (!studentId) return
    createdStudentId.value = studentId
    showModal.value = true
  } catch {}
}

const goToDashboard = async () => {
  showModal.value = false
  await router.push('/student/dashboard')
}
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

/* Modal ID blok */
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
  font-family: 'Space Grotesk', sans-serif;
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