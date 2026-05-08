<template>
  <div class="psych-dashboard-page" :data-theme="themeStore.mode">
    <PsychologistSidebar />

    <main class="psych-main">
      <MobileHeader />

      <header class="psych-topbar">
        <div class="topbar-left">
          <h1 class="topbar-title">Maktab psixologi dashboard</h1>
          <div class="topbar-sub">{{ formattedNow }}</div>
        </div>
        <div class="topbar-right">
          <div class="admin-avatar">
            <span class="avatar-dot" />
            {{ authStore.currentUser?.full_name ? initials(authStore.currentUser.full_name) : "Psixolog" }}
          </div>
        </div>
      </header>

      <div class="psych-content">
        <section class="section">
          <div class="section-head">
            <h2>Ko‘rsatkichlar</h2>
          </div>

          <div v-if="loading" class="stats-grid">
            <div v-for="i in 6" :key="i" class="stat-card sk-card">
              <div class="skeleton skeleton-line" />
              <div class="skeleton skeleton-num" />
              <div class="skeleton skeleton-mini" />
            </div>
          </div>

          <div v-else class="stats-grid stats-grid-2">
            <div class="stat-card">
              <div class="stat-head">
                <div class="stat-icon" style="--c: var(--dash-purple);">
                  <UsersIcon />
                </div>
                <span class="stat-badge purple">—</span>
              </div>
              <div class="stat-num"><AnimatedNumber :value="totals.students" /></div>
              <div class="stat-label">Mening o‘quvchilarim</div>
            </div>
            <div class="stat-card">
              <div class="stat-head">
                <div class="stat-icon" style="--c: var(--dash-green);">
                  <CheckIcon />
                </div>
                <span class="stat-badge green">{{ completionPctBadge }}</span>
              </div>
              <div class="stat-num"><AnimatedNumber :value="totals.testedStudents" /></div>
              <div class="stat-label">Test topshirdi</div>
            </div>
            <div class="stat-card">
              <div class="stat-head">
                <div class="stat-icon" style="--c: var(--dash-amber);">
                  <ClockIcon />
                </div>
                <span class="stat-badge amber">—</span>
              </div>
              <div class="stat-num"><AnimatedNumber :value="totals.notTestedStudents" /></div>
              <div class="stat-label">Topshirmadi</div>
            </div>
            <div class="stat-card">
              <div class="stat-head">
                <div class="stat-icon" style="--c: var(--dash-red);">
                  <AlertIcon />
                </div>
                <span class="stat-badge red">! </span>
              </div>
              <div class="stat-num"><AnimatedNumber :value="totals.highRiskCount" /></div>
              <div class="stat-label">Yuqori risk</div>
            </div>
            <div class="stat-card">
              <div class="stat-head">
                <div class="stat-icon" style="--c: var(--dash-cyan);">
                  <ActivityIcon />
                </div>
                <span class="stat-badge cyan">—</span>
              </div>
              <div class="stat-num"><AnimatedNumber :value="totals.avgStress" /></div>
              <div class="stat-label">O‘rtacha stress</div>
            </div>
            <div class="stat-card">
              <div class="stat-head">
                <div class="stat-icon" style="--c: var(--dash-green);">
                  <TrendingIcon />
                </div>
                <span class="stat-badge green">+ </span>
              </div>
              <div class="stat-num"><AnimatedNumber :value="totals.weekTests" /></div>
              <div class="stat-label">Bu hafta testlar</div>
            </div>
          </div>
        </section>

        <section class="row-2">
          <div class="panel">
            <h3 class="panel-title">Sinflar bo‘yicha holat</h3>
            <div v-if="loading" class="chart-skeleton" />
            <apexchart v-else type="bar" height="320" :options="classStatusOptions" :series="classStatusSeries" />
            <div v-if="!loading && classStatusSeries.length === 0" class="empty">Ma’lumotlar yo‘q.</div>
          </div>

          <div class="panel">
            <h3 class="panel-title">Stress taqsimoti</h3>
            <div v-if="loading" class="chart-skeleton" />
            <apexchart v-else type="donut" height="320" :options="stressOptions" :series="stressSeries" />
          </div>
        </section>

        <section class="row-2">
          <div class="panel">
            <h3 class="panel-title">Sinf bo‘yicha topshirish %</h3>
            <div v-if="loading" class="chart-skeleton" />
            <apexchart v-else type="bar" height="300" :options="completionOptions" :series="completionSeries" />
          </div>
          <div class="panel">
            <h3 class="panel-title">8 haftalik stress trend</h3>
            <div v-if="loading" class="chart-skeleton" />
            <apexchart v-else type="line" height="300" :options="trendOptions" :series="trendSeries" />
          </div>
        </section>

        <section class="section">
          <div class="panel-head">
            <h3 class="panel-title">Sinf tahlili — test topshirish holati</h3>
            <button type="button" class="excel-btn" :disabled="loading" @click="exportFullSchool">
              Maktab hisobotini yuklab olish
            </button>
          </div>

          <div v-if="loading" class="table-skeleton">
            <div class="skeleton skeleton-line" style="height: 16px;" v-for="i in 8" :key="i" />
          </div>

          <div v-else class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Sinf</th>
                  <th>Jami</th>
                  <th>Test topshirdi</th>
                  <th>Test topshirmadi</th>
                  <th>Qolgan</th>
                  <th>Topshirish %</th>
                  <th>O‘rtacha stress</th>
                  <th>Yuqori risk</th>
                  <th>Holat</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="c in classRows" :key="c.class_name">
                  <tr class="tr" @click="toggleClassExpand(c.class_name)">
                    <td>{{ c.class_name }}</td>
                    <td>{{ c.total_students }}</td>
                    <td>{{ c.tested_students }}</td>
                    <td>{{ c.not_tested }}</td>
                    <td>{{ c.remaining_to_test }}</td>
                    <td>
                      <div class="inline-progress">
                        <div class="progress" style="width: 160px;">
                          <div class="progress-fill" :style="{ width: c.completion_pct + '%' }" />
                        </div>
                        <span class="progress-txt">{{ c.completion_pct }}%</span>
                      </div>
                    </td>
                    <td><span class="pill" :class="stressPill(c.avg_stress)">{{ c.avg_stress }}%</span></td>
                    <td><span class="badge-risk red">{{ c.high_risk }}</span></td>
                    <td><span class="pill" :class="stressPill(c.avg_stress)">{{ riskLabel(c.avg_stress) }}</span></td>
                  </tr>
                  <tr v-if="expandedClass === c.class_name">
                    <td colspan="9">
                      <div class="expand-wrap">
                        <div class="muted">Sinfdadieshi o‘quvchilar</div>
                        <table class="table inner">
                          <thead>
                            <tr>
                              <th>Ism</th>
                              <th>Yosh</th>
                              <th>Test soni</th>
                              <th>Stress %</th>
                              <th>Portret</th>
                              <th>Oxirgi test</th>
                              <th>Risk</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="s in studentsByClass(c.class_name)" :key="s.student_id">
                              <td>{{ s.full_name }}</td>
                              <td>{{ s.age }}</td>
                              <td>{{ s.tests_taken }}</td>
                              <td><span class="pill" :class="stressPill(s.avg_stress)">{{ s.avg_stress || 0 }}%</span></td>
                              <td>{{ s.personality_types || '—' }}</td>
                              <td>{{ formatDate(s.last_test_date) }}</td>
                              <td><span class="pill" :class="riskBadgeClass(s.risk_level)">{{ riskBadgeText(s.risk_level) }}</span></td>
                            </tr>
                            <tr v-if="!studentsByClass(c.class_name).length">
                              <td colspan="7" class="muted">O‘quvchilar yo‘q.</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                </template>
                <tr v-if="!classRows.length">
                  <td colspan="9" class="muted">Sinflar yo‘q.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="section">
          <div class="panel-head">
            <h3 class="panel-title">O‘quvchilar jadvali</h3>
            <button type="button" class="excel-btn small" :disabled="loading" @click="exportFilteredStudents">
              Filtrlangan o‘quvchilar
            </button>
          </div>

          <div class="table-tools">
            <input v-model="studentSearch" class="input" placeholder="Qidirish (ism yoki Student ID)" />
            <select v-model="studentClass" class="select">
              <option value="all">Barcha sinflar</option>
              <option v-for="n in allClassNames" :key="n" :value="n">{{ n }}</option>
            </select>
            <select v-model="studentRisk" class="select">
              <option value="all">Barchasi</option>
              <option value="high">Yuqori</option>
              <option value="medium">O‘rta</option>
              <option value="low">Past</option>
              <option value="not_tested">Test yo‘q</option>
            </select>
            <select v-model="studentStatus" class="select">
              <option value="all">Barchasi</option>
              <option value="tested">Topshirgan</option>
              <option value="not_tested">Topshirmagan</option>
            </select>
          </div>

          <div v-if="loading" class="table-skeleton">
            <div class="skeleton skeleton-line" style="height: 16px;" v-for="i in 10" :key="i" />
          </div>

          <div v-else class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student ID</th>
                  <th>Ism</th>
                  <th>Yosh</th>
                  <th>Sinf</th>
                  <th>Testlar</th>
                  <th>Stress %</th>
                  <th>Portret</th>
                  <th>Risk</th>
                  <th>Oxirgi test</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(s, i) in pagedStudents" :key="s.student_id" class="tr" @click="openStudent(s)">
                  <td>{{ (studentsPage - 1) * 25 + i + 1 }}</td>
                  <td><code>{{ s.student_code }}</code></td>
                  <td>{{ s.full_name }}</td>
                  <td>{{ s.age }}</td>
                  <td>{{ s.class_name }}</td>
                  <td>{{ s.tests_taken }}</td>
                  <td><span class="pill" :class="stressPill(s.avg_stress)">{{ s.avg_stress || 0 }}%</span></td>
                  <td>{{ s.personality_types || '—' }}</td>
                  <td><span class="pill" :class="riskBadgeClass(s.risk_level)">{{ riskBadgeText(s.risk_level) }}</span></td>
                  <td>{{ formatDate(s.last_test_date) }}</td>
                </tr>
                <tr v-if="!pagedStudents.length">
                  <td colspan="10" class="muted">O‘quvchilar topilmadi.</td>
                </tr>
              </tbody>
            </table>
            <div class="pagination">
              <button type="button" class="pager" :disabled="studentsPage <= 1" @click="studentsPage--">Oldingi</button>
              <div class="pager-info">{{ studentsPage }} / {{ pages }}</div>
              <button type="button" class="pager" :disabled="studentsPage >= pages" @click="studentsPage++">Keyingi</button>
            </div>
          </div>
        </section>

        <!-- Slide-over -->
        <div v-if="slideOpen" class="slide-overlay" @click.self="slideOpen = false">
          <div class="slide-over">
            <div class="slide-head">
              <div>
                <div class="slide-title">{{ selectedStudent?.full_name || '—' }}</div>
                <div class="slide-sub">{{ selectedStudent?.class_name || '' }} • <span class="pill" :class="riskBadgeClass(selectedStudent?.risk_level)">{{ riskBadgeText(selectedStudent?.risk_level) }}</span></div>
              </div>
              <button type="button" class="icon-btn" @click="slideOpen = false">✕</button>
            </div>

            <div class="slide-body" v-if="selectedStudent">
              <div class="slide-block">
                <h4>Shaxsiy ma’lumotlar</h4>
                <div class="kv"><span>Yosh</span><b>{{ selectedStudent.age }}</b></div>
                <div class="kv"><span>Telefon</span><b>{{ selectedStudent.phone || '—' }}</b></div>
                <div class="kv"><span>Maktab</span><b>{{ selectedStudent.school_name || '' }}</b></div>
                <div class="kv"><span>Ro‘yxatdan sanasi</span><b>{{ formatDate(selectedStudent.created_at) }}</b></div>
              </div>

              <div class="slide-block">
                <h4>Test tarixi</h4>
                <div v-if="historyLoading" class="skeleton" style="height: 120px;" />
                <div v-else-if="!studentHistory.length" class="muted">Test natijalari yo‘q.</div>
                <div v-else class="history-list">
                  <div v-for="h in studentHistory" :key="h.id" class="history-item">
                    <div class="history-top">
                      <b>{{ testTypeText(h.test_type) }}</b>
                      <span class="muted">{{ formatDate(h.completed_at) }}</span>
                    </div>
                    <div class="score-row">
                      <div class="score-bar">
                        <div class="progress-fill" :style="{ width: (h.total_score || 0) + '%' }" />
                      </div>
                      <div class="score-txt">{{ h.total_score || 0 }}%</div>
                    </div>
                    <div class="muted" v-if="h.result_label">Natija: {{ h.result_label }}</div>
                    <div class="muted" v-if="h.ai_recommendation" style="margin-top: 6px;">
                      AI tavsiya: {{ h.ai_recommendation }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="slide-block">
                <h4>Ota-ona ma’lumotlari</h4>
                <div class="muted">Telefon: <b>{{ selectedStudent.phone || '—' }}</b></div>
              </div>
            </div>
          </div>
        </div>

        <section class="section">
          <details class="high-risk-details" open>
            <summary class="high-risk-summary">
              🔴 Yuqori risk o‘quvchilar — darhol e’tibor zarur (stress > 60%)
            </summary>

            <div v-if="loading" class="table-skeleton">
              <div class="skeleton skeleton-line" style="height: 16px;" v-for="i in 6" :key="i" />
            </div>

            <div v-else class="risk-high-wrap">
              <table class="table inner">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Ism</th>
                    <th>Sinf</th>
                    <th>Stress %</th>
                    <th>Oxirgi test</th>
                    <th>Ota-ona tel</th>
                    <th>Amal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(r, i) in highRiskStudents" :key="r.student_id" class="tr">
                    <td>{{ i + 1 }}</td>
                    <td>{{ r.full_name }}</td>
                    <td>{{ r.class_name }}</td>
                    <td><span class="pill red">{{ r.avg_stress }}%</span></td>
                    <td>{{ formatDate(r.last_test_date) }}</td>
                    <td>{{ r.phone || '—' }}</td>
                    <td>
                      <button type="button" class="excel-btn small" @click="onConnect(r)">
                        Bog‘landi
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!highRiskStudents.length">
                    <td colspan="7" class="muted">Hozircha yuqori riskli o‘quvchilar yo‘q.</td>
                  </tr>
                </tbody>
              </table>

              <div class="panel-foot" style="justify-content: flex-start;">
                <button type="button" class="excel-btn small" :disabled="loading" @click="exportHighRisk">
                  Yuqori risk hisoboti
                </button>
              </div>
            </div>
          </details>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, h, onMounted, reactive, ref, watch } from "vue";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/auth";
import { useThemeStore } from "../../stores/theme.js";
import PsychologistSidebar from "../../components/layout/PsychologistSidebar.vue";
import MobileHeader from "../../components/layout/MobileHeader.vue";
import { useExcelExport } from "../../composables/useExcelExport";
import { useCountUp } from "../../composables/useCountUp";
import {
  buildClassBreakdownForSchool,
  buildResultsByUser,
  buildSchoolStatsRow,
  buildStudentFullRows,
  buildWeeklyStressTrend,
  fetchResultsForUserIds,
  mapResultRowForHistory,
} from "../../lib/legacyDashboardMetrics";

const UsersIcon = {
  render: () =>
    h(
      "svg",
      { viewBox: "0 0 24 24", width: "18", height: "18", fill: "none", stroke: "currentColor", "stroke-width": "2" },
      [
        h("path", { d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }),
        h("circle", { cx: "9", cy: "7", r: "4" }),
      ],
    ),
};
const CheckIcon = {
  render: () =>
    h(
      "svg",
      { viewBox: "0 0 24 24", width: "18", height: "18", fill: "none", stroke: "currentColor", "stroke-width": "2" },
      [h("path", { d: "M20 6 9 17l-5-5" })],
    ),
};
const ClockIcon = {
  render: () =>
    h(
      "svg",
      { viewBox: "0 0 24 24", width: "18", height: "18", fill: "none", stroke: "currentColor", "stroke-width": "2" },
      [h("circle", { cx: "12", cy: "12", r: "10" }), h("path", { d: "M12 6v6l4 2" })],
    ),
};
const AlertIcon = {
  render: () =>
    h(
      "svg",
      { viewBox: "0 0 24 24", width: "18", height: "18", fill: "none", stroke: "currentColor", "stroke-width": "2" },
      [
        h("path", {
          d: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z",
        }),
        h("line", { x1: "12", y1: "9", x2: "12", y2: "13" }),
        h("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" }),
      ],
    ),
};
const ActivityIcon = {
  render: () =>
    h(
      "svg",
      { viewBox: "0 0 24 24", width: "18", height: "18", fill: "none", stroke: "currentColor", "stroke-width": "2" },
      [h("path", { d: "M3 17l6-6 4 4 8-8" }), h("path", { d: "M14 7h7v7" })],
    ),
};
const TrendingIcon = {
  render: () =>
    h(
      "svg",
      { viewBox: "0 0 24 24", width: "18", height: "18", fill: "none", stroke: "currentColor", "stroke-width": "2" },
      [h("path", { d: "M3 17l6-6 4 4 8-8" }), h("path", { d: "M14 7h7v7" })],
    ),
};

const authStore = useAuthStore();
const themeStore = useThemeStore();
const { exportSchoolReport } = useExcelExport();

const loading = ref(true);
const studentHistory = ref([]);
const historyLoading = ref(false);

const formattedNow = ref(new Date().toLocaleDateString("uz-UZ", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));

function initials(name) {
  const parts = String(name).trim().split(/\s+/);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || parts[0]?.[1] || "";
  return (a + b).toUpperCase();
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("uz-UZ");
  } catch {
    return iso;
  }
}

function stressPill(avg) {
  const x = Number(avg || 0);
  if (x >= 60) return "red";
  if (x >= 30) return "amber";
  return "green";
}
function riskBadgeClass(risk) {
  if (risk === "high") return "red";
  if (risk === "medium") return "amber";
  if (risk === "low") return "green";
  return "muted";
}
function riskBadgeText(risk) {
  if (risk === "high") return "Yuqori";
  if (risk === "medium") return "O‘rta";
  if (risk === "low") return "Past";
  return "Test yo‘q";
}
function riskLabel(avg) {
  const x = Number(avg || 0);
  if (x >= 60) return "Yuqori";
  if (x >= 30) return "O'rta";
  return "Normal";
}

function testTypeText(t) {
  if (t === "psychological") return "Psixologik";
  if (t === "portrait") return "Portret";
  return t || "—";
}

const schoolId = computed(() => authStore.currentUser?.school_id ?? null);

const totals = reactive({
  students: 0,
  testedStudents: 0,
  notTestedStudents: 0,
  highRiskCount: 0,
  avgStress: 0,
  completionRate: 0,
  weekTests: 0,
});

const AnimatedNumber = {
  props: {
    value: Number,
  },
  setup(props) {
    const shown = useCountUp(props.value ?? 0, 1500, 0);
    return { shown };
  },
  template: `<span>{{ shown }}</span>`,
};

const completionPctBadge = computed(() => {
  return Math.round(totals.completionRate || 0) + "%";
});

const classRows = ref([]);
const studentsAll = ref([]);
const classExpanded = ref(null);
const expandedClass = computed(() => classExpanded.value);

function toggleClassExpand(cName) {
  classExpanded.value = expandedClass.value === cName ? null : cName;
}

function studentsByClass(cName) {
  return studentsAll.value.filter((s) => s.class_name === cName);
}

const allClassNames = computed(() => {
  const set = new Set(studentsAll.value.map((s) => s.class_name).filter(Boolean));
  return [...set].sort();
});

// Charts (simplified)
const classStatusSeries = computed(() => {
  const classes = classRows.value.slice(0, 8);
  if (!classes.length) return [];
  return [
    { name: "Jami", data: classes.map((c) => c.total_students || 0) },
    { name: "Topshirdi", data: classes.map((c) => c.tested_students || 0) },
    { name: "Topshirmadi", data: classes.map((c) => c.not_tested || 0) },
  ];
});

const classStatusOptions = computed(() => ({
  chart: { background: "transparent", toolbar: { show: false }, animations: { enabled: true, speed: 800 } },
  theme: { mode: "dark" },
  colors: ["#94A3B8", "#00e5a0", "#ef4444"],
  plotOptions: { bar: { borderRadius: 10, columnWidth: "40%" } },
  dataLabels: { enabled: true },
  grid: { borderColor: "rgba(255,255,255,0.06)" },
  xaxis: { categories: classRows.value.slice(0, 8).map((c) => c.class_name), labels: { style: { colors: "rgba(255,255,255,0.5)" } } },
  legend: { labels: { colors: "rgba(255,255,255,0.65)" } },
  tooltip: { theme: "dark" },
}));

const stressSeries = computed(() => {
  // derived from studentsAll avg stress distribution for this school
  const lows = studentsAll.value.filter((s) => Number(s.avg_stress || 0) < 30).length;
  const meds = studentsAll.value.filter((s) => Number(s.avg_stress || 0) >= 30 && Number(s.avg_stress || 0) <= 60).length;
  const highs = studentsAll.value.filter((s) => Number(s.avg_stress || 0) > 60).length;
  return [lows, meds, highs];
});

const stressOptions = computed(() => ({
  chart: { background: "transparent", toolbar: { show: false }, animations: { enabled: true, speed: 800 } },
  theme: { mode: "dark" },
  colors: ["#00e5a0", "#f59e0b", "#ef4444"],
  labels: ["Past", "O'rta", "Yuqori"],
  dataLabels: { enabled: false },
  legend: { position: "bottom", labels: { colors: "rgba(255,255,255,0.65)" } },
  plotOptions: { pie: { donut: { size: "60%" } } },
}));

const completionSeries = computed(() => {
  const classes = classRows.value.slice(0, 10);
  if (!classes.length) return [];
  return [{ name: "Completion", data: classes.map((c) => c.completion_pct || 0) }];
});
const completionOptions = computed(() => ({
  chart: { background: "transparent", toolbar: { show: false }, animations: { enabled: true, speed: 800 } },
  theme: { mode: "dark" },
  colors: ["#00e5a0"],
  plotOptions: { bar: { horizontal: true, barHeight: "70%", borderRadius: 10 } },
  xaxis: { categories: [], labels: { show: false } },
  yaxis: { categories: classRows.value.slice(0, 10).map((c) => c.class_name) },
  tooltip: { theme: "dark" },
  dataLabels: { enabled: true, style: { colors: ["#fff"] } },
}));

const trendXCategories = ref([]);
const trendSeries = ref([]);
const trendOptions = computed(() => ({
  chart: { background: "transparent", toolbar: { show: false }, animations: { enabled: true, speed: 800 } },
  theme: { mode: "dark" },
  colors: ["#00e5a0"],
  stroke: { curve: "smooth", width: 3 },
  fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.04 } },
  grid: { borderColor: "rgba(255,255,255,0.06)" },
  xaxis: {
    categories: trendXCategories.value,
    labels: { style: { colors: "rgba(255,255,255,0.5)" } },
  },
  legend: { show: false },
  tooltip: { theme: "dark" },
}));

const slideOpen = ref(false);
const selectedStudent = ref(null);

const studentSearch = ref("");
const studentClass = ref("all");
const studentRisk = ref("all");
const studentStatus = ref("all");
const studentsPage = ref(1);
const pageSize = 25;
const pages = computed(() => Math.max(1, Math.ceil(studentsFiltered.value.length / pageSize)));

const studentsFiltered = computed(() => {
  let rows = [...studentsAll.value];
  const q = studentSearch.value.trim().toLowerCase();
  if (q) {
    rows = rows.filter((s) => String(s.full_name || "").toLowerCase().includes(q) || String(s.student_code || "").toLowerCase().includes(q));
  }
  if (studentClass.value !== "all") rows = rows.filter((s) => s.class_name === studentClass.value);
  if (studentRisk.value !== "all") rows = rows.filter((s) => s.risk_level === studentRisk.value);
  if (studentStatus.value === "tested") rows = rows.filter((s) => (s.tests_taken || 0) > 0);
  if (studentStatus.value === "not_tested") rows = rows.filter((s) => !(s.tests_taken || 0));
  // Sort by stress desc
  rows.sort((a, b) => (Number(b.avg_stress || 0) - Number(a.avg_stress || 0)) || String(a.full_name || "").localeCompare(String(b.full_name || "")));
  return rows;
});

const pagedStudents = computed(() => {
  const start = (studentsPage.value - 1) * pageSize;
  return studentsFiltered.value.slice(start, start + pageSize);
});

const highRiskStudents = computed(() => studentsFiltered.value.filter((s) => Number(s.avg_stress || 0) > 60).slice(0, 10));

watch([studentSearch, studentClass, studentRisk, studentStatus], () => {
  studentsPage.value = 1;
});

async function openStudent(s) {
  selectedStudent.value = s;
  slideOpen.value = true;
  historyLoading.value = true;
  studentHistory.value = [];
  try {
    const uid = s.id;
    if (!uid) return;
    const { data, error } = await supabase
      .from("results")
      .select("id, taken_at, total_score, test_type, risk_level, personality_type, ai_explanation, ai_professional")
      .eq("user_id", uid)
      .order("taken_at", { ascending: false });
    if (error) throw error;
    studentHistory.value = (data || []).map(mapResultRowForHistory);
  } catch {
    // ignore
  } finally {
    historyLoading.value = false;
  }
}

async function onConnect(row) {
  alert(`Bog‘landi: ${row.full_name} (telefon: ${row.phone || "—"})`);
}

async function exportFullSchool() {
  try {
    const schoolNameRow = classRows.value[0]?.school_name;
    const schoolName = schoolNameRow || "Maktab";
    const overview = {
      totalStudents: totals.students,
      testedStudents: totals.testedStudents,
      notTested: totals.notTestedStudents,
      completionRate: totals.completionRate,
      avgStress: totals.avgStress,
      highRisk: totals.highRiskCount,
      mediumRisk: 0,
      lowRisk: 0,
    };
    const data = {
      ...overview,
      classes: classRows.value.map((c) => ({
        class_name: c.class_name,
        total_students: c.total_students,
        tested_students: c.tested_students,
        not_tested: c.not_tested,
        remaining_to_test: c.remaining_to_test,
        completion_pct: c.completion_pct,
        avg_stress: c.avg_stress,
        high_risk: c.high_risk,
        medium_risk: 0,
        low_risk: 0,
        completion_pct: c.completion_pct,
      })),
      students: studentsAll.value.map((s) => ({
        student_code: s.student_code,
        full_name: s.full_name,
        age: s.age,
        class_name: s.class_name,
        school_name: s.school_name,
        tests_taken: s.tests_taken,
        avg_stress: s.avg_stress,
        last_test_date: s.last_test_date,
        personality_types: s.personality_types,
        risk_level: s.risk_level,
      })),
      highRiskStudents: highRiskStudents.value.map((s) => ({
        full_name: s.full_name,
        class_name: s.class_name,
        avg_stress: s.avg_stress,
        last_test_date: s.last_test_date,
        parent_phone: s.phone,
      })),
      testHistory: [],
    };
    exportSchoolReport(schoolName, data);
    alert("Maktab hisobot yuklab olindi.");
  } catch {
    alert("Excel eksportida xatolik.");
  }
}

async function exportFilteredStudents() {
  await exportFullSchool();
}

async function exportHighRisk() {
  await exportFullSchool();
}

onMounted(async () => {
  loading.value = true;
  try {
    if (!supabase) return;
    if (!schoolId.value) return;

    const sid = schoolId.value;
    const { data: schoolRow, error: eSch } = await supabase.from("schools").select("*").eq("id", sid).maybeSingle();
    if (eSch || !schoolRow) return;

    const { data: studentsData, error: eStu } = await supabase
      .from("users")
      .select("id, student_id, full_name, age, class_name, school_id, phone, created_at, role")
      .eq("role", "student")
      .eq("school_id", sid);
    if (eStu) throw eStu;
    const students = studentsData || [];
    const studentIds = students.map((u) => u.id);

    const results = await fetchResultsForUserIds(supabase, studentIds);
    const byUser = buildResultsByUser(results);
    const schoolMap = new Map([[schoolRow.id, schoolRow]]);

    const stats = buildSchoolStatsRow(schoolRow, students, byUser);
    totals.students = stats.total_students;
    totals.testedStudents = stats.tested_students;
    totals.notTestedStudents = stats.not_tested_students;
    totals.highRiskCount = stats.high_risk_count;
    totals.avgStress = stats.avg_stress;
    totals.completionRate = stats.completion_rate;

    classRows.value = buildClassBreakdownForSchool(schoolRow, students, byUser);
    studentsAll.value = buildStudentFullRows(students, schoolMap, byUser);

    const weekAgoMs = Date.now() - 7 * 86400000;
    totals.weekTests = results.filter((r) => r.taken_at && new Date(r.taken_at).getTime() >= weekAgoMs).length;

    const idSet = new Set(studentIds);
    const trend = buildWeeklyStressTrend(results, idSet, 8);
    trendXCategories.value = trend.cats;
    trendSeries.value = trend.series;
  } catch {
    // silent
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.psych-dashboard-page {
  background: var(--dash-bg);
  min-height: 100vh;
  color: var(--dash-text);
  display: flex;
}
.psych-main {
  min-height: 100vh;
  padding: 20px 24px 40px;
  flex: 1;
}

.psych-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 14px;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  background: linear-gradient(140deg, rgba(22, 24, 42, 0.84), rgba(18, 20, 36, 0.62));
  margin-bottom: 16px;
  backdrop-filter: blur(14px);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.24);
}
.topbar-title {
  margin: 0;
  font-size: 1.15rem;
}
.topbar-sub {
  margin-top: 2px;
  color: rgba(255,255,255,0.45);
}
.psych-content {
  max-width: 1400px;
  margin: 0 auto;
}

.section { margin-bottom: 22px; }
.section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }

.stats-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.stats-grid-2 { grid-template-columns: repeat(3, minmax(0, 1fr)); }

.stat-card {
  background: linear-gradient(165deg, rgba(23, 25, 44, 0.92), rgba(18, 20, 36, 0.88));
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 14px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.24);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.stat-card:hover {
  transform: translateY(-3px);
  border-color: rgba(129, 140, 248, 0.36);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.32);
}
.stat-head { display: flex; justify-content: space-between; align-items: center; }
.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.03);
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.95);
}
.stat-badge {
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 900;
  background: rgba(255,255,255,0.04);
}
.stat-badge.green { background: rgba(0,229,160,0.14); color: var(--dash-green); border: 1px solid rgba(0,229,160,0.35); }
.stat-badge.amber { background: rgba(245,158,11,0.14); color: var(--dash-amber); border: 1px solid rgba(245,158,11,0.35); }
.stat-badge.red { background: rgba(239,68,68,0.14); color: var(--dash-red); border: 1px solid rgba(239,68,68,0.35); }
.stat-badge.cyan { background: rgba(6,182,212,0.14); color: var(--dash-cyan); border: 1px solid rgba(6,182,212,0.35); }
.stat-badge.purple { background: rgba(99,102,241,0.14); color: var(--dash-purple); border: 1px solid rgba(99,102,241,0.35); }

.stat-num { margin-top: 12px; font-size: 2rem; font-weight: 900; }
.stat-label { margin-top: 4px; color: rgba(255,255,255,0.45); font-weight: 700; }

.row-2 { display: grid; grid-template-columns: 50% 50%; gap: 14px; }
.panel {
  background: linear-gradient(160deg, rgba(22, 24, 42, 0.92), rgba(18, 20, 36, 0.85));
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.28);
  padding: 16px;
}
.panel-title { margin: 0 0 10px; font-size: 1rem; }
.chart-skeleton { height: 300px; border-radius: 16px; background: rgba(255,255,255,0.03); }
.empty { color: rgba(255,255,255,0.45); text-align: center; margin-top: 8px; }

.table-wrap { overflow: auto; }
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}
.table thead th {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.65);
}
.table tbody td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.tr:hover { background: rgba(99,102,241,0.1); }
.muted { color: rgba(255,255,255,0.45); }

.inline-progress { display: flex; align-items: center; gap: 10px; }
.progress {
  position: relative;
  width: 160px;
  height: 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(0,229,160,0.85), rgba(99,102,241,0.85));
  width: 0%;
}
.progress-txt { width: 52px; text-align: right; color: rgba(255,255,255,0.65); font-weight: 900; }

.pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 900;
  border: 1px solid rgba(255,255,255,0.08);
}
.pill.green { background: rgba(0,229,160,0.14); color: var(--dash-green); border-color: rgba(0,229,160,0.35); }
.pill.amber { background: rgba(245,158,11,0.14); color: var(--dash-amber); border-color: rgba(245,158,11,0.35); }
.pill.red { background: rgba(239,68,68,0.14); color: var(--dash-red); border-color: rgba(239,68,68,0.35); }
.pill.muted { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.55); border-color: rgba(255,255,255,0.08); }

.badge-risk {
  font-weight: 900;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.07);
}
.badge-risk.red { background: rgba(239,68,68,0.14); color: var(--dash-red); border-color: rgba(239,68,68,0.35); }

.table-tools {
  display: grid;
  grid-template-columns: 1fr 220px 180px 180px;
  gap: 10px;
  margin-bottom: 10px;
}
.input, .select {
  width: 100%;
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(13, 16, 30, 0.65);
  color: rgba(255,255,255,0.92);
  padding: 0 12px;
}
.select { cursor: pointer; }
.input:focus, .select:focus {
  border-color: rgba(129, 140, 248, 0.55);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
}

.excel-btn {
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(129,140,248,0.42);
  background: rgba(99,102,241,0.2);
  color: rgba(255,255,255,0.95);
  font-weight: 900;
  cursor: pointer;
}
.excel-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: rgba(99,102,241,0.26);
}
.excel-btn.small { padding: 8px 12px; font-size: 0.9rem; }

.pagination { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 10px 0; }
.pager {
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(19,19,31,0.3);
  color: rgba(255,255,255,0.85);
  cursor: pointer;
}
.pager:disabled { opacity: 0.5; cursor: not-allowed; }
.pager-info { color: rgba(255,255,255,0.6); font-weight: 800; }

.slide-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  justify-content: flex-end;
  z-index: 1000;
}
.slide-over {
  width: 420px;
  height: 100%;
  background: linear-gradient(170deg, rgba(17, 19, 34, 0.98), rgba(13, 15, 28, 0.98));
  border-left: 1px solid rgba(255,255,255,0.09);
  animation: slideOverOpen 0.35s var(--ease);
  padding: 16px;
  overflow: auto;
}
.slide-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}
.slide-title { font-weight: 900; font-size: 1.05rem; }
.slide-sub { color: rgba(255,255,255,0.45); margin-top: 6px; }
.slide-body { display: flex; flex-direction: column; gap: 14px; }
.slide-block {
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 12px;
  background: rgba(19,19,31,0.5);
}
.slide-block h4 { margin: 0 0 10px; font-size: 0.98rem; }
.kv { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
.kv:last-child { border-bottom: 0; }
.history-list { display: flex; flex-direction: column; gap: 10px; }
.history-item { border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 10px; background: rgba(19,19,31,0.4); }
.history-top { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 8px; }
.score-row { display: flex; align-items: center; gap: 10px; }
.score-bar { flex: 1; height: 10px; border-radius: 999px; background: rgba(255,255,255,0.06); overflow: hidden; }
.score-txt { width: 58px; text-align: right; font-weight: 900; }
.score-bar .progress-fill { height: 100%; background: linear-gradient(90deg, rgba(0,229,160,0.85), rgba(99,102,241,0.85)); }

.high-risk-details {
  border: 1px solid rgba(239,68,68,0.25);
  border-radius: 16px;
  background: rgba(19,19,31,0.4);
  padding: 10px 14px;
}
.high-risk-summary {
  cursor: pointer;
  font-weight: 900;
  color: rgba(255,255,255,0.95);
}

.risk-high-wrap { margin-top: 10px; }

@media (max-width: 1200px) {
  .row-2 { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .stats-grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .table-tools { grid-template-columns: 1fr 1fr; }
  .psych-main { margin-left: 0; padding: 14px; }
}

@media (max-width: 520px) {
  .stats-grid, .stats-grid-2 { grid-template-columns: 1fr; }
  .table-tools { grid-template-columns: 1fr; }
  .slide-over { width: 100%; }
}
</style>

