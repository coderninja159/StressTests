<template>
  <div class="layout">
    <AdminSidebar />
    <main class="main">
      <MobileHeader />
      <div class="toolbar">
        <h1>Maktablar</h1>
        <BaseButton variant="primary" @click="openCreate">Yangi maktab qo'shish</BaseButton>
      </div>

      <LoadingSpinner v-if="loading" text="Yuklanmoqda..." />
      <p v-else-if="pageError" class="alert">{{ pageError }}</p>

      <template v-else>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Maktab nomi</th>
                <th>Kod</th>
                <th>O'quvchilar soni</th>
                <th>Psixolog ismi</th>
                <th>Holat</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in enrichedSchools" :key="row.id">
                <td>{{ row.name }}</td>
                <td>
                  <code>{{ row.code }}</code>
                  <button type="button" class="linkish" @click="copyCode(row.code)">Nusxa</button>
                </td>
                <td>{{ row.studentCount }}</td>
                <td>{{ row.psychologistName || "—" }}</td>
                <td>
                  <label class="toggle">
                    <input
                      type="checkbox"
                      :checked="row.is_active"
                      :disabled="toggleLoadingId === row.id"
                      @change="toggleActive(row, $event.target.checked)"
                    />
                    <span>{{ row.is_active ? "Aktiv" : "Nofaol" }}</span>
                  </label>
                </td>
                <td class="actions">
                  <button type="button" class="btn-ghost" @click="openEdit(row)">Tahrirlash</button>
                  <button type="button" class="btn-danger" @click="tryDelete(row)">O'chirish</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-if="!enrichedSchools.length" class="muted">Maktablar yo'q.</p>
        </div>
      </template>

      <div v-if="modalOpen" class="modal-backdrop" @click.self="closeModal">
        <div class="modal">
          <h2>{{ editingId ? "Maktabni tahrirlash" : "Yangi maktab" }}</h2>

          <BaseInput v-model="form.name" label="Maktab nomi" placeholder="Maktab nomi" :error="errors.name" />

          <div class="code-row">
            <BaseInput
              v-model="form.code"
              label="Maktab kodi (4 belgi)"
              placeholder="AB12"
              :error="errors.code"
            />
            <BaseButton variant="secondary" class="auto-btn" @click="generateCode">Avtomatik</BaseButton>
          </div>

          <p v-if="formError" class="form-err">{{ formError }}</p>

          <div class="modal-actions">
            <BaseButton variant="secondary" @click="closeModal">Bekor qilish</BaseButton>
            <BaseButton variant="primary" :loading="saveLoading" @click="saveSchool">Saqlash</BaseButton>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import AdminSidebar from "../../components/layout/AdminSidebar.vue";
import MobileHeader from "../../components/layout/MobileHeader.vue";
import BaseButton from "../../components/ui/BaseButton.vue";
import BaseInput from "../../components/ui/BaseInput.vue";
import LoadingSpinner from "../../components/ui/LoadingSpinner.vue";
import { api, getApiErrorMessage } from "../../lib/api";

const loading = ref(true);
const pageError = ref("");
const schools = ref([]);
const users = ref([]);

const modalOpen = ref(false);
const editingId = ref(null);
const saveLoading = ref(false);
const formError = ref("");
const toggleLoadingId = ref(null);

const form = reactive({
  name: "",
  code: "",
});

watch(
  () => form.code,
  (v) => {
    const x = String(v || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 4);
    if (x !== v) {
      form.code = x;
    }
  },
);

const errors = reactive({
  name: "",
  code: "",
});

const enrichedSchools = computed(() => {
  return schools.value.map((s) => {
    const rel = users.value.filter((u) => u.school_id === s.id);
    const studentCount = rel.filter((u) => u.role === "student").length;
    const psy = rel.find((u) => u.role === "psychologist");
    return {
      ...s,
      studentCount,
      psychologistName: psy?.full_name || null,
    };
  });
});

function resetForm() {
  form.name = "";
  form.code = "";
  errors.name = "";
  errors.code = "";
  formError.value = "";
}

function openCreate() {
  editingId.value = null;
  resetForm();
  modalOpen.value = true;
}

function openEdit(row) {
  editingId.value = row.id;
  form.name = row.name;
  form.code = row.code;
  errors.name = "";
  errors.code = "";
  formError.value = "";
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode() {
  let out = "";
  for (let i = 0; i < 4; i += 1) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

async function generateCode() {
  formError.value = "";
  for (let i = 0; i < 30; i += 1) {
    const c = randomCode();
    const { data } = await api.get("/api/admin/schools", { params: { code: c } });
    const exists = (data?.schools || []).some((s) => s.code === c);
    if (!exists) {
      form.code = c;
      return;
    }
  }
  formError.value = "Yagona kod generatsiya qilib bo'lmadi. Qo'lda kiriting.";
}

function validateForm() {
  errors.name = "";
  errors.code = "";
  if (!form.name.trim()) {
    errors.name = "Maktab nomini kiriting";
    return false;
  }
  const c = form.code.trim().toUpperCase();
  if (c.length !== 4 || !/^[A-Z0-9]{4}$/.test(c)) {
    errors.code = "4 ta harf yoki raqamdan iborat kod kiriting";
    return false;
  }
  form.code = c;
  return true;
}

async function copyCode(code) {
  try {
    await navigator.clipboard.writeText(code);
  } catch {
    formError.value = "Buferga nusxalash ishlamadi.";
  }
}

async function load() {
  loading.value = true;
  pageError.value = "";
  schools.value = [];
  users.value = [];

  try {
    const [schoolsResp, psychResp, studentsResp] = await Promise.all([
      api.get("/api/admin/schools"),
      api.get("/api/admin/psychologists"),
      api.get("/api/admin/students"),
    ]);
    schools.value = schoolsResp.data?.schools || [];
    users.value = [
      ...(psychResp.data?.psychologists || []).map((p) => ({
        id: p.id,
        school_id: p.school_id || p.schoolId,
        role: "psychologist",
        full_name: p.full_name || p.fullName,
      })),
      ...(studentsResp.data?.students || []).map((s) => ({
        id: s.id,
        school_id: s.school_id || s.schoolId,
        role: "student",
        full_name: s.full_name || s.fullName,
      })),
    ];
  } catch (error) {
    pageError.value = getApiErrorMessage(error, "Ma'lumotlarni yuklashda xatolik.");
  } finally {
    loading.value = false;
  }
}

async function saveSchool() {
  formError.value = "";
  if (!validateForm()) {
    return;
  }

  saveLoading.value = true;
  try {
    if (editingId.value) {
      await api.patch(`/api/admin/schools/${encodeURIComponent(editingId.value)}`, {
        name: form.name.trim(),
        code: form.code,
      });
    } else {
      await api.post("/api/admin/schools", {
        name: form.name.trim(),
        code: form.code,
        is_active: true,
      });
    }

    closeModal();
    await load();
  } catch (error) {
    formError.value = getApiErrorMessage(error, "Saqlashda xatolik yuz berdi.");
  } finally {
    saveLoading.value = false;
  }
}

async function toggleActive(row, next) {
  toggleLoadingId.value = row.id;
  try {
    await api.patch(`/api/admin/schools/${encodeURIComponent(row.id)}`, { is_active: next });
    row.is_active = next;
  } catch (error) {
    pageError.value = getApiErrorMessage(error, "Holatni yangilab bo'lmadi.");
  } finally {
    toggleLoadingId.value = null;
  }
}

async function tryDelete(row) {
  formError.value = "";
  const rel = users.value.filter((u) => u.school_id === row.id);
  const hasStudent = rel.some((u) => u.role === "student");
  const hasPsy = rel.some((u) => u.role === "psychologist");

  if (hasStudent || hasPsy) {
    alert("Bu maktabda o'quvchilar/psixolog bor, o'chirib bo'lmaydi");
    return;
  }

  if (!confirm(`"${row.name}" maktabini o'chirishni tasdiqlaysizmi?`)) {
    return;
  }

  try {
    await api.patch(`/api/admin/schools/${encodeURIComponent(row.id)}`, { is_active: false });
    await load();
  } catch {
    alert("O'chirishda xatolik yuz berdi.");
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
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

h1 {
  margin: 0;
}

.alert,
.form-err {
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
  vertical-align: middle;
}

.table th {
  background: var(--surface-2);
}

.linkish {
  margin-left: 8px;
  border: none;
  background: none;
  color: var(--color-primary);
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 600;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn-ghost {
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: #fff;
  cursor: pointer;
  font-weight: 600;
}

.btn-danger {
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  border: none;
  background: var(--color-danger);
  color: #fff;
  cursor: pointer;
  font-weight: 600;
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

.code-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-2);
  align-items: end;
}

.auto-btn {
  margin-bottom: 2px;
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
  .table { min-width: 860px; }
}
</style>
