<template>
  <div class="layout">
    <PsychologistSidebar />
    <main class="main">
      <h1>O'quvchilar</h1>

      <div v-if="!schoolId" class="warn">Maktab biriktirilmagan.</div>

      <div v-else-if="loading" class="loading">
        <div class="spinner" />
        <span>Yuklanmoqda...</span>
      </div>

      <template v-else>
        <div class="filters">
          <label>
            Sinf
            <select v-model="filterClass">
              <option value="">Barchasi</option>
              <option v-for="c in classOptions" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>
          <label>
            Xavf darajasi
            <select v-model="filterRisk">
              <option value="all">Barchasi</option>
              <option value="high">Yuqori xavf</option>
              <option value="medium">O'rta</option>
              <option value="normal">Normal</option>
              <option value="none">Test topshirmagan</option>
            </select>
          </label>
        </div>

        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>O'quvchi ismi</th>
                <th>Sinf</th>
                <th>Yoshi</th>
                <th>Oxirgi test sanasi</th>
                <th>Xavf darajasi</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in filteredRows" :key="row.id">
                <td>{{ row.full_name }}</td>
                <td>{{ row.class_name || "—" }}</td>
                <td>{{ row.age ?? "—" }}</td>
                <td>{{ row.lastTestAt ? formatDate(row.lastTestAt) : "—" }}</td>
                <td>
                  <span v-if="!row.lastPsych" class="badge gray">Test topshirilmagan</span>
                  <span v-else class="badge" :class="riskClass(row.lastPsych.risk_level)">
                    {{ riskLabel(row.lastPsych.risk_level) }}
                  </span>
                </td>
                <td>
                  <RouterLink class="link-btn" :to="'/psychologist/students/' + row.id">
                    Ko'rish
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-if="!filteredRows.length" class="empty">Natijalar topilmadi.</p>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";

import PsychologistSidebar from "../../components/layout/PsychologistSidebar.vue";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/auth";

const authStore = useAuthStore();

const loading = ref(true);
const students = ref([]);
const results = ref([]);
const filterClass = ref("");
const filterRisk = ref("all");

const schoolId = computed(() => authStore.currentUser?.school_id ?? null);

const classOptions = Array.from({ length: 11 }, (_, i) => i + 1).flatMap((g) =>
  ["A", "B", "V"].map((l) => `${g}-${l}`),
);

const studentIds = computed(() => students.value.map((s) => s.id));

const latestPsychByUser = computed(() => {
  const map = new Map();
  for (const r of results.value) {
    if (r.test_type !== "psychological") {
      continue;
    }
    const prev = map.get(r.user_id);
    if (!prev || new Date(r.taken_at) > new Date(prev.taken_at)) {
      map.set(r.user_id, r);
    }
  }
  return map;
});

const lastAnyTestByUser = computed(() => {
  const map = new Map();
  for (const r of results.value) {
    const prev = map.get(r.user_id);
    if (!prev || new Date(r.taken_at) > new Date(prev.taken_at)) {
      map.set(r.user_id, r);
    }
  }
  return map;
});

const tableRows = computed(() =>
  students.value.map((s) => {
    const lastPsych = latestPsychByUser.value.get(s.id) || null;
    const anyLast = lastAnyTestByUser.value.get(s.id) || null;
    return {
      ...s,
      lastPsych,
      lastTestAt: anyLast?.taken_at || null,
    };
  }),
);

const filteredRows = computed(() =>
  tableRows.value.filter((row) => {
    if (filterClass.value && row.class_name !== filterClass.value) {
      return false;
    }
    if (filterRisk.value === "all") {
      return true;
    }
    if (filterRisk.value === "none") {
      return !row.lastPsych;
    }
    if (!row.lastPsych) {
      return false;
    }
    return row.lastPsych.risk_level === filterRisk.value;
  }),
);

function riskLabel(level) {
  if (level === "high") return "Yuqori";
  if (level === "medium") return "O'rta";
  if (level === "normal") return "Normal";
  return level || "—";
}

function riskClass(level) {
  if (level === "high") return "red";
  if (level === "medium") return "amber";
  if (level === "normal") return "green";
  return "gray";
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString("uz-UZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

async function load() {
  loading.value = true;
  students.value = [];
  results.value = [];

  if (!supabase || !schoolId.value) {
    loading.value = false;
    return;
  }

  try {
    const { data: studs, error: e1 } = await supabase
      .from("users")
      .select("id, full_name, class_name, age")
      .eq("role", "student")
      .eq("school_id", schoolId.value)
      .order("full_name");

    if (e1) {
      throw e1;
    }

    students.value = studs || [];

    if (!studentIds.value.length) {
      return;
    }

    const { data: res, error: e2 } = await supabase
      .from("results")
      .select("id, user_id, test_type, risk_level, taken_at")
      .in("user_id", studentIds.value)
      .order("taken_at", { ascending: false });

    if (e2) {
      throw e2;
    }

    results.value = res || [];
  } catch {
    students.value = [];
    results.value = [];
  } finally {
    loading.value = false;
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
  padding: var(--space-5);
  overflow-x: auto;
}

h1 {
  margin: 0 0 var(--space-4);
}

.warn {
  padding: var(--space-4);
  background: color-mix(in srgb, #eab308 15%, white);
  border-radius: var(--radius-sm);
}

.loading {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.filters label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 600;
  font-size: 0.9rem;
}

.filters select {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  min-width: 200px;
}

.table-wrap {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  overflow: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.table th,
.table td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.table th {
  background: var(--color-bg);
  font-weight: 700;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
}

.badge.gray {
  background: var(--color-border);
  color: var(--color-muted);
}

.badge.red {
  background: color-mix(in srgb, #ef4444 20%, white);
  color: #991b1b;
}

.badge.amber {
  background: color-mix(in srgb, #eab308 22%, white);
  color: #854d0e;
}

.badge.green {
  background: color-mix(in srgb, #22c55e 20%, white);
  color: #166534;
}

.link-btn {
  display: inline-block;
  padding: 6px 12px;
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-sm);
  font-weight: 600;
  text-decoration: none;
  font-size: 0.9rem;
}

.empty {
  padding: var(--space-4);
  color: var(--color-muted);
  margin: 0;
}
</style>
