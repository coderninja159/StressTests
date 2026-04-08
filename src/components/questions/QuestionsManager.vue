<template>
  <div class="qm">
    <div v-if="variant === 'psychologist' && !psychSchoolId" class="qm-alert">
      Maktab biriktirilmagan — savol qo‘sha olmaysiz.
    </div>

    <div class="qm-tabs">
      <button type="button" class="qm-tab" :class="{ on: testTab === 'psychological' }" @click="testTab = 'psychological'">
        Psixologik test
      </button>
      <button type="button" class="qm-tab" :class="{ on: testTab === 'portrait' }" @click="testTab = 'portrait'">
        Portret testi
      </button>
    </div>

    <div v-if="loading" class="qm-skel"><div v-for="n in 5" :key="n" class="qm-sk" /></div>
    <div v-else-if="errorMessage" class="qm-err">
      <p>{{ errorMessage }}</p>
      <button type="button" class="qm-btn" @click="load">Qayta urinish</button>
    </div>

    <template v-else>
      <div class="qm-table-wrap table-wrapper">
        <table class="qm-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Savol matni</th>
              <th>Kategoriya</th>
              <th>Tartib</th>
              <th>Holati</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(q, idx) in filteredQuestions" :key="q.id" :class="{ off: !q.is_active }">
              <template v-if="editingId === q.id">
                <td>{{ idx + 1 }}</td>
                <td><textarea v-model="editDraft.question_text" class="ds-textarea" rows="2" /></td>
                <td>
                  <select v-model="editDraft.category" class="ds-select">
                    <option v-for="c in catOpts" :key="c" :value="c">{{ c }}</option>
                  </select>
                </td>
                <td><input v-model.number="editDraft.order_num" type="number" min="1" class="ds-input" /></td>
                <td>
                  <button type="button" class="qm-link" @click="editDraft.is_active = !editDraft.is_active">
                    {{ editDraft.is_active ? "Faol" : "Nofaol" }}
                  </button>
                </td>
                <td>
                  <button type="button" class="qm-btn sm" @click="saveEdit(q)">Saqlash</button>
                  <button type="button" class="qm-btn ghost sm" @click="editingId = null">Bekor</button>
                </td>
              </template>
              <template v-else>
                <td>{{ idx + 1 }}</td>
                <td class="qm-q">{{ q.question_text }}</td>
                <td>{{ q.category }}</td>
                <td>{{ q.order_num }}</td>
                <td>
                  <button type="button" class="qm-link" @click="toggleActive(q)">
                    {{ q.is_active ? "Faol" : "Nofaol" }}
                  </button>
                </td>
                <td>
                  <button type="button" class="qm-btn ghost sm" @click="startEdit(q)">Tahrirlash</button>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
        <p v-if="!filteredQuestions.length" class="qm-muted">Savollar yo‘q.</p>
      </div>

      <div class="qm-panel stack-section">
        <div class="qm-subtabs">
          <button type="button" class="qm-sub" :class="{ on: addTab === 'single' }" @click="addTab = 'single'">Yakka qo‘shish</button>
          <button type="button" class="qm-sub" :class="{ on: addTab === 'excel' }" @click="addTab = 'excel'">Excel orqali</button>
        </div>

        <div v-if="addTab === 'single'" class="qm-form card">
          <label v-if="variant === 'admin'" class="label-std">Maktab</label>
          <select v-if="variant === 'admin'" v-model="formSchoolId" class="ds-select qm-field">
            <option :value="null">Barcha maktablar (umumiy)</option>
            <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>

          <label class="label-std">Savol matni</label>
          <textarea v-model="form.question_text" class="ds-textarea qm-field" rows="3" placeholder="Savol" />

          <div class="qm-row2">
            <div>
              <label class="label-std">Kategoriya</label>
              <select v-model="form.category" class="ds-select qm-field">
                <option v-for="c in catOpts" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div>
              <label class="label-std">Tartib</label>
              <input v-model.number="form.order_num" type="number" min="1" class="ds-input qm-field" />
            </div>
          </div>

          <template v-if="testTab === 'portrait'">
            <p class="label-std">Variantlar</p>
            <div v-for="(o, i) in portraitOpts" :key="i" class="qm-opt">
              <input v-model="o.option_text" class="ds-input" placeholder="Variant matni" />
              <select v-model="o.personality_type" class="ds-select">
                <option v-for="p in portraitTypes" :key="p" :value="p">{{ p }}</option>
              </select>
              <select v-model.number="o.points" class="ds-select sm">
                <option :value="1">1 ball</option>
                <option :value="2">2 ball</option>
              </select>
            </div>
            <button type="button" class="qm-btn ghost sm" @click="addPortraitRow">+ Variant</button>
          </template>

          <button type="button" class="qm-btn" :disabled="saving" @click="saveSingle">Saqlash</button>
        </div>

        <div v-else class="qm-excel card">
          <button type="button" class="qm-btn ghost" @click="downloadTemplate">Shablon yuklab olish (.xlsx)</button>
          <label class="qm-drop">
            <input type="file" accept=".xlsx,.xls" class="sr-only" @change="onExcel" />
            <span>Excel faylni yuklash (bosish yoki tortish)</span>
          </label>
          <p v-if="excelSummary" class="qm-sum">{{ excelSummary }}</p>
          <div v-if="excelPreview.length" class="qm-preview table-wrapper">
            <table class="qm-table">
              <thead>
                <tr>
                  <th>Holat</th>
                  <th>Matn / xabar</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in excelPreview" :key="i" :class="{ bad: !row.ok, warn: row.ok && row.warnings?.length }">
                  <td>{{ row.ok ? "OK" : "Xato" }}</td>
                  <td>
                    <span v-if="row.errors?.length" class="qm-err-inline">{{ row.errors.join(", ") }}</span>
                    <span v-if="row.warnings?.length" class="qm-warn-inline">{{ row.warnings.join(", ") }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="qm-actions">
            <button type="button" class="qm-btn ghost" @click="clearExcel">Bekor qilish</button>
            <button type="button" class="qm-btn" :disabled="importing || !excelValidRows.length" @click="saveExcelRows">
              Bazaga saqlash ({{ excelValidRows.length }} qator)
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/auth";
import {
  PSYCH_CATS,
  PORTRAIT_TYPES,
  buildPsychTemplateWb,
  buildPortraitTemplateWb,
  validatePsychRow,
  validatePortraitRow,
  sheetRowsToObjects,
} from "../../lib/questionsExcel.js";

const props = defineProps({
  variant: { type: String, required: true, validator: (v) => v === "admin" || v === "psychologist" },
});

const authStore = useAuthStore();
const psychSchoolId = computed(() => authStore.currentUser?.school_id ?? null);

const loading = ref(true);
const errorMessage = ref("");
const questions = ref([]);
const schools = ref([]);
const testTab = ref("psychological");
const addTab = ref("single");
const saving = ref(false);
const importing = ref(false);
const editingId = ref(null);
const editDraft = reactive({});
const formSchoolId = ref(null);

const form = reactive({
  question_text: "",
  category: "lie_scale",
  order_num: 1,
});

const portraitOpts = reactive([
  { option_text: "", personality_type: "leadership", points: 2 },
  { option_text: "", personality_type: "social", points: 2 },
]);

const excelPreview = ref([]);
const excelValidRows = ref([]);
const excelSummary = ref("");

const portraitTypes = PORTRAIT_TYPES;

const catOpts = computed(() => (testTab.value === "psychological" ? PSYCH_CATS : ["portrait"]));

const filteredQuestions = computed(() =>
  questions.value.filter((q) =>
    testTab.value === "psychological" ? q.test_type === "psychological" : q.test_type === "portrait",
  ),
);

watch(testTab, (t) => {
  form.category = t === "psychological" ? "lie_scale" : "portrait";
  form.order_num = nextOrder(t === "psychological" ? "psychological" : "portrait");
});

function nextOrder(tt) {
  const list = questions.value.filter((q) => q.test_type === tt);
  const m = list.reduce((a, q) => Math.max(a, q.order_num || 0), 0);
  return m + 1;
}

function insertSchoolId() {
  if (props.variant === "psychologist") return psychSchoolId.value;
  return formSchoolId.value;
}

function isMissingSchoolIdColumn(err) {
  const t = `${err?.message || ""} ${err?.details || ""} ${err?.hint || ""}`.toLowerCase();
  return t.includes("school_id") && (t.includes("does not exist") || t.includes("schema cache"));
}

async function loadQuestionsLegacy() {
  const sel = "id, test_type, question_text, category, order_num, is_active";
  const { data, error } = await supabase.from("questions").select(sel).order("order_num");
  if (error) throw error;
  questions.value = (data || []).map((r) => ({ ...r, school_id: r.school_id ?? null }));
}

async function load() {
  if (!supabase) {
    loading.value = false;
    return;
  }
  loading.value = true;
  errorMessage.value = "";
  try {
    if (props.variant === "admin") {
      const { data: sch, error: se } = await supabase.from("schools").select("id, name").order("name");
      if (se) throw se;
      schools.value = sch || [];
    }

    let q = supabase
      .from("questions")
      .select("id, test_type, question_text, category, order_num, is_active, school_id")
      .order("order_num");

    if (props.variant === "psychologist" && psychSchoolId.value) {
      q = q.or(`school_id.is.null,school_id.eq.${psychSchoolId.value}`);
    }

    const { data, error } = await q;
    if (error) {
      if (isMissingSchoolIdColumn(error)) {
        await loadQuestionsLegacy();
      } else {
        throw error;
      }
    } else {
      questions.value = data || [];
    }
    form.order_num = nextOrder("psychological");
  } catch (e) {
    const msg = e?.message || e?.details || "";
    errorMessage.value = msg
      ? `Yuklashda xatolik: ${msg}. Agar school_id haqida yozilgan bo‘lsa, Supabase’da 004 migratsiyasini bajaring.`
      : "Yuklashda xatolik.";
  } finally {
    loading.value = false;
  }
}

function startEdit(q) {
  editingId.value = q.id;
  Object.assign(editDraft, {
    question_text: q.question_text,
    category: q.category,
    order_num: q.order_num,
    is_active: q.is_active,
  });
}

async function saveEdit(q) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from("questions")
      .update({
        question_text: String(editDraft.question_text || "").trim(),
        category: editDraft.category,
        order_num: editDraft.order_num,
        is_active: editDraft.is_active,
      })
      .eq("id", q.id);
    if (error) throw error;
    editingId.value = null;
    await load();
  } catch {
    errorMessage.value = "Saqlashda xatolik.";
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

function addPortraitRow() {
  portraitOpts.push({ option_text: "", personality_type: "intellectual", points: 1 });
}

async function saveSingle() {
  if (!supabase || props.variant === "psychologist" && !psychSchoolId.value) return;
  const tt = testTab.value === "psychological" ? "psychological" : "portrait";
  const text = String(form.question_text || "").trim();
  if (!text) return;
  saving.value = true;
  errorMessage.value = "";
  try {
    const school_id = insertSchoolId();
    if (tt === "psychological") {
      const { error } = await supabase.from("questions").insert({
        test_type: "psychological",
        question_text: text,
        category: form.category,
        order_num: form.order_num,
        is_active: true,
        school_id,
      });
      if (error) throw error;
    } else {
      const { data: ins, error } = await supabase
        .from("questions")
        .insert({
          test_type: "portrait",
          question_text: text,
          category: "portrait",
          order_num: form.order_num,
          is_active: true,
          school_id,
        })
        .select("id")
        .single();
      if (error) throw error;
      const opts = portraitOpts
        .filter((o) => o.option_text.trim())
        .map((o) => ({
          question_id: ins.id,
          option_text: o.option_text.trim(),
          personality_type: o.personality_type,
          points: o.points,
        }));
      if (opts.length) {
        const { error: oe } = await supabase.from("answer_options").insert(opts);
        if (oe) throw oe;
      }
    }
    form.question_text = "";
    form.order_num = nextOrder(tt);
    await load();
  } catch {
    errorMessage.value = "Saqlashda xatolik.";
  } finally {
    saving.value = false;
  }
}

function downloadTemplate() {
  const wb = testTab.value === "psychological" ? buildPsychTemplateWb() : buildPortraitTemplateWb();
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const name =
    testTab.value === "psychological" ? "psixologik_savollar_shablon.xlsx" : "portret_savollar_shablon.xlsx";
  saveAs(new Blob([out], { type: "application/octet-stream" }), name);
}

function onExcel(e) {
  const f = e.target.files?.[0];
  e.target.value = "";
  if (!f) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const wb = XLSX.read(ev.target.result, { type: "binary" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = sheetRowsToObjects(sheet);
      const tt = testTab.value === "psychological" ? "psychological" : "portrait";
      const preview = [];
      const valid = [];
      for (const r of rows) {
        const v = tt === "psychological" ? validatePsychRow(r) : validatePortraitRow(r);
        preview.push({ ok: v.ok, errors: v.errors, warnings: v.warnings });
        if (v.ok) valid.push(v.row);
      }
      excelPreview.value = preview;
      excelValidRows.value = valid;
      const bad = preview.filter((p) => !p.ok).length;
      excelSummary.value = `${valid.length} ta to‘g‘ri, ${bad} ta xato`;
    } catch {
      errorMessage.value = "Excel o‘qishda xatolik.";
    }
  };
  reader.readAsBinaryString(f);
}

function clearExcel() {
  excelPreview.value = [];
  excelValidRows.value = [];
  excelSummary.value = "";
}

async function saveExcelRows() {
  if (!supabase || !excelValidRows.value.length) return;
  importing.value = true;
  errorMessage.value = "";
  const school_id = insertSchoolId();
  try {
    for (const row of excelValidRows.value) {
      if (row.test_type === "psychological") {
        const { error } = await supabase.from("questions").insert({
          test_type: "psychological",
          question_text: row.question_text,
          category: row.category,
          order_num: row.order_num || 1,
          is_active: row.is_active !== false,
          school_id,
        });
        if (error) throw error;
      } else {
        const { data: ins, error } = await supabase
          .from("questions")
          .insert({
            test_type: "portrait",
            question_text: row.question_text,
            category: "portrait",
            order_num: row.order_num,
            is_active: true,
            school_id,
          })
          .select("id")
          .single();
        if (error) throw error;
        const opts = (row.variants || []).map((o) => ({
          question_id: ins.id,
          option_text: o.option_text,
          personality_type: o.personality_type,
          points: o.points,
        }));
        if (opts.length) {
          const { error: oe } = await supabase.from("answer_options").insert(opts);
          if (oe) throw oe;
        }
      }
    }
    clearExcel();
    await load();
  } catch {
    errorMessage.value = "Importda xatolik.";
  } finally {
    importing.value = false;
  }
}

load();
</script>

<style scoped>
.qm {
  color: var(--text-primary, #0f172a);
}

.qm-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 1.25rem;
}

.qm-tab {
  padding: 10px 18px;
  border-radius: var(--radius-md, 12px);
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-card, #fff);
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.qm-tab.on {
  border-color: var(--color-primary, #6366f1);
  background: var(--color-primary-muted, rgba(99, 102, 241, 0.08));
}

.qm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.qm-table th,
.qm-table td {
  padding: 0.875rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.qm-table tr.off {
  opacity: 0.55;
}

.qm-q {
  max-width: 320px;
}

.qm-panel {
  margin-top: 1.75rem;
}

.qm-subtabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.qm-sub {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-card, #fff);
  cursor: pointer;
  font-weight: 600;
}

.qm-sub.on {
  border-color: var(--color-primary, #6366f1);
}

.qm-form .qm-field {
  margin-bottom: 12px;
  display: block;
}

.qm-row2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 768px) {
  .qm-row2 {
    grid-template-columns: 1fr;
  }
}

.qm-opt {
  display: grid;
  grid-template-columns: 1fr 120px 90px;
  gap: 8px;
  margin-bottom: 8px;
}

.qm-btn {
  padding: 10px 16px;
  border-radius: var(--radius-sm, 8px);
  border: none;
  background: var(--color-primary, #6366f1);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  margin-top: 8px;
}

.qm-btn.ghost {
  background: transparent;
  color: var(--text-primary, #0f172a);
  border: 1px solid var(--border-color, #e2e8f0);
}

.qm-btn.sm {
  padding: 6px 10px;
  font-size: 0.8rem;
  margin-top: 0;
  margin-right: 6px;
}

.qm-link {
  background: none;
  border: none;
  color: var(--color-primary, #6366f1);
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

.qm-drop {
  display: block;
  margin: 12px 0;
  padding: 24px;
  border: 2px dashed var(--border-color, #e2e8f0);
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
}

.qm-preview tr.bad {
  background: rgba(244, 63, 94, 0.08);
}

.qm-preview tr.warn {
  background: rgba(245, 158, 11, 0.08);
}

.qm-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.qm-skel {
  display: grid;
  gap: 10px;
}

.qm-sk {
  height: 48px;
  background: var(--border-color, #e2e8f0);
  border-radius: 8px;
  animation: pulse 1.2s ease-in-out infinite;
}

.qm-err {
  padding: 14px;
  background: rgba(244, 63, 94, 0.1);
  color: var(--risk, #b91c1c);
  border-radius: 12px;
}

.qm-alert {
  padding: 12px;
  background: rgba(245, 158, 11, 0.15);
  border-radius: 10px;
  margin-bottom: 12px;
}

.qm-muted {
  color: var(--text-muted, #94a3b8);
  padding: 12px;
}

.qm-sum {
  font-weight: 700;
  margin: 8px 0;
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

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
