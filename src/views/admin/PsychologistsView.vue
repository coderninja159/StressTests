<template>
  <div class="layout">
    <AdminSidebar />
    <main class="main">
      <MobileHeader />
      <div class="toolbar">
        <h1>Psixologlar</h1>
        <BaseButton variant="primary" @click="openModal">Yangi psixolog qo'shish</BaseButton>
      </div>

      <LoadingSpinner v-if="loading" text="Yuklanmoqda..." />
      <p v-else-if="pageError" class="alert">{{ pageError }}</p>

      <template v-else>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Ism</th>
                <th>Email</th>
                <th>Maktab nomi</th>
                <th>Ro'yxatdan o'tgan sana</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in psychologists" :key="p.id">
                <td>{{ p.full_name }}</td>
                <td>{{ p.email || "—" }}</td>
                <td>{{ p.schools?.name || "—" }}</td>
                <td>{{ formatDate(p.created_at) }}</td>
                <td>
                  <button type="button" class="btn-danger" :disabled="deleteLoading === p.id" @click="remove(p)">
                    O'chirish
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-if="!psychologists.length" class="muted">Psixologlar yo'q.</p>
        </div>
      </template>

      <div v-if="modalOpen" class="modal-backdrop" @click.self="closeModal">
        <div class="modal">
          <h2>Yangi psixolog</h2>

          <BaseInput v-model="form.fullName" label="To'liq ism" placeholder="Ism Familiya" :error="errors.fullName" />

          <BaseInput
            v-model="form.email"
            label="Email"
            type="email"
            placeholder="email@maktab.uz"
            :error="errors.email"
          />

          <BaseInput
            v-model="form.password"
            label="Parol"
            type="password"
            placeholder="Kamida 8 belgi"
            :error="errors.password"
          />

          <label class="sel-label">Maktab</label>
          <select v-model="form.schoolId" class="select">
            <option disabled value="">Maktabni tanlang</option>
            <option v-for="s in activeSchools" :key="s.id" :value="s.id">{{ s.name }} ({{ s.code }})</option>
          </select>
          <p v-if="errors.schoolId" class="field-err">{{ errors.schoolId }}</p>

          <p v-if="formError" class="alert">{{ formError }}</p>

          <div class="modal-actions">
            <BaseButton variant="secondary" @click="closeModal">Bekor qilish</BaseButton>
            <BaseButton variant="primary" :loading="saveLoading" @click="savePsychologist">Saqlash</BaseButton>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";



import AdminSidebar from "../../components/layout/AdminSidebar.vue";
import MobileHeader from "../../components/layout/MobileHeader.vue";
import BaseButton from "../../components/ui/BaseButton.vue";
import BaseInput from "../../components/ui/BaseInput.vue";
import LoadingSpinner from "../../components/ui/LoadingSpinner.vue";
import { api, getApiErrorMessage } from "../../lib/api";
import { useAuthStore } from "../../stores/auth";

const authStore = useAuthStore();

const loading = ref(true);
const pageError = ref("");
const formError = ref("");
const schools = ref([]);
const psychologists = ref([]);

const modalOpen = ref(false);
const saveLoading = ref(false);
const deleteLoading = ref(null);

const form = reactive({
  fullName: "",
  email: "",
  password: "",
  schoolId: "",
});

const errors = reactive({
  fullName: "",
  email: "",
  password: "",
  schoolId: "",
});

const activeSchools = computed(() => schools.value.filter((s) => s.is_active));

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("uz-UZ");
  } catch {
    return iso || "—";
  }
}

function resetForm() {
  form.fullName = "";
  form.email = "";
  form.password = "";
  form.schoolId = "";
  Object.keys(errors).forEach((k) => {
    errors[k] = "";
  });
  formError.value = "";
}

function openModal() {
  resetForm();
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
}

function validate() {
  Object.keys(errors).forEach((k) => {
    errors[k] = "";
  });
  let ok = true;
  if (!form.fullName.trim()) {
    errors.fullName = "Ism kiriting";
    ok = false;
  }
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "To'g'ri email kiriting";
    ok = false;
  }
  if (!form.password || form.password.length < 8) {
    errors.password = "Parol kamida 8 belgi bo'lsin";
    ok = false;
  }
  if (!form.schoolId) {
    errors.schoolId = "Maktabni tanlang";
    ok = false;
  }
  return ok;
}

async function load() {
  loading.value = true;
  pageError.value = "";
  schools.value = [];
  psychologists.value = [];

  try {
    const [schoolsResp, psychResp] = await Promise.all([
      api.get("/api/admin/schools"),
      api.get("/api/admin/psychologists"),
    ]);
    schools.value = schoolsResp.data?.schools || [];
    psychologists.value = psychResp.data?.psychologists || [];
  } catch (error) {
    pageError.value = getApiErrorMessage(error, "Ma'lumotlarni yuklashda xatolik.");
  } finally {
    loading.value = false;
  }
}

async function savePsychologist() {
  formError.value = "";
  if (!validate()) {
    return;
  }

  saveLoading.value = true;
  try {
    await api.post("/api/admin/psychologists", {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password,
      schoolId: form.schoolId,
    });
    await authStore.fetchCurrentUser();
    closeModal();
    await load();
  } catch (error) {
    formError.value = getApiErrorMessage(error, "Saqlashda xatolik yuz berdi.");
  } finally {
    saveLoading.value = false;
  }
}

async function remove(p) {
  if (!confirm(`${p.full_name} ni o'chirishni tasdiqlaysizmi?`)) {
    return;
  }
  deleteLoading.value = p.id;
  try {
    await api.delete(`/api/admin/psychologists/${encodeURIComponent(p.id)}`);
    await load();
  } catch {
    alert("O'chirishda xatolik.");
  } finally {
    deleteLoading.value = null;
  }
}

onMounted(() => {
  load();
});
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
}

.main {
  flex: 1;
  padding: var(--s-6);
  width: 100%;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

h1 {
  margin: 0;
}

.alert {
  color: var(--color-danger);
  font-weight: 600;
}

.table-wrap {
  background: var(--surface);
  border-radius: var(--r-xl);
  border: 1px solid var(--border);
  overflow: auto;
  box-shadow: var(--sh-sm);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
}

.table th,
.table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}

.table th {
  background: var(--surface-2);
}

.btn-danger {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  border: none;
  background: var(--color-danger);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.btn-danger:disabled {
  opacity: 0.6;
}

.muted {
  padding: var(--space-3);
  margin: 0;
  color: var(--color-muted);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  padding: var(--space-4);
  z-index: 50;
}

.modal {
  width: min(440px, 100%);
  background: var(--surface);
  border-radius: var(--r-2xl);
  padding: var(--s-6);
  box-shadow: var(--sh-xl);
}

.modal h2 {
  margin: 0 0 var(--space-4);
}

.sel-label {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
  margin: var(--space-3) 0 6px;
}

.select {
  width: 100%;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  font: inherit;
}

.field-err {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: var(--color-danger);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--s-2);
  margin-top: var(--s-4);
}

@media (max-width: 768px) {
  .main { padding: var(--s-4); }
}

@media (max-width: 520px) {
  .table { min-width: 760px; }
}
</style>
