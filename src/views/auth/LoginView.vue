<template>
  <div class="auth-shell">
    <!-- Floating theme toggle -->
    <button
      type="button"
      class="login-theme-toggle"
      :title="isDark ? 'Yorug\' rejim' : 'Qorong\'u rejim'"
      :aria-label="isDark ? 'Yorug\' rejim' : 'Qorong\'u rejim'"
      @click="themeStore.toggle"
    >
      <transition name="icon-spin" mode="out-in">
        <svg v-if="isDark" key="sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
        <svg v-else key="moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </transition>
    </button>

    <!-- ═══════════ CHAP PANEL ═══════════ -->
    <div class="auth-panel login-anim-panel">
      <div class="auth-panel__dot-grid" aria-hidden="true"></div>
      <div class="auth-panel-brand">
        <div class="brand-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
          </svg>
        </div>
        <div>
          <div class="brand-txt">StressTest</div>
          <div class="brand-sub">Psixologik baholash platformasi</div>
        </div>
      </div>

      <div class="auth-panel-mid">
        <h2>O'quvchilar salomatligini<br><strong>aniqlang va kuzating</strong></h2>
        <div class="auth-features">
          <div
            class="auth-feature-item login-anim-feature"
            v-for="(f, fi) in features"
            :key="f.text"
            :style="{ animationDelay: (200 + fi * 100) + 'ms' }"
          >
            <div class="auth-feature-dot">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(165,180,252,0.9)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" v-html="f.icon"></svg>
            </div>
            <div class="auth-feature-txt">{{ f.text }}</div>
          </div>
        </div>
      </div>

      <div class="auth-panel-stats">
        <div v-for="(s, si) in stats" :key="s.lbl" class="login-anim-stat" :style="{ animationDelay: (600 + si * 120) + 'ms' }">
          <div class="auth-stat-num">{{ s.num }}</div>
          <div class="auth-stat-lbl">{{ s.lbl }}</div>
        </div>
      </div>
    </div>

    <!-- ═══════════ O'NG PANEL ═══════════ -->
    <div class="auth-form-side">
      <div class="auth-box login-anim-card">

        <div class="auth-box-head">
          <h1>Tizimga kirish</h1>
          <p>Rolingizni tanlang va ma'lumot kiriting</p>
        </div>

        <!-- TABLAR -->
        <div class="auth-tabs">
          <div class="auth-tabs__track" :style="tabIndicatorStyle"></div>
          <button
            v-for="(tab, ti) in tabs"
            :key="tab.id"
            :ref="el => tabRefs[ti] = el"
            class="auth-tab"
            :class="{ active: activeTab === tab.id }"
            @click="switchTab(tab.id)"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" v-html="tab.icon"></svg>
            {{ tab.lbl }}
          </button>
        </div>

        <!-- XATO -->
        <div v-if="authStore.errorMessage" class="alert alert-error mb-4">
          <svg class="alert-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{{ authStore.errorMessage }}</span>
        </div>

        <!-- ── ADMIN FORMA ── -->
        <form v-if="activeTab === 'admin'" class="login-form" @submit.prevent="handleAdmin">
          <div class="field">
            <label class="field-label">Email manzil</label>
            <div class="input-wrap">
              <span class="input-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </span>
              <input v-model="adminForm.email" type="email" class="input" placeholder="admin@maktab.uz" required autocomplete="email"/>
            </div>
          </div>
          <div class="field">
            <label class="field-label">Parol</label>
            <div class="input-wrap">
              <span class="input-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input v-model="adminForm.password" :type="showPass ? 'text' : 'password'" class="input" placeholder="••••••••" required autocomplete="current-password"/>
              <button type="button" class="input-trail" @click="showPass = !showPass" aria-label="Parolni ko'rsatish">
                <transition name="icon-spin" mode="out-in">
                  <svg v-if="!showPass" key="eye" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg v-else key="eye-off" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                </transition>
              </button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-xl btn-full login-btn-submit" :disabled="authStore.isLoading">
            <span v-if="authStore.isLoading" class="spin"></span>
            <span v-else>Kirish</span>
          </button>
        </form>

        <!-- ── PSIXOLOG FORMA ── -->
        <form v-if="activeTab === 'psychologist'" class="login-form" @submit.prevent="handlePsychologist">
          <div class="field">
            <label class="field-label">Email manzil</label>
            <div class="input-wrap">
              <span class="input-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </span>
              <input v-model="psychForm.email" type="email" class="input" placeholder="psixolog@maktab.uz" required autocomplete="email"/>
            </div>
          </div>
          <div class="field">
            <label class="field-label">Parol</label>
            <div class="input-wrap">
              <span class="input-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input v-model="psychForm.password" :type="showPass ? 'text' : 'password'" class="input" placeholder="••••••••" required autocomplete="current-password"/>
              <button type="button" class="input-trail" @click="showPass = !showPass" aria-label="Parolni ko'rsatish">
                <transition name="icon-spin" mode="out-in">
                  <svg v-if="!showPass" key="eye2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg v-else key="eye-off2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                </transition>
              </button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-xl btn-full login-btn-submit" :disabled="authStore.isLoading">
            <span v-if="authStore.isLoading" class="spin"></span>
            <span v-else>Kirish</span>
          </button>
        </form>

        <!-- ── O'QUVCHI ── -->
        <div v-if="activeTab === 'student'">
          <div class="student-ways">
            <button class="way-card" :class="{ active: studentMode === 'new' }" @click="setStudentMode('new')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>
              </svg>
              <span class="way-lbl">Ro'yxatdan o'tish</span>
              <span class="way-sub">Birinchi marta</span>
            </button>
            <button class="way-card" :class="{ active: studentMode === 'return' }" @click="setStudentMode('return')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span class="way-lbl">Qayta kirish</span>
              <span class="way-sub">ID bor bo'lsa</span>
            </button>
          </div>

          <form v-if="studentMode === 'new'" class="login-form" @submit.prevent="handleSchoolCode">
            <div class="field">
              <label class="field-label">Maktab kodi</label>
              <p class="field-hint">4 ta belgi — psixologingizdan oling</p>
              <div class="code-row">
                <input
                  v-for="(_, i) in 4" :key="i"
                  :ref="el => codeRefs[i] = el"
                  v-model="codeDigits[i]"
                  type="text" maxlength="1"
                  class="code-cell" :class="{ filled: codeDigits[i] }"
                  @input="onCodeInput(i, $event)"
                  @keydown.backspace="onBackspace(i)"
                  @paste.prevent="onPaste($event)"
                />
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-xl btn-full login-btn-submit" :disabled="authStore.isLoading || schoolCode.length < 4">
              <span v-if="authStore.isLoading" class="spin"></span>
              <span v-else>Davom etish</span>
            </button>
          </form>

          <form v-if="studentMode === 'return'" class="login-form" @submit.prevent="handleStudentId">
            <div class="field">
              <label class="field-label">Student ID</label>
              <p class="field-hint">Ro'yxatdan o'tganda berilgan identifikator</p>
              <div class="input-wrap">
                <span class="input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h.01M17 7h.01M7 12h10M7 17h10"/>
                  </svg>
                </span>
                <input v-model="studentId" type="text" class="input" placeholder="ST-2025-0001" required style="text-transform:uppercase;letter-spacing:0.08em;font-weight:600;"/>
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-xl btn-full login-btn-submit" :disabled="authStore.isLoading || !studentId">
              <span v-if="authStore.isLoading" class="spin"></span>
              <span v-else>Kirish</span>
            </button>
          </form>
        </div>

        <!-- Disclaimer -->
        <div class="auth-disclaimer login-anim-warn">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
          </svg>
          <span>Bu platforma tibbiy tashxis bermaydi. Natijalar psixolog nazorati ostida tahlil qilinadi.</span>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../../stores/auth'
import { useThemeStore } from '../../stores/theme'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const { isDark } = storeToRefs(themeStore)

const features = [
  { text: 'Psixologik testlar va portret tahlili',  icon: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>' },
  { text: 'AI yordamida natijalar izohi',            icon: '<path d="M12 2a8 8 0 0 1 8 8v12l-4-4-2.5 2.5L11 18l-2.5 2.5L6 18l-4 4V10a8 8 0 0 1 8-8z"/>' },
  { text: "Maktab psixologlari uchun dashboard",     icon: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/>' },
  { text: "Xavfli holatlarni erta aniqlash",         icon: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>' },
]

const stats = [
  { num: '75+', lbl: 'Test savollari' },
  { num: '5',   lbl: 'Kategoriya'     },
  { num: 'AI',  lbl: 'Tahlil tizimi'  },
]

const tabs = [
  { id: 'admin',        lbl: 'Admin',     icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' },
  { id: 'psychologist', lbl: 'Psixolog',  icon: '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>' },
  { id: 'student',      lbl: "O'quvchi",  icon: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>' },
]

const activeTab   = ref('admin')
const studentMode = ref('new')
const showPass    = ref(false)
const adminForm   = ref({ email: '', password: '' })
const psychForm   = ref({ email: '', password: '' })
const studentId   = ref('')
const codeDigits  = ref(['', '', '', ''])
const codeRefs    = ref([])
const tabRefs     = ref([])

const schoolCode = computed(() => codeDigits.value.join(''))

const tabIndicatorStyle = computed(() => {
  const idx = tabs.findIndex(t => t.id === activeTab.value)
  const count = tabs.length
  const pct = 100 / count
  return {
    width: `calc(${pct}% - 2px)`,
    transform: `translateX(calc(${idx * 100}% + ${idx * 2}px))`,
  }
})

const queryTab = String(route.query.tab || '').toLowerCase()
const queryStudentMode = String(route.query.studentMode || '').toLowerCase()
const queryStudentId = String(route.query.studentId || '').trim().toUpperCase()
if (queryTab === 'student') activeTab.value = 'student'
if (queryStudentMode === 'return') studentMode.value = 'return'
if (queryStudentId) {
  activeTab.value = 'student'
  studentMode.value = 'return'
  studentId.value = queryStudentId
}

const switchTab = (tab) => { activeTab.value = tab; authStore.clearError(); showPass.value = false }
const setStudentMode = (mode) => { studentMode.value = mode; authStore.clearError() }

const onCodeInput = (i, e) => {
  const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  codeDigits.value[i] = val
  if (val && i < 3) codeRefs.value[i + 1]?.focus()
}
const onBackspace = (i) => {
  if (!codeDigits.value[i] && i > 0) { codeDigits.value[i - 1] = ''; codeRefs.value[i - 1]?.focus() }
}
const onPaste = (e) => {
  const txt = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
  txt.split('').forEach((c, i) => { if (i < 4) codeDigits.value[i] = c })
  codeRefs.value[Math.min(txt.length, 3)]?.focus()
}

const handleAdmin = async () => {
  try { await authStore.loginAdmin(adminForm.value); if (authStore.isAuthenticated) router.push('/admin/dashboard') } catch {}
}
const handlePsychologist = async () => {
  try { await authStore.loginPsychologist(psychForm.value); if (authStore.isAuthenticated) router.push('/psychologist/dashboard') } catch {}
}
const handleSchoolCode = async () => {
  try {
    const school = await authStore.loginStudentWithCode(schoolCode.value)
    if (school?.schoolId) router.push({ path: '/auth/register', query: { schoolId: school.schoolId, schoolName: school.schoolName } })
  } catch {}
}
const handleStudentId = async () => {
  try { await authStore.loginStudentWithId(studentId.value.toUpperCase()) } catch {}
}
</script>

<style scoped>
/* ──── LAYOUT: full viewport, no scroll ──── */
.auth-shell {
  height: 100dvh;
  overflow: hidden;
  position: relative;
}

/* ──── FLOATING THEME TOGGLE ──── */
.login-theme-toggle {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 50;
  width: 40px;
  height: 40px;
  border-radius: var(--r-md);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s var(--ease);
}
.login-theme-toggle:hover {
  background: var(--surface-3);
  color: var(--brand);
  border-color: var(--brand);
  transform: scale(1.05);
}
.login-theme-toggle:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

/* Theme toggle icon rotation */
.icon-spin-enter-active,
.icon-spin-leave-active {
  transition: all 0.3s var(--ease);
}
.icon-spin-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.6);
}
.icon-spin-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.6);
}

/* ──── LEFT PANEL: animated gradient bg + dot grid ──── */
.auth-panel {
  background-size: 200% 200%;
  animation: loginGradientShift 8s ease infinite;
}

.auth-panel__dot-grid {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
  background-size: 28px 28px;
  pointer-events: none;
  z-index: 0;
}

/* ──── PAGE LOAD ANIMATIONS ──── */
.login-anim-panel {
  animation: loginSlideFromLeft 0.6s var(--ease-out) both;
}
.login-anim-card {
  animation: loginSlideFromRight 0.6s var(--ease-out) 0.15s both;
}
.login-anim-feature {
  animation: loginFeatureFadeIn 0.5s var(--ease-out) both;
}
.login-anim-stat {
  animation: loginFeatureFadeIn 0.45s var(--ease-out) both;
}
.login-anim-warn {
  animation: loginWarnSlideUp 0.5s var(--ease-out) 0.7s both;
}

/* ──── TAB SLIDING INDICATOR ──── */
.auth-tabs {
  position: relative;
}
.auth-tabs__track {
  position: absolute;
  top: 4px;
  left: 4px;
  height: calc(100% - 8px);
  border-radius: var(--r-md);
  background: var(--surface);
  box-shadow: var(--sh-sm);
  transition: transform 0.3s var(--ease-spr), width 0.3s var(--ease-spr);
  z-index: 0;
  pointer-events: none;
}
:global([data-theme="dark"]) .auth-tabs__track {
  background: rgba(30, 36, 58, 0.95);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
}
.auth-tab {
  position: relative;
  z-index: 1;
  transition: all 0.2s var(--ease);
}
.auth-tab:hover {
  transform: scale(1.02);
}
.auth-tab.active {
  background: transparent;
  box-shadow: none;
}

/* ──── SUBMIT BUTTON: lift + shimmer ──── */
.login-btn-submit {
  position: relative;
  overflow: hidden;
  transition: all 0.25s var(--ease);
}
.login-btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 40px rgba(79, 70, 229, 0.38), 0 4px 12px rgba(79, 70, 229, 0.2);
}
.login-btn-submit:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}
.login-btn-submit::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  transition: none;
  pointer-events: none;
}
.login-btn-submit:hover:not(:disabled)::before {
  animation: loginShimmer 0.8s ease forwards;
}

/* ──── FEATURE ICON HOVER ──── */
.auth-feature-dot {
  transition: all 0.25s var(--ease);
}
.auth-feature-item:hover .auth-feature-dot {
  transform: scale(1.15);
  box-shadow: 0 0 16px rgba(99, 102, 241, 0.3);
  background: rgba(99, 102, 241, 0.32);
}

/* ──── WARNING BANNER pulse accent ──── */
.auth-disclaimer {
  position: relative;
  overflow: hidden;
}
.auth-disclaimer::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: var(--r-full);
  background: var(--warn);
  animation: loginAccentPulse 2s ease-in-out infinite;
}

/* ──── KEYFRAMES ──── */
@media (prefers-reduced-motion: no-preference) {
  @keyframes loginSlideFromLeft {
    from { opacity: 0; transform: translateX(-30px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes loginSlideFromRight {
    from { opacity: 0; transform: translateX(30px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes loginFeatureFadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes loginWarnSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes loginGradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes loginShimmer {
    from { left: -60%; }
    to   { left: 120%; }
  }
  @keyframes loginAccentPulse {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.4; }
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-anim-panel,
  .login-anim-card,
  .login-anim-feature,
  .login-anim-stat,
  .login-anim-warn {
    animation: none !important;
  }
  .auth-panel {
    animation: none !important;
  }
  .auth-disclaimer::before {
    animation: none !important;
  }
}

.login-form { display: flex; flex-direction: column; gap: var(--s-5); }
.mb-4 { margin-bottom: var(--s-4); }
</style>