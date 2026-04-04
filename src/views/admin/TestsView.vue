<template>
  <div class="tv-layout">
    <AdminSidebar />
    <main class="tv-main">
      <MobileHeader />
      <header class="tv-head">
        <div>
          <h1>Testlar va savollar</h1>
          <p class="tv-sub">Savollarni boshqarish va import</p>
        </div>
        <div class="tv-actions">
          <label class="tv-file">
            <input type="file" accept=".xlsx,.xls" class="sr-only" @change="onExcelFile" />
            Excel import
          </label>
          <button type="button" class="tv-btn" @click="openModal">+ Savol qo'shish</button>
        </div>
      </header>

      <div v-if="!supabaseOk" class="tv-alert">Supabase sozlanmagan.</div>

      <div v-else-if="loading" class="tv-skel">
        <div v-for="n in 4" :key="n" class="tv-sk" />
      </div>

      <div v-else-if="errorMessage" class="tv-err">
        <p>{{ errorMessage }}</p>
        <button type="button" class="tv-btn" @click="load">Qayta urinish</button>
      </div>

      <template v-else>
        <section v-for="group in grouped" :key="group.type" class="tv-group">
          <div class="tv-group-head">
            <h2>{{ group.title }}</h2>
            <span class="tv-badge">{{ group.activeCount }} / {{ group.items.length }} aktiv</span>
          </div>
          <div class="tv-cards">
            <article v-for="q in group.items" :key="q.id" class="tv-card" :class="{ off: !q.is_active }">
              <div class="tv-card-top">
                <span class="tv-order">#{{ q.order_num }}</span>
                <span class="tv-cat">{{ q.category }}</span>
                <span :class="q.is_active ? 'tag on' : 'tag off'">{{ q.is_active ? "Aktiv" : "O'chirilgan" }}</span>
              </div>
              <p class="tv-qtext">{{ q.question_text }}</p>
              <div class="tv-card-actions">
                <button type="button" class="linkish" @click="toggleActive(q)">
                  {{ q.is_active ? "O'chirish (nofaol)" : "Aktivlashtirish" }}
                </button>
              </div>
            </article>
          </div>
        </section>

        <p v-if="!questions.length" class="muted">Savollar topilmadi.</p>
      </template>

      <div v-if="previewRows.length" class="tv-preview">
        <h3>Import ko'rinishi ({{ previewRows.length }} qator)</h3>
        <table class="tv-table">
          <thead>
            <tr>
              <th>question_text</th>
              <th>category</th>
              <th>order_num</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in previewRows" :key="i">
              <td>{{ r.question_text }}</td>
              <td>{{ r.category }}</td>
              <td>{{ r.order_num }}</td>
            </tr>
          </tbody>
        </table>
        <button type="button" class="tv-btn" :disabled="importing" @click="confirmImport">Bazaga yozish</button>
        <button type="button" class="tv-btn ghost" @click="previewRows = []">Bekor qilish</button>
      </div>
    </main>

    <div v-if="modalOpen" class="tv-overlay" @click.self="modalOpen = false">
      <div class="tv-modal">
        <h3>Yangi savol</h3>
        <label class="tv-field">
          <span>Test turi</span>
          <select v-model="form.test_type" class="tv-input">
            <option value="psychological">Psixologik</option>
            <option value="portrait">Portret</option>
          </select>
        </label>
        <label class="tv-field">
          <span>Savol matni</span>
          <textarea v-model="form.question_text" class="tv-input tall" rows="4" />
        </label>
        <label class="tv-field">
          <span>Kategoriya</span>
          <select v-model="form.category" class="tv-input">
            <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
          </select>
        </label>
        <label class="tv-field">
          <span>Tartib raqami</span>
          <input v-model.number="form.order_num" type="number" min="1" class="tv-input" />
        </label>
        <label class="tv-toggle">
          <input v-model="form.is_active" type="checkbox" />
          Aktiv
        </label>

        <template v-if="form.test_type === 'portrait'">
          <p class="tv-hint">To'rtta variant (har biri: matn, shaxsiyat turi, ball 1 yoki 2)</p>
          <div v-for="(opt, i) in portraitOpts" :key="i" class="tv-opt-row">
            <input v-model="opt.option_text" class="tv-input" placeholder="Variant matni" />
            <select v-model="opt.personality_type" class="tv-input sm">
              <option value="leadership">leadership</option>
              <option value="social">social</option>
              <option value="intellectual">intellectual</option>
              <option value="emotional">emotional</option>
            </select>
            <select v-model.number="opt.points" class="tv-input sm">
              <option :value="1">1</option>
              <option :value="2">2</option>
            </select>
          </div>
        </template>

        <div class="tv-modal-foot">
          <button type="button" class="tv-btn ghost" @click="modalOpen = false">Yopish</button>
          <button type="button" class="tv-btn" :disabled="saving" @click="saveQuestion">Saqlash</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import * as XLSX from "xlsx";

import AdminSidebar from "../../components/layout/AdminSidebar.vue";
import MobileHeader from "../../components/layout/MobileHeader.vue";
import { supabase } from "../../lib/supabase";

const supabaseOk = Boolean(supabase);
const loading = ref(true);
const errorMessage = ref("");
const questions = ref([]);
const modalOpen = ref(false);
const saving = ref(false);
const importing = ref(false);
const previewRows = ref([]);

const form = reactive({
  test_type: "psychological",
  question_text: "",
  category: "lie_scale",
  order_num: 1,
  is_active: true,
});

const portraitOpts = reactive([
  { option_text: "", personality_type: "leadership", points: 2 },
  { option_text: "", personality_type: "social", points: 2 },
  { option_text: "", personality_type: "intellectual", points: 2 },
  { option_text: "", personality_type: "emotional", points: 2 },
]);

const psychCats = ["lie_scale", "delinquency", "addiction", "aggression", "self_harm"];

const categoryOptions = computed(() =>
  form.test_type === "psychological" ? psychCats : ["portrait"],
);

watch(
  () => form.test_type,
  (t) => {
    form.category = t === "psychological" ? "lie_scale" : "portrait";
    if (modalOpen.value) {
      form.order_num = nextOrderNum(t);
    }
  },
);

const grouped = computed(() => {
  const psych = questions.value.filter((q) => q.test_type === "psychological");
  const port = questions.value.filter((q) => q.test_type === "portrait");
  const map = (items, title, type) => ({
    type,
    title,
    items,
    activeCount: items.filter((q) => q.is_active).length,
  });
  return [
    map(psych, "Psixologik test", "psychological"),
    map(port, "Portret test", "portrait"),
  ];
});

async function load() {
  if (!supabase) {
    loading.value = false;
    return;
  }
  loading.value = true;
  errorMessage.value = "";
  try {
    const { data, error } = await supabase
      .from("questions")
      .select("id, test_type, question_text, category, order_num, is_active")
      .order("test_type")
      .order("order_num");
    if (error) throw error;
    questions.value = data || [];
  } catch {
    errorMessage.value = "Savollarni yuklashda xatolik.";
  } finally {
    loading.value = false;
  }
}

function nextOrderNum(testType) {
  const list = questions.value.filter((q) => q.test_type === testType);
  const max = list.reduce((m, q) => Math.max(m, q.order_num || 0), 0);
  return max + 1;
}

function openModal() {
  form.test_type = "psychological";
  form.question_text = "";
  form.category = "lie_scale";
  form.order_num = nextOrderNum("psychological");
  form.is_active = true;
  modalOpen.value = true;
}

async function saveQuestion() {
  if (!supabase || !form.question_text.trim()) return;
  saving.value = true;
  try {
    if (form.test_type === "psychological") {
      const { error } = await supabase.from("questions").insert({
        test_type: "psychological",
        question_text: form.question_text.trim(),
        category: form.category,
        order_num: form.order_num,
        is_active: form.is_active,
      });
      if (error) throw error;
    } else {
      const { data: ins, error } = await supabase
        .from("questions")
        .insert({
          test_type: "portrait",
          question_text: form.question_text.trim(),
          category: "portrait",
          order_num: form.order_num,
          is_active: form.is_active,
        })
        .select("id")
        .single();
      if (error) throw error;
      const qid = ins.id;
      const opts = portraitOpts
        .filter((o) => o.option_text.trim())
        .map((o) => ({
          question_id: qid,
          option_text: o.option_text.trim(),
          personality_type: o.personality_type,
          points: o.points,
        }));
      if (opts.length) {
        const { error: oe } = await supabase.from("answer_options").insert(opts);
        if (oe) throw oe;
      }
    }
    modalOpen.value = false;
    await load();
  } catch {
    errorMessage.value = "Saqlashda xatolik.";
  } finally {
    saving.value = false;
  }
}

async function toggleActive(q) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("questions").update({ is_active: !q.is_active }).eq("id", q.id);
    if (error) throw error;
    await load();
  } catch {
    errorMessage.value = "Yangilashda xatolik.";
  }
}

function onExcelFile(e) {
  const f = e.target.files?.[0];
  e.target.value = "";
  if (!f) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const wb = XLSX.read(ev.target.result, { type: "binary" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      previewRows.value = rows
        .map((r) => ({
          question_text: String(r.question_text || r.Question || "").trim(),
          category: String(r.category || r.Category || "lie_scale").trim(),
          order_num: Number(r.order_num || r.Order || 0) || 0,
          test_type: String(r.test_type || "psychological").trim() || "psychological",
        }))
        .filter((r) => r.question_text);
    } catch {
      errorMessage.value = "Excel o'qishda xatolik.";
    }
  };
  reader.readAsBinaryString(f);
}

async function confirmImport() {
  if (!supabase || !previewRows.value.length) return;
  importing.value = true;
  errorMessage.value = "";
  try {
    const rows = previewRows.value.map((r, i) => ({
      test_type: r.test_type === "portrait" ? "portrait" : "psychological",
      question_text: r.question_text,
      category: r.category || "lie_scale",
      order_num: r.order_num || i + 1,
      is_active: true,
    }));
    const { error } = await supabase.from("questions").insert(rows);
    if (error) throw error;
    previewRows.value = [];
    await load();
  } catch {
    errorMessage.value = "Importda xatolik (ustunlar: question_text, category, order_num).";
  } finally {
    importing.value = false;
  }
}

load();
</script>

<style scoped>
.tv-layout {
  display: flex;
  min-height: 100vh;
  background: var(--n-50, #f8fafc);
}

.tv-main {
  flex: 1;
  padding: 20px 24px 48px;
  min-width: 0;
}

.tv-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.tv-head h1 {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 800;
}

.tv-sub {
  margin: 4px 0 0;
  color: #64748b;
}

.tv-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tv-btn {
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  background: #4f46e5;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.tv-btn.ghost {
  background: #fff;
  color: #334155;
  border: 1px solid #e2e8f0;
}

.tv-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tv-file {
  display: inline-flex;
  align-items: center;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.tv-alert,
.tv-err {
  padding: 14px;
  border-radius: 12px;
  background: #fef2f2;
  color: #b91c1c;
  font-weight: 600;
}

.tv-skel {
  display: grid;
  gap: 12px;
}
.tv-sk {
  height: 100px;
  border-radius: 12px;
  background: #e2e8f0;
  animation: pulse 1.2s ease-in-out infinite;
}
@keyframes pulse {
  50% {
    opacity: 0.6;
  }
}

.tv-group {
  margin-bottom: 28px;
}

.tv-group-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.tv-group-head h2 {
  margin: 0;
  font-size: 1.1rem;
}

.tv-badge {
  font-size: 0.8rem;
  padding: 4px 10px;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 999px;
  font-weight: 700;
}

.tv-cards {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.tv-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
}

.tv-card.off {
  opacity: 0.75;
}

.tv-card-top {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.tv-order {
  font-weight: 800;
  color: #4f46e5;
}

.tv-cat {
  font-size: 0.78rem;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 6px;
}

.tag.on {
  color: #047857;
  font-size: 0.75rem;
  font-weight: 700;
}
.tag.off {
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 700;
}

.tv-qtext {
  margin: 0 0 10px;
  font-size: 0.9rem;
  line-height: 1.45;
}

.linkish {
  background: none;
  border: none;
  color: #4f46e5;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.tv-preview {
  margin-top: 24px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.tv-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  margin: 12px 0;
}

.tv-table th,
.tv-table td {
  border: 1px solid #e2e8f0;
  padding: 6px 8px;
  text-align: left;
}

.tv-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 200;
}

.tv-modal {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  max-width: 520px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.tv-modal h3 {
  margin: 0 0 16px;
}

.tv-field {
  display: block;
  margin-bottom: 12px;
}

.tv-field span {
  display: block;
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 4px;
}

.tv-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
}

.tv-input.tall {
  resize: vertical;
  min-height: 80px;
}

.tv-input.sm {
  width: auto;
  min-width: 120px;
}

.tv-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
}

.tv-hint {
  font-size: 0.85rem;
  color: #64748b;
}

.tv-opt-row {
  display: grid;
  grid-template-columns: 1fr minmax(100px, auto) 60px;
  gap: 8px;
  margin-bottom: 8px;
}

.tv-modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.muted {
  color: #64748b;
}
</style>
