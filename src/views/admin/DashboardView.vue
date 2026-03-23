<template>
  <div class="layout">
    <AdminSidebar />
    <main class="main">
      <h1>Bosh sahifa</h1>

      <div v-if="!supabaseOk" class="alert">Supabase sozlanmagan.</div>
      <LoadingSpinner v-else-if="loading" text="Ma'lumotlar yuklanmoqda..." />

      <template v-else-if="errorMessage">
        <p class="err">{{ errorMessage }}</p>
      </template>

      <template v-else>
        <div class="stats">
          <div class="stat blue">
            <span class="label">Jami maktablar</span>
            <span class="num">{{ counts.schools }}</span>
          </div>
          <div class="stat purple">
            <span class="label">Jami psixologlar</span>
            <span class="num">{{ counts.psychologists }}</span>
          </div>
          <div class="stat green">
            <span class="label">Jami o'quvchilar</span>
            <span class="num">{{ counts.students }}</span>
          </div>
          <div class="stat teal">
            <span class="label">Bugun topshirilgan testlar</span>
            <span class="num">{{ counts.testsToday }}</span>
          </div>
        </div>

        <section class="section">
          <h2>Oxirgi maktablar</h2>
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Maktab nomi</th>
                  <th>Kod</th>
                  <th>O'quvchilar</th>
                  <th>Psixolog</th>
                  <th>Holat</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in schoolRows" :key="row.id">
                  <td>{{ row.name }}</td>
                  <td><code>{{ row.code }}</code></td>
                  <td>{{ row.studentCount }}</td>
                  <td>{{ row.hasPsychologist ? "Bor" : "Yo'q" }}</td>
                  <td>
                    <span :class="row.is_active ? 'ok' : 'off'">
                      {{ row.is_active ? "Aktiv" : "Nofaol" }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-if="!schoolRows.length" class="muted">Maktablar yo'q.</p>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";

import AdminSidebar from "../../components/layout/AdminSidebar.vue";
import LoadingSpinner from "../../components/ui/LoadingSpinner.vue";
import { supabase } from "../../lib/supabase";

const supabaseOk = Boolean(supabase);
const loading = ref(true);
const errorMessage = ref("");
const counts = ref({
  schools: 0,
  psychologists: 0,
  students: 0,
  testsToday: 0,
});
const schoolRows = ref([]);

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfTodayIso() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

async function load() {
  loading.value = true;
  errorMessage.value = "";
  counts.value = { schools: 0, psychologists: 0, students: 0, testsToday: 0 };
  schoolRows.value = [];

  if (!supabase) {
    loading.value = false;
    return;
  }

  try {
    const { count: cSchools, error: e1 } = await supabase
      .from("schools")
      .select("*", { count: "exact", head: true });

    if (e1) {
      throw e1;
    }

    const { count: cPsy, error: e2 } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "psychologist");

    if (e2) {
      throw e2;
    }

    const { count: cStu, error: e3 } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "student");

    if (e3) {
      throw e3;
    }

    const t0 = startOfTodayIso();
    const t1 = endOfTodayIso();
    const { count: cTests, error: e4 } = await supabase
      .from("results")
      .select("*", { count: "exact", head: true })
      .gte("taken_at", t0)
      .lte("taken_at", t1);

    if (e4) {
      throw e4;
    }

    counts.value = {
      schools: cSchools ?? 0,
      psychologists: cPsy ?? 0,
      students: cStu ?? 0,
      testsToday: cTests ?? 0,
    };

    const { data: schools, error: e5 } = await supabase
      .from("schools")
      .select("id, name, code, is_active, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (e5) {
      throw e5;
    }

    const ids = (schools || []).map((s) => s.id);
    let usersInSchools = [];
    if (ids.length) {
      const { data: u, error: e6 } = await supabase
        .from("users")
        .select("school_id, role")
        .in("school_id", ids);

      if (e6) {
        throw e6;
      }
      usersInSchools = u || [];
    }

    schoolRows.value = (schools || []).map((s) => {
      const rel = usersInSchools.filter((u) => u.school_id === s.id);
      const studentCount = rel.filter((u) => u.role === "student").length;
      const hasPsychologist = rel.some((u) => u.role === "psychologist");
      return {
        ...s,
        studentCount,
        hasPsychologist,
      };
    });
  } catch {
    errorMessage.value = "Statistikani yuklashda xatolik yuz berdi.";
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
  max-width: 1000px;
}

h1 {
  margin: 0 0 var(--space-5);
}

h2 {
  font-size: 1.1rem;
  margin: 0 0 var(--space-3);
}

.alert,
.err {
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--color-danger) 12%, white);
  color: var(--color-danger);
  font-weight: 600;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.stat {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.stat.blue {
  background: color-mix(in srgb, #3b82f6 12%, white);
  border: 1px solid color-mix(in srgb, #3b82f6 30%, white);
}

.stat.purple {
  background: color-mix(in srgb, #8b5cf6 12%, white);
  border: 1px solid color-mix(in srgb, #8b5cf6 28%, white);
}

.stat.green {
  background: color-mix(in srgb, #22c55e 12%, white);
  border: 1px solid color-mix(in srgb, #22c55e 30%, white);
}

.stat.teal {
  background: color-mix(in srgb, #14b8a6 12%, white);
  border: 1px solid color-mix(in srgb, #14b8a6 30%, white);
}

.label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-muted);
}

.num {
  font-size: 2rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.section {
  margin-top: var(--space-4);
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
}

code {
  font-size: 0.9rem;
}

.ok {
  color: #166534;
  font-weight: 700;
}

.off {
  color: var(--color-muted);
  font-weight: 700;
}

.muted {
  padding: var(--space-3);
  margin: 0;
  color: var(--color-muted);
}
</style>
