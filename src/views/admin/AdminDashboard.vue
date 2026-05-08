<template>
  <div class="admin-dashboard-page" :data-theme="themeStore.mode">
    <AdminSidebar />

    <main class="admin-main">
      <MobileHeader />

      <header class="admin-topbar">
        <div class="topbar-left">
          <h1 class="topbar-title">Admin Panel</h1>
          <div class="topbar-sub">{{ formattedNow }}</div>
        </div>

        <div class="topbar-right">
          <button type="button" class="icon-btn" aria-label="Bildirishnomalar" @click="onNotifications">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
          <div class="admin-avatar" aria-label="Admin">
            <span class="avatar-dot" />
            {{ authStore.currentUser?.full_name ? initials(authStore.currentUser.full_name) : "Admin" }}
          </div>
        </div>
      </header>

      <div class="admin-content">
        <section class="section">
          <div class="section-head">
            <h2>Umumiy ko‘rsatkichlar</h2>
            <div class="range">
              <button type="button" class="range-btn" :class="{ active: rangeDays === 7 }" @click="rangeDays = 7">7 kun</button>
              <button type="button" class="range-btn" :class="{ active: rangeDays === 30 }" @click="rangeDays = 30">30 kun</button>
              <button type="button" class="range-btn" :class="{ active: rangeDays === 90 }" @click="rangeDays = 90">90 kun</button>
            </div>
          </div>

          <div v-if="loading" class="grid-skeleton">
            <div v-for="i in 8" :key="i" class="stat-card sk-card">
              <div class="skeleton skeleton-line" />
              <div class="skeleton skeleton-num" />
              <div class="skeleton skeleton-mini" />
            </div>
          </div>

          <template v-else>
            <div class="stats-grid">
              <StatCard
                color="purple"
                icon-color="var(--dash-purple)"
                label="O'quvchilar"
                :value="totals.students"
                badge="+" :badge-color="'green'"
                :spark-series="sparks.studentsSeries"
                :spark-options="sparks.studentsOptions"
              />
              <StatCard
                color="green"
                icon-color="var(--dash-green)"
                label="Testlar"
                :value="totals.tests"
                badge="+" :badge-color="'green'"
                :spark-series="sparks.testsSeries"
                :spark-options="sparks.testsOptions"
              />
              <StatCard
                color="cyan"
                icon-color="var(--dash-cyan)"
                label="Maktablar"
                :value="totals.schools"
                badge="—" :badge-color="'amber'"
                :spark-series="sparks.schoolsSeries"
                :spark-options="sparks.schoolsOptions"
              />
              <StatCard
                color="amber"
                icon-color="var(--dash-amber)"
                label="O'rtacha stress"
                :value="totals.avgStress"
                badge="↑" :badge-color="totals.avgStressTrend >= 0 ? 'green' : 'red'"
                :spark-series="sparks.stressSeries"
                :spark-options="sparks.stressOptions"
              />
            </div>

            <div class="stats-grid stats-grid-2">
              <StatCard
                color="cyan"
                icon-color="var(--dash-cyan)"
                label="Bugun testlar"
                :value="totals.todayTests"
                badge="+" :badge-color="'green'"
                :spark-series="sparks.todayTestsSpark"
                :spark-options="sparks.todayTestsOptions"
              />
              <StatCard
                color="red"
                icon-color="var(--dash-red)"
                label="Yuqori risk"
                :value="totals.highRiskCount"
                badge="!" :badge-color="'red'"
                :spark-series="sparks.highRiskSeries"
                :spark-options="sparks.highRiskOptions"
              />
              <StatCard
                color="green"
                icon-color="var(--dash-green)"
                label="Bu hafta yangi"
                :value="totals.weeklyNewStudents"
                badge="+" :badge-color="'green'"
                :spark-series="sparks.weeklyNewSeries"
                :spark-options="sparks.weeklyNewOptions"
              />
              <StatCard
                color="purple"
                icon-color="var(--dash-purple)"
                label="Psixologlar"
                :value="totals.psychologists"
                badge="—" :badge-color="'amber'"
                :spark-series="sparks.psychSeries"
                :spark-options="sparks.psychOptions"
              />
            </div>
          </template>
        </section>

        <section class="section">
          <div class="section-head">
            <h2>Platforma faolligi</h2>
            <div class="range inline">
              <button type="button" class="range-btn" :class="{ active: rangeDays === 7 }" @click="rangeDays = 7">7 kun</button>
              <button type="button" class="range-btn" :class="{ active: rangeDays === 30 }" @click="rangeDays = 30">30 kun</button>
              <button type="button" class="range-btn" :class="{ active: rangeDays === 90 }" @click="rangeDays = 90">90 kun</button>
            </div>
          </div>

          <div class="panel">
            <div v-if="loading" class="chart-skeleton" />
            <apexchart
              v-else
              type="area"
              height="360"
              :options="platformChartOptions"
              :series="platformChartSeries"
            />
            <div v-if="!loading && platformChartSeries.length === 0" class="empty">
              Ma’lumotlar yo‘q.
            </div>
          </div>
        </section>

        <section class="row-3">
          <div class="panel">
            <h3 class="panel-title">Maktablar solishtirmasi</h3>
            <div v-if="loading" class="chart-skeleton" />
            <apexchart
              v-else
              type="bar"
              height="300"
              :options="schoolCompareOptions"
              :series="schoolCompareSeries"
            />
            <div v-if="!loading && schoolCompareSeries.length === 0" class="empty">Ma’lumotlar yo‘q.</div>
          </div>

          <div class="panel">
            <h3 class="panel-title">Stress taqsimoti</h3>
            <div v-if="loading" class="chart-skeleton" />
            <apexchart
              v-else
              type="donut"
              height="300"
              :options="stressDonutOptions"
              :series="stressDonutSeries"
            />
            <div v-if="!loading && stressDonutSeries.length === 0" class="empty">Ma’lumotlar yo‘q.</div>
          </div>

          <div class="panel">
            <h3 class="panel-title">Test turlari</h3>
            <div v-if="loading" class="chart-skeleton" />
            <apexchart
              v-else
              type="bar"
              height="300"
              :options="testTypeOptions"
              :series="testTypeSeries"
            />
            <div v-if="!loading && testTypeSeries.length === 0" class="empty">Ma’lumotlar yo‘q.</div>
          </div>
        </section>

        <section class="row-2">
          <div class="panel">
            <div class="panel-head">
              <h3 class="panel-title">Maktablar reytingi</h3>
              <button type="button" class="excel-btn" :disabled="loading" @click="exportSchools">
                Excel yuklab olish
              </button>
            </div>

            <div class="table-tools">
              <input v-model="schoolSearch" class="input" placeholder="Qidirish (nom / kod)" />
              <select v-model="schoolFilter" class="select">
                <option value="all">Barcha maktablar</option>
                <option value="high">Yuqori risk &gt; 5</option>
                <option value="active">Faol</option>
              </select>
            </div>

            <div v-if="loading" class="table-skeleton">
              <div class="skeleton skeleton-line" style="height: 16px;" />
              <div class="skeleton skeleton-line" style="height: 16px;" />
              <div class="skeleton skeleton-line" style="height: 16px;" />
            </div>

            <div v-else class="table-wrap">
              <table class="table">
                <thead>
                  <tr>
                    <th class="th-s" @click="sortSchools('name')">
                      #/Maktab
                      <SortArrow :active="schoolSort.key === 'name'" :dir="schoolSort.dir" />
                    </th>
                    <th @click="sortSchools('total_students')">
                      O'quvchilar <SortArrow :active="schoolSort.key === 'total_students'" :dir="schoolSort.dir" />
                    </th>
                    <th @click="sortSchools('total_tests')">
                      Test topshirdi <SortArrow :active="schoolSort.key === 'total_tests'" :dir="schoolSort.dir" />
                    </th>
                    <th>Topshirmadi</th>
                    <th @click="sortSchools('completion_rate')">
                      Topshirish % <SortArrow :active="schoolSort.key === 'completion_rate'" :dir="schoolSort.dir" />
                    </th>
                    <th @click="sortSchools('avg_stress')">
                      Avg stress <SortArrow :active="schoolSort.key === 'avg_stress'" :dir="schoolSort.dir" />
                    </th>
                    <th>Yuqori risk</th>
                    <th>So'nggi faollik</th>
                    <th>Holat</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="(s, idx) in visibleSchools" :key="s.school_id">
                    <tr class="tr" @click="toggleSchoolExpand(s.school_id)">
                      <td class="td-left">
                        <div class="row-num">{{ String(idx + 1).padStart(2, '0') }}</div>
                        <div class="row-main">
                          <div class="row-title">{{ s.school_name }}</div>
                          <div class="row-sub"><code>{{ s.school_code }}</code></div>
                        </div>
                      </td>
                      <td>{{ s.total_students }}</td>
                      <td>{{ s.tested_students }}</td>
                      <td>{{ s.not_tested_students }}</td>
                      <td>
                        <div class="progress-cell">
                          <div class="progress" :style="{ '--target-width': s.completion_rate + '%' }">
                            <div class="progress-fill" :style="{ width: s.completion_rate + '%' }" />
                          </div>
                          <div class="progress-txt">{{ s.completion_rate }}%</div>
                        </div>
                      </td>
                      <td>
                        <span class="pill" :class="stressPill(s.avg_stress)">{{ s.avg_stress }}%</span>
                      </td>
                      <td>
                        <span class="badge-risk" :class="riskPill(s.high_risk_count)">{{ s.high_risk_count }}</span>
                      </td>
                      <td>{{ formatDate(s.last_activity) }}</td>
                      <td>
                        <span class="pill" :class="stressPill(s.avg_stress)">{{ riskLabelByStress(s.avg_stress) }}</span>
                      </td>
                    </tr>

                    <tr v-if="expandedSchoolId === s.school_id">
                      <td colspan="9">
                        <div class="expand-wrap">
                          <div class="expand-head">
                            <strong>Sinf breakdown</strong>
                          </div>
                          <table class="table inner">
                            <thead>
                              <tr>
                                <th>Sinf</th>
                                <th>Jami</th>
                                <th>Topshirdi</th>
                                <th>Topshirmadi</th>
                                <th>Qoldi</th>
                                <th>Completion</th>
                                <th>Avg stress</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="c in classBreakdownBySchool(s.school_id)" :key="c.class_name">
                                <td>{{ c.class_name }}</td>
                                <td>{{ c.total_students }}</td>
                                <td>{{ c.tested_students }}</td>
                                <td>{{ c.not_tested }}</td>
                                <td>{{ c.remaining_to_test }}</td>
                                <td>{{ c.completion_pct }}%</td>
                                <td><span class="pill" :class="stressPill(c.avg_stress)">{{ c.avg_stress || 0 }}%</span></td>
                              </tr>
                              <tr v-if="!classBreakdownBySchool(s.school_id).length">
                                <td colspan="7" class="muted">Sinflar yo‘q.</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
              <div v-if="!visibleSchools.length" class="empty">Maktablar topilmadi.</div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head">
              <h3 class="panel-title">Yuqori risk paneli</h3>
            </div>

            <div class="risk-panel">
              <div v-if="loading" class="risk-skeleton">
                <div class="skeleton skeleton-line" style="height: 18px;" v-for="i in 6" :key="i" />
              </div>

              <template v-else>
                <div v-if="highRiskList.length === 0" class="empty">Hozircha yuqori riskli o‘quvchi yo‘q.</div>
                <div v-else class="risk-list">
                  <div v-for="r in highRiskList" :key="r.student_id" class="risk-item">
                    <div class="risk-left">
                      <div class="risk-name">{{ r.full_name }}</div>
                      <div class="risk-meta">{{ r.class_name }} • {{ r.school_name }}</div>
                    </div>
                    <div class="risk-right">
                      <div class="risk-dot" :class="{ pulse: r.testedRecently }" />
                      <span class="badge-risk red">{{ r.avg_stress }}%</span>
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <div class="panel-foot">
              <button type="button" class="excel-btn small" :disabled="loading" @click="exportHighRisk">
                Excel
              </button>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="panel-head">
            <h3 class="panel-title">O'quvchilar jadvali</h3>
            <button type="button" class="excel-btn" :disabled="loading" @click="exportStudentsFiltered">
              Excel yuklab olish
            </button>
          </div>

          <div class="table-tools">
            <input v-model="studentsSearch" class="input" placeholder="Qidirish (ism yoki Student ID)" />
            <select v-model="studentsClassName" class="select">
              <option value="all">Barcha sinflar</option>
              <option v-for="n in studentClassOptions" :key="n" :value="n">{{ n }}</option>
            </select>
            <select v-model="studentsRisk" class="select">
              <option value="all">Barchasi</option>
              <option value="high">Yuqori</option>
              <option value="medium">O'rta</option>
              <option value="low">Past</option>
              <option value="not_tested">Test yo'q</option>
            </select>
            <select v-model="studentsStatus" class="select">
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
                  <th>Ism</th>
                  <th>Yosh</th>
                  <th>Sinf</th>
                  <th>Maktab</th>
                  <th>Testlar</th>
                  <th>Stress</th>
                  <th>Risk</th>
                  <th>Sana</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(s, i) in studentsPaged"
                  :key="s.student_id"
                  class="tr"
                  @click="openStudent(s)"
                >
                  <td>{{ (studentsPage - 1) * studentsPageSize + i + 1 }}</td>
                  <td>
                    <div class="row-title" style="display:flex;flex-direction:column;gap:4px;">
                      <span style="font-weight:900;">{{ s.full_name }}</span>
                      <code style="font-size:0.9rem;">{{ s.student_code }}</code>
                    </div>
                  </td>
                  <td>{{ s.age }}</td>
                  <td>{{ s.class_name }}</td>
                  <td>{{ s.school_name }}</td>
                  <td>{{ s.tests_taken || 0 }}</td>
                  <td><span class="pill" :class="stressPill(s.avg_stress)">{{ s.avg_stress || 0 }}%</span></td>
                  <td><span class="pill" :class="riskBadgeFromLevel(s.risk_level)">{{ riskLabelFromLevel(s.risk_level) }}</span></td>
                  <td>{{ formatDate(s.created_at) }}</td>
                </tr>
                <tr v-if="!studentsPaged.length">
                  <td colspan="9" class="muted">O'quvchilar topilmadi.</td>
                </tr>
              </tbody>
            </table>

            <div class="pagination">
              <button type="button" class="pager" :disabled="studentsPage <= 1" @click="studentsPage--">Oldingi</button>
              <div class="pager-info">{{ studentsPage }} / {{ studentsPages }}</div>
              <button type="button" class="pager" :disabled="studentsPage >= studentsPages" @click="studentsPage++">Keyingi</button>
            </div>
          </div>
        </section>

        <div v-if="slideOpen" class="slide-overlay" @click.self="slideOpen = false">
          <div class="slide-over">
            <div class="slide-head">
              <div>
                <div class="slide-title">{{ selectedStudent?.full_name || '—' }}</div>
                <div class="slide-sub">
                  {{ selectedStudent?.class_name || '' }} •
                  <span class="pill" :class="riskBadgeFromLevel(selectedStudent?.risk_level)">{{ riskLabelFromLevel(selectedStudent?.risk_level) }}</span>
                </div>
              </div>
              <button type="button" class="icon-btn" @click="slideOpen = false">✕</button>
            </div>

            <div class="slide-body" v-if="selectedStudent">
              <div class="slide-block">
                <h4>Shaxsiy ma'lumotlar</h4>
                <div class="kv"><span>Yosh</span><b>{{ selectedStudent.age }}</b></div>
                <div class="kv"><span>Telefon</span><b>{{ selectedStudent.phone || '—' }}</b></div>
                <div class="kv"><span>Maktab</span><b>{{ selectedStudent.school_name || '—' }}</b></div>
                <div class="kv"><span>Ro'yxatdan sanasi</span><b>{{ formatDate(selectedStudent.created_at) }}</b></div>
              </div>

              <div class="slide-block">
                <h4>Test tarixi</h4>
                <div v-if="studentHistory.length === 0" class="muted">Test natijalari yo'q.</div>
                <div v-else class="history-list">
                  <div v-for="h in studentHistory" :key="h.id" class="history-item">
                    <div class="history-top">
                      <b>{{ h.test_type === 'psychological' ? 'Psixologik' : h.test_type === 'portrait' ? 'Portret' : '—' }}</b>
                      <span class="muted">{{ formatDate(h.completed_at) }}</span>
                    </div>
                    <div class="score-row">
                      <div class="score-bar">
                        <div class="progress-fill" :style="{ width: (h.total_score || 0) + '%' }" />
                      </div>
                      <div class="score-txt">{{ h.total_score || 0 }}%</div>
                    </div>
                    <div class="muted" v-if="h.result_label" style="margin-top:6px;">Natija: {{ h.result_label }}</div>
                    <div class="muted" v-if="h.ai_recommendation" style="margin-top:6px;">AI: {{ h.ai_recommendation }}</div>
                  </div>
                </div>
              </div>

              <div class="slide-block">
                <h4>Ota-ona ma'lumotlari</h4>
                <div class="muted">Telefon: <b>{{ selectedStudent.phone || '—' }}</b></div>
              </div>
            </div>
          </div>
        </div>

        <section class="row-3">
          <div class="panel">
            <h3 class="panel-title">Yosh guruhlari</h3>
            <div v-if="loading" class="chart-skeleton" />
            <apexchart v-else type="bar" height="280" :options="ageBarOptions" :series="ageBarSeries" />
          </div>

          <div class="panel">
            <h3 class="panel-title">Haftalik trend (8 hafta)</h3>
            <div v-if="loading" class="chart-skeleton" />
            <apexchart v-else type="line" height="280" :options="weeklyTrendOptions" :series="weeklyTrendSeries" />
          </div>

          <div class="panel">
            <h3 class="panel-title">Ko'rsatkichlar balansi</h3>
            <div v-if="loading" class="chart-skeleton" />
            <apexchart v-else type="radar" height="280" :options="balanceRadarOptions" :series="balanceRadarSeries" />
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/auth";
import { useThemeStore } from "../../stores/theme.js";

import AdminSidebar from "../../components/layout/AdminSidebar.vue";
import MobileHeader from "../../components/layout/MobileHeader.vue";

import { useExcelExport } from "../../composables/useExcelExport";
import { useCountUp } from "../../composables/useCountUp";
import {
  buildAgeDistribution,
  buildClassBreakdownForSchool,
  buildPlatformDaily,
  buildResultsByUser,
  buildSchoolStatsRow,
  buildStressDistribution,
  buildStudentFullRows,
  buildWeeklyStressTrend,
  fetchAllResultsRows,
  mapResultRowForHistory,
} from "../../lib/legacyDashboardMetrics";

// Small component for cards
const StatCard = {
  props: {
    color: String,
    iconColor: String,
    label: String,
    value: Number,
    badge: String,
    badgeColor: String,
    sparkSeries: Array,
    sparkOptions: Object,
  },
  setup(props) {
    const shown = useCountUp(props.value, 1500, 0);
    return { shown };
  },
  template: `
    <div class="stat-card" :class="color">
      <div class="stat-head">
        <div class="stat-icon" :style="{ background: 'color-mix(in srgb, ' + iconColor + ' 14%, transparent)', borderColor: 'color-mix(in srgb, ' + iconColor + ' 35%, transparent)' }">
          <slot />
          <svg v-if="label === 'O\\'quvchilar'" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <svg v-else-if="label === 'Testlar'" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M7 9h10"/><path d="M7 13h6"/><path d="M7 17h10"/>
          </svg>
          <svg v-else-if="label === 'Maktablar'" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 17l20 0"/><path d="M3 8l9-5 9 5"/><path d="M5 10v10"/><path d="M19 10v10"/>
            <path d="M9 21V9h6v12"/>
          </svg>
          <svg v-else-if="label === 'O' + \"'\" + 'rtacha stress'" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/><circle cx="12" cy="12" r="3"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1l3 6 7 .99-5 5 1.5 7-6.5-3.5L5.5 20 7 13 2 8l7-1z"/></svg>
        </div>
        <span class="stat-badge" :class="badgeColor">{{ badge }}</span>
      </div>

      <div class="stat-num">{{ shown }}</div>
      <div class="stat-label">{{ label }}</div>
      <div class="stat-spark" v-if="sparkOptions">
        <apexchart type="area" :height="56" :options="sparkOptions" :series="sparkSeries" />
      </div>
    </div>
  `,
};

const formattedNow = ref(
  new Date().toLocaleDateString("uz-UZ", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
);

const SortArrow = {
  props: {
    active: Boolean,
    dir: String,
  },
  computed: {
    arrow() {
      if (!this.active) return "↕";
      return this.dir === "asc" ? "↑" : "↓";
    },
  },
  template: `
    <span class="sort-arrow" :class="{ active }">
      {{ arrow }}
    </span>
  `,
};

// Helpers
function initials(name) {
  const parts = String(name).trim().split(/\s+/);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || parts[0]?.[1] || "";
  return (a + b).toUpperCase();
}

const authStore = useAuthStore();
const themeStore = useThemeStore();
const { exportAdminReport } = useExcelExport();

const loading = ref(true);
const errorMessage = ref("");
const supabaseOk = computed(() => Boolean(supabase));

const rangeDays = ref(30);

const totals = reactive({
  schools: 0,
  students: 0,
  tests: 0,
  avgStress: 0,
  avgStressTrend: 0,
  todayTests: 0,
  highRiskCount: 0,
  weeklyNewStudents: 0,
  psychologists: 0,
});

const sparks = reactive({
  studentsSeries: [],
  studentsOptions: null,
  testsSeries: [],
  testsOptions: null,
  schoolsSeries: [],
  schoolsOptions: null,
  stressSeries: [],
  stressOptions: null,
  todayTestsSpark: [],
  todayTestsOptions: null,
  highRiskSeries: [],
  highRiskOptions: null,
  weeklyNewSeries: [],
  weeklyNewOptions: null,
  psychSeries: [],
  psychOptions: null,
});

const platformSeriesRaw = ref([]);

const platformChartSeries = computed(() => {
  const rows = filteredDaily.value;
  if (!rows.length) return [];
  return [
    { name: "Testlar", data: rows.map((r) => r.tests_done || 0) },
    { name: "Ro'yxatdan o'tish", data: rows.map((r) => r.unique_students || 0) },
    { name: "Faol o'quvchilar", data: rows.map((r) => r.unique_students || 0) },
  ];
});

const platformChartOptions = computed(() => ({
  chart: { background: "transparent", toolbar: { show: false }, animations: { enabled: true, speed: 800 } },
  theme: { mode: "dark" },
  colors: ["#00e5a0", "#6366f1", "#06b6d4"],
  stroke: { curve: "smooth", width: 3 },
  grid: { borderColor: "rgba(255,255,255,0.06)", strokeDashArray: 4 },
  fill: {
    type: "gradient",
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.45,
      opacityTo: 0.05,
      stops: [0, 90, 100],
    },
  },
  tooltip: { theme: "dark" },
  xaxis: {
    categories: filteredDaily.value.map((r) => r.day),
    labels: { style: { colors: "rgba(255,255,255,0.45)" } },
  },
  yaxis: { labels: { style: { colors: "rgba(255,255,255,0.45)" } } },
  legend: { labels: { colors: "rgba(255,255,255,0.65)" } },
}));

const filteredDaily = computed(() => {
  const rows = platformSeriesRaw.value || [];
  if (!rows.length) return [];
  const cutoff = Date.now() - rangeDays.value * 86400000;
  return rows.filter((r) => new Date(r.day).getTime() >= cutoff);
});

const stressDonutSeries = computed(() => {
  const r = stressDist.value;
  if (!r) return [];
  return [r.low_stress || 0, r.medium_stress || 0, r.high_stress || 0];
});

const stressDonutOptions = computed(() => ({
  chart: { background: "transparent", toolbar: { show: false }, animations: { enabled: true, speed: 800 } },
  theme: { mode: "dark" },
  colors: ["#00e5a0", "#f59e0b", "#ef4444"],
  labels: ["Past", "O'rta", "Yuqori"],
  dataLabels: { enabled: false },
  legend: { position: "bottom", labels: { colors: "rgba(255,255,255,0.65)" } },
  plotOptions: { pie: { donut: { size: "60%", labels: { show: true } } } },
}));

const testTypeSeries = computed(() => {
  const d = testTypes.value;
  if (!d) return [];
  return [
    { name: "Psixologik", data: [d.psychological || 0] },
    { name: "Portret", data: [d.portrait || 0] },
  ];
});

const testTypeOptions = computed(() => ({
  chart: { background: "transparent", toolbar: { show: false }, animations: { enabled: true, speed: 800 } },
  theme: { mode: "dark" },
  colors: ["#6366f1", "#00e5a0", "#06b6d4"],
  plotOptions: { bar: { horizontal: true, borderRadius: 8, barHeight: "65%" } },
  stroke: { show: false },
  xaxis: { categories: [""] , labels: { show: false } },
  yaxis: { labels: { style: { colors: "rgba(255,255,255,0.65)" } } },
  tooltip: { theme: "dark" },
  legend: { show: false },
}));

const schoolCompareSeries = computed(() => {
  if (!schoolCompare.value) return [];
  return [
    { name: "Bu yil", data: schoolCompare.value.thisYearCounts },
    { name: "O'tgan yil", data: schoolCompare.value.lastYearCounts },
  ];
});

const schoolCompareOptions = computed(() => ({
  chart: { background: "transparent", toolbar: { show: false }, animations: { enabled: true, speed: 800 } },
  theme: { mode: "dark" },
  colors: ["#6366f1", "#4f4f7a"],
  plotOptions: { bar: { columnWidth: "40%", borderRadius: 8 } },
  xaxis: { categories: schoolCompare.value?.months || [] },
  dataLabels: { enabled: false },
  grid: { borderColor: "rgba(255,255,255,0.06)" },
  legend: { labels: { colors: "rgba(255,255,255,0.65)" } },
  tooltip: { theme: "dark" },
}));

const ageBarSeries = computed(() => [
  { name: "7-9", data: [ageDist.value.g7_9 || 0], color: "#00e5a0" },
  { name: "10-12", data: [ageDist.value.g10_12 || 0], color: "#f59e0b" },
  { name: "13-15", data: [ageDist.value.g13_15 || 0], color: "#6366f1" },
  { name: "16-18", data: [ageDist.value.g16_18 || 0], color: "#ef4444" },
]);

const ageBarOptions = computed(() => ({
  chart: { background: "transparent", toolbar: { show: false }, animations: { enabled: true, speed: 800 } },
  theme: { mode: "dark" },
  plotOptions: { bar: { borderRadius: 10, distributed: true } },
  colors: ["#00e5a0", "#f59e0b", "#6366f1", "#ef4444"],
  xaxis: { categories: ["", "", "", ""], labels: { show: false } },
  tooltip: { theme: "dark" },
  legend: { show: false },
  dataLabels: { enabled: true, style: { colors: "rgba(255,255,255,0.85)" } },
}));

const weeklyTrendSeries = computed(() => (weeklyTrend.value?.series ? weeklyTrend.value.series : []));
const weeklyTrendOptions = computed(() => ({
  chart: { background: "transparent", toolbar: { show: false }, animations: { enabled: true, speed: 800 } },
  theme: { mode: "dark" },
  colors: ["#00e5a0"],
  stroke: { curve: "smooth", width: 3 },
  fill: {
    type: "gradient",
    gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.04 },
  },
  grid: { borderColor: "rgba(255,255,255,0.06)" },
  xaxis: { categories: weeklyTrend.value?.cats || [] },
  legend: { show: false },
  tooltip: { theme: "dark" },
}));

const balanceRadarOptions = computed(() => ({
  chart: { background: "transparent", toolbar: { show: false }, animations: { enabled: true, speed: 800 } },
  theme: { mode: "dark" },
  xaxis: { categories: ["Faollik", "Testlar", "Maktablar", "Risk", "O'quvchilar", "Bajarish"] },
  plotOptions: { radar: { size: 140, polygons: { strokeColors: "rgba(255,255,255,0.12)" } } },
  fill: { opacity: 0.25 },
  stroke: { width: 2 },
  colors: ["#00e5a0"],
  tooltip: { theme: "dark" },
}));
const balanceRadarSeries = computed(() => {
  const v = balance.value;
  if (!v) return [];
  return [
    {
      name: "Balans",
      data: [v.activity, v.tests, v.schools, v.risk, v.students, v.completion],
    },
  ];
});

const stressDist = ref(null);
const testTypes = ref(null);
const schoolCompare = ref(null);
const ageDist = ref({});
const weeklyTrend = ref({ cats: [], series: [] });
const balance = ref(null);

const onNotifications = () => {
  alert("Bildirishnomalar: hali ulanmagan.");
};

const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("uz-UZ");
  } catch {
    return iso;
  }
};

function stressPill(avg) {
  const x = Number(avg || 0);
  if (x >= 60) return "red";
  if (x >= 30) return "amber";
  return "green";
}
function riskPill(highRiskCount) {
  if ((highRiskCount || 0) > 5) return "red";
  if ((highRiskCount || 0) > 0) return "amber";
  return "green";
}
function riskLabelByStress(avg) {
  const x = Number(avg || 0);
  if (x >= 60) return "Yuqori";
  if (x >= 30) return "O'rta";
  return "Normal";
}

const schoolSearch = ref("");
const schoolFilter = ref("all");
const expandedSchoolId = ref(null);

const schoolSort = reactive({ key: "name", dir: "desc" });

const schoolRows = ref([]);
const classBreakdown = ref([]);

const visibleSchools = computed(() => {
  let rows = [...schoolRows.value];

  const q = schoolSearch.value.trim().toLowerCase();
  if (q) {
    rows = rows.filter((s) => String(s.school_name || "").toLowerCase().includes(q) || String(s.school_code || "").toLowerCase().includes(q));
  }

  if (schoolFilter.value === "high") {
    rows = rows.filter((s) => Number(s.high_risk_count || 0) > 5);
  }

  if (schoolFilter.value === "active") {
    rows = rows.filter((s) => s.is_active === true);
  }

  const { key, dir } = schoolSort;
  const mul = dir === "asc" ? 1 : -1;
  rows.sort((a, b) => {
    if (key === "name") return mul * String(a.school_name || "").localeCompare(String(b.school_name || ""));
    return mul * (Number(a[key] || 0) - Number(b[key] || 0));
  });

  return rows.slice(0, 20);
});

function toggleSchoolExpand(sid) {
  expandedSchoolId.value = expandedSchoolId.value === sid ? null : sid;
}

function classBreakdownBySchool(sid) {
  return classBreakdown.value.filter((c) => c.school_id === sid);
}

function sortSchools(key) {
  if (schoolSort.key === key) {
    schoolSort.dir = schoolSort.dir === "asc" ? "desc" : "asc";
  } else {
    schoolSort.key = key;
    schoolSort.dir = "asc";
  }
}

const studentsRaw = ref([]);
const studentsPage = ref(1);
const studentsPageSize = 25;
const studentsSearch = ref("");
const studentsSchoolId = ref("all");
const studentsClassName = ref("all");
const studentsRisk = ref("all");
const studentsStatus = ref("all");
const studentsSort = reactive({ key: "stress", dir: "desc" });

const studentsList = computed(() => {
  let rows = [...studentsRaw.value];
  const q = studentsSearch.value.trim().toLowerCase();
  if (q) {
    rows = rows.filter((s) => String(s.full_name || "").toLowerCase().includes(q) || String(s.student_code || "").toLowerCase().includes(q) || String(s.student_id || "").toLowerCase().includes(q));
  }
  if (studentsSchoolId.value !== "all") {
    rows = rows.filter((s) => s.school_id === studentsSchoolId.value);
  }
  if (studentsClassName.value !== "all") {
    rows = rows.filter((s) => s.class_name === studentsClassName.value);
  }

  if (studentsRisk.value !== "all") {
    rows = rows.filter((s) => s.risk_level === studentsRisk.value);
  }

  if (studentsStatus.value === "tested") {
    rows = rows.filter((s) => s.tests_taken && s.tests_taken > 0);
  }
  if (studentsStatus.value === "not_tested") {
    rows = rows.filter((s) => !s.tests_taken || s.tests_taken === 0);
  }

  const { key, dir } = studentsSort;
  const mul = dir === "asc" ? 1 : -1;
  rows.sort((a, b) => {
    if (key === "name") return mul * String(a.full_name || "").localeCompare(String(b.full_name || ""));
    if (key === "class") return mul * String(a.class_name || "").localeCompare(String(b.class_name || ""));
    return mul * (Number(a.avg_stress || 0) - Number(b.avg_stress || 0));
  });

  return rows;
});

const studentsTotal = computed(() => studentsList.value.length);
const studentsPages = computed(() => Math.ceil(studentsTotal.value / studentsPageSize));
const studentsPaged = computed(() => {
  const start = (studentsPage.value - 1) * studentsPageSize;
  return studentsList.value.slice(start, start + studentsPageSize);
});

const highRiskList = computed(() => {
  const cutoff = Date.now() - 7 * 86400000;
  return studentsList.value
    .filter((s) => Number(s.avg_stress || 0) > 60)
    .slice(0, 10)
    .map((s) => {
      const t = s.last_test_date ? new Date(s.last_test_date).getTime() : 0;
      return { ...s, testedRecently: t >= cutoff };
    });
});

const selectedStudent = ref(null);
const slideOpen = ref(false);
const studentHistory = ref([]);

const studentClassOptions = computed(() => {
  const set = new Set(studentsRaw.value.map((s) => s.class_name).filter(Boolean));
  return [...set].sort();
});

function riskBadgeFromLevel(level) {
  if (level === "high") return "red";
  if (level === "medium") return "amber";
  if (level === "low") return "green";
  return "muted";
}

function riskLabelFromLevel(level) {
  if (level === "high") return "Yuqori";
  if (level === "medium") return "O'rta";
  if (level === "low") return "Past";
  return "Test yo'q";
}

async function openStudent(student) {
  selectedStudent.value = student;
  slideOpen.value = true;
  studentHistory.value = [];

  try {
    if (!supabase) return;
    const uid = student.id;
    if (!uid) return;
    const { data: hist, error: e } = await supabase
      .from("results")
      .select("id, taken_at, total_score, test_type, risk_level, personality_type, ai_explanation, ai_professional")
      .eq("user_id", uid)
      .order("taken_at", { ascending: false });
    if (e) throw e;
    studentHistory.value = (hist || []).map(mapResultRowForHistory);
  } catch {
    // soft fail
  }
}

const exportSchools = async () => {
  try {
    const schools = visibleSchools.value;
    const data = {
      totalSchools: totals.schools,
      totalStudents: totals.students,
      totalTests: totals.tests,
      avgStress: totals.avgStress,
      totalHighRisk: totals.highRiskCount,
      todayTests: totals.todayTests,
      weeklyNew: totals.weeklyNewStudents,
      schools,
      allStudents: studentsList.value,
      dailyActivity: filteredDaily.value,
    };
    exportAdminReport(data);
    alert("Excel yuklab olindi.");
  } catch {
    alert("Excel eksportida xatolik.");
  }
};

const exportHighRisk = async () => {
  await exportSchools();
};

async function loadAll() {
  loading.value = true;
  errorMessage.value = "";

  if (!supabase) {
    loading.value = false;
    return;
  }

  try {
    const { data: schoolsData, error: eSchools } = await supabase
      .from("schools")
      .select("id, name, code, is_active, created_at")
      .order("name", { ascending: true });
    if (eSchools) throw eSchools;
    const schools = schoolsData || [];

    const { data: studentsData, error: eStu } = await supabase
      .from("users")
      .select("id, student_id, full_name, age, class_name, school_id, phone, created_at, role")
      .eq("role", "student");
    if (eStu) throw eStu;
    const students = studentsData || [];

    const results = await fetchAllResultsRows(supabase);
    const byUser = buildResultsByUser(results);
    const schoolMap = new Map(schools.map((s) => [s.id, s]));

    schoolRows.value = schools.map((sch) =>
      buildSchoolStatsRow(
        sch,
        students.filter((u) => u.school_id === sch.id),
        byUser,
      ),
    );

    classBreakdown.value = schools.flatMap((sch) =>
      buildClassBreakdownForSchool(sch, students.filter((u) => u.school_id === sch.id), byUser),
    );

    stressDist.value = buildStressDistribution(students, byUser);
    ageDist.value = buildAgeDistribution(students);

    const typeCounts = { psychological: 0, portrait: 0 };
    for (const t of results) {
      if (t.test_type === "psychological") typeCounts.psychological += 1;
      if (t.test_type === "portrait") typeCounts.portrait += 1;
    }
    testTypes.value = typeCounts;

    const year = new Date().getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const thisYearResults = results.filter((r) => {
      if (!r.taken_at) return false;
      const d = new Date(r.taken_at);
      return d.getFullYear() === year;
    });
    const lastYear = year - 1;
    const lastYearResults = results.filter((r) => {
      if (!r.taken_at) return false;
      return new Date(r.taken_at).getFullYear() === lastYear;
    });
    const thisCounts = months.map((m) => thisYearResults.filter((x) => new Date(x.taken_at).getMonth() + 1 === m).length);
    const lastCounts = months.map((m) => lastYearResults.filter((x) => new Date(x.taken_at).getMonth() + 1 === m).length);
    schoolCompare.value = {
      months: months.map((m) => `M${m}`),
      thisYearCounts: thisCounts,
      lastYearCounts: lastCounts,
    };

    weeklyTrend.value = buildWeeklyStressTrend(results, null, 8);
    platformSeriesRaw.value = buildPlatformDaily(results, 120);

    studentsRaw.value = buildStudentFullRows(students, schoolMap, byUser);

    const { count: cPsy } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "psychologist");
    totals.psychologists = cPsy ?? 0;

    totals.schools = schoolRows.value.length;
    totals.students = schoolRows.value.reduce((a, b) => a + Number(b.total_students || 0), 0);
    totals.tests = schoolRows.value.reduce((a, b) => a + Number(b.total_tests || 0), 0);
    totals.highRiskCount = schoolRows.value.reduce((a, b) => a + Number(b.high_risk_count || 0), 0);

    const weightedAvg = totals.tests
      ? schoolRows.value.reduce((acc, s) => acc + Number(s.avg_stress || 0) * Number(s.total_tests || 0), 0) / totals.tests
      : 0;
    totals.avgStress = Math.round(weightedAvg * 10) / 10;

    if (platformSeriesRaw.value.length) {
      const last7p = platformSeriesRaw.value.slice(-7);
      const prev7p = platformSeriesRaw.value.slice(-14, -7);
      const avgA = last7p.length ? last7p.reduce((a, r) => a + Number(r.avg_stress || 0), 0) / last7p.length : 0;
      const avgB = prev7p.length ? prev7p.reduce((a, r) => a + Number(r.avg_stress || 0), 0) / prev7p.length : 0;
      totals.avgStressTrend = Math.round((avgA - avgB) * 10) / 10;
    }

    const today = new Date().toISOString().slice(0, 10);
    const todayRow = platformSeriesRaw.value.find((r) => r.day === today);
    totals.todayTests = Number(todayRow?.tests_done || 0);

    const weekAgoIso = new Date(Date.now() - 7 * 86400000).toISOString();
    const { count: cNew } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "student")
      .gte("created_at", weekAgoIso);
    totals.weeklyNewStudents = cNew ?? 0;

    const completionAvg = schoolRows.value.length
      ? schoolRows.value.reduce((a, b) => a + Number(b.completion_rate || 0), 0) / schoolRows.value.length
      : 0;
    const act = filteredDaily.value.length ? filteredDaily.value[filteredDaily.value.length - 1]?.avg_stress || 0 : 0;
    const testsAvg = totals.tests ? totals.tests / Math.max(1, totals.schools) : 0;
    const riskAvg = totals.highRiskCount;
    balance.value = {
      activity: act,
      tests: Math.min(100, testsAvg),
      schools: Math.min(100, totals.schools),
      risk: Math.min(100, riskAvg),
      students: Math.min(100, totals.students),
      completion: Math.min(100, completionAvg),
    };

    const last7 = platformSeriesRaw.value.slice(-7);
    const baseSparkOptions = {
      chart: { background: "transparent", toolbar: { show: false }, animations: { enabled: true, speed: 800 }, sparkline: { enabled: true } },
      theme: { mode: "dark" },
      grid: { show: false },
      stroke: { curve: "smooth", width: 2 },
      fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0 } },
      tooltip: { theme: "dark" },
      xaxis: { categories: last7.map(() => "") },
      yaxis: { show: false },
    };
    sparks.studentsSeries = [{ name: "O'quvchilar", data: last7.map((r) => r.unique_students || 0) }];
    sparks.studentsOptions = { ...baseSparkOptions, colors: ["#6366f1"] };
    sparks.testsSeries = [{ name: "Testlar", data: last7.map((r) => r.tests_done || 0) }];
    sparks.testsOptions = { ...baseSparkOptions, colors: ["#00e5a0"] };
    sparks.schoolsSeries = [{ name: "Maktablar", data: last7.map(() => totals.schools) }];
    sparks.schoolsOptions = { ...baseSparkOptions, colors: ["#06b6d4"] };
    sparks.stressSeries = [{ name: "Stress", data: last7.map((r) => r.avg_stress || 0) }];
    sparks.stressOptions = { ...baseSparkOptions, colors: ["#f59e0b"] };
    sparks.todayTestsSpark = [{ name: "Bugun", data: last7.map((r) => r.tests_done || 0) }];
    sparks.todayTestsOptions = { ...baseSparkOptions, colors: ["#06b6d4"] };
    sparks.highRiskSeries = [{ name: "Yuqori", data: last7.map((_) => Math.round(totals.highRiskCount / 7)) }];
    sparks.highRiskOptions = { ...baseSparkOptions, colors: ["#ef4444"] };
    sparks.weeklyNewSeries = [{ name: "Yangi", data: last7.map((_) => Math.max(1, Math.round(totals.weeklyNewStudents / 7))) }];
    sparks.weeklyNewOptions = { ...baseSparkOptions, colors: ["#00e5a0"] };
    sparks.psychSeries = [{ name: "Psixologlar", data: last7.map(() => totals.psychologists) }];
    sparks.psychOptions = { ...baseSparkOptions, colors: ["#6366f1"] };
  } catch (e) {
    errorMessage.value = "Admin dashboard yuklanmadi.";
  } finally {
    loading.value = false;
  }
}

watch(rangeDays, () => {
  // charts computed from filteredDaily; no extra fetch
});

watch([studentsSearch, studentsClassName, studentsRisk, studentsStatus], () => {
  studentsPage.value = 1;
});

onMounted(() => {
  loadAll();
});

const schoolSortArrow = computed(() => {});
</script>

<style scoped>
.admin-dashboard-page {
  --page-bg: var(--dash-bg);
  --card-bg: var(--dash-card);
  background: var(--page-bg);
  min-height: 100vh;
  color: var(--dash-text);
  display: flex;
}

.admin-main {
  min-height: 100vh;
  padding: 20px 24px 40px;
  flex: 1;
}

.admin-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: linear-gradient(140deg, rgba(22, 24, 42, 0.84), rgba(18, 20, 36, 0.62));
  backdrop-filter: blur(14px);
  margin-bottom: 16px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.24);
}

.topbar-title {
  margin: 0;
  font-size: 1.15rem;
  letter-spacing: 0.01em;
}

.topbar-sub {
  color: rgba(255,255,255,0.45);
  font-size: 0.9rem;
  margin-top: 2px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-btn {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255,255,255,0.1);
  width: 40px;
  height: 40px;
  border-radius: 12px;
  color: rgba(255,255,255,0.9);
  cursor: pointer;
  transition: all 0.2s ease;
}
.icon-btn:hover {
  border-color: rgba(129, 140, 248, 0.5);
  background: rgba(99, 102, 241, 0.14);
  transform: translateY(-1px) scale(1.01);
}

.admin-avatar {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.9);
  font-weight: 700;
}

.avatar-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--dash-green);
  box-shadow: 0 0 0 4px rgba(0,229,160,0.12);
}

.admin-content {
  max-width: 1400px;
  margin: 0 auto;
}

.section {
  margin-bottom: 22px;
}
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.section-head h2 {
  margin: 0;
  font-size: 1.05rem;
}

.range {
  display: flex;
  gap: 8px;
}
.range-btn {
  padding: 8px 12px;
  border-radius: 12px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.75);
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 700;
}
.range-btn.active {
  border-color: rgba(99,102,241,0.5);
  color: rgba(255,255,255,0.95);
  background: rgba(99,102,241,0.14);
}

.panel {
  background: linear-gradient(160deg, rgba(22, 24, 42, 0.92), rgba(18, 20, 36, 0.85));
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.28);
  padding: 16px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.panel-title {
  margin: 0 0 10px;
  font-size: 1rem;
}
.panel-foot {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.stats-grid-2 {
  margin-top: 14px;
}

.row-3 {
  display: grid;
  grid-template-columns: 45% 30% 25%;
  gap: 14px;
}
.row-2 {
  display: grid;
  grid-template-columns: 60% 40%;
  gap: 14px;
}

.stat-card {
  background: linear-gradient(165deg, rgba(23, 25, 44, 0.92), rgba(18, 20, 36, 0.88));
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  box-shadow: 0 10px 24px rgba(0,0,0,0.24);
  padding: 14px;
  transition: all 0.3s ease;
  min-height: 150px;
}
.stat-card:hover {
  border-color: rgba(129,140,248,0.36);
  transform: translateY(-3px);
  box-shadow: 0 16px 36px rgba(0,0,0,0.32);
}

.stat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.06);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.95);
}
.stat-badge {
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 900;
  font-size: 0.85rem;
}
.stat-badge.green { background: rgba(0,229,160,0.14); color: var(--dash-green); border: 1px solid rgba(0,229,160,0.35); }
.stat-badge.red { background: rgba(239,68,68,0.14); color: var(--dash-red); border: 1px solid rgba(239,68,68,0.35); }
.stat-badge.amber { background: rgba(245,158,11,0.14); color: var(--dash-amber); border: 1px solid rgba(245,158,11,0.35); }

.stat-num {
  margin-top: 12px;
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: 0.01em;
}
.stat-label {
  margin-top: 4px;
  color: rgba(255,255,255,0.45);
  font-weight: 700;
}
.stat-spark {
  margin-top: 10px;
}

.chart-skeleton {
  height: 360px;
  background: rgba(255,255,255,0.03);
  border-radius: 16px;
}

.empty {
  margin-top: 10px;
  color: rgba(255,255,255,0.45);
  text-align: center;
}

.table-wrap {
  overflow: auto;
}
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
  cursor: pointer;
}
.table tbody td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.tr:hover {
  background: rgba(99,102,241,0.1);
}
.td-left {
  display: flex;
  gap: 10px;
  align-items: center;
}
.row-num {
  width: 34px;
  color: rgba(255,255,255,0.55);
  font-weight: 900;
}
.row-title { font-weight: 900; }
.row-sub { color: rgba(255,255,255,0.4); font-size: 0.9rem; }

.progress-cell { display: flex; align-items: center; gap: 10px; }
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
.progress-txt { width: 50px; text-align: right; color: rgba(255,255,255,0.65); font-weight: 800; font-size: 0.9rem; }

.pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 900;
  font-size: 0.9rem;
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
  background: rgba(255,255,255,0.03);
}
.badge-risk.red { background: rgba(239,68,68,0.14); color: var(--dash-red); border-color: rgba(239,68,68,0.35); }
.badge-risk.amber { background: rgba(245,158,11,0.14); color: var(--dash-amber); border-color: rgba(245,158,11,0.35); }
.badge-risk.green { background: rgba(0,229,160,0.14); color: var(--dash-green); border-color: rgba(0,229,160,0.35); }

.risk-panel {}
.risk-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.risk-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(19,19,31,0.55);
}
.risk-name { font-weight: 900; }
.risk-meta { color: rgba(255,255,255,0.42); margin-top: 4px; font-size: 0.92rem; }
.risk-right { display: flex; align-items: center; gap: 10px; }
.risk-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(239,68,68,0.9);
  opacity: 0.35;
}
.risk-dot.pulse { opacity: 1; box-shadow: 0 0 0 8px rgba(239,68,68,0.12); animation: glowPulse 2s ease infinite; }

.table-tools {
  display: grid;
  grid-template-columns: 1fr 220px;
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
.excel-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.excel-btn.small { padding: 8px 12px; font-size: 0.9rem; }

.expand-wrap { padding: 12px 0; }
.expand-head { margin-bottom: 10px; color: rgba(255,255,255,0.85); }

.chart-skeleton { border-radius: 16px; background: rgba(255,255,255,0.03); height: 320px; }

.grid-skeleton { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.sk-card { height: 150px; padding: 14px; }
.skeleton-line { height: 14px; background: rgba(255,255,255,0.06); }
.skeleton-num { height: 30px; margin-top: 20px; background: rgba(255,255,255,0.06); }
.skeleton-mini { height: 44px; margin-top: 8px; background: rgba(255,255,255,0.06); }

@media (max-width: 1200px) {
  .admin-main { margin-left: 252px; }
  .row-3 { grid-template-columns: 1fr; }
  .row-2 { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .table-tools { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .admin-main { margin-left: 0; padding: 14px; }
}

.sort-arrow {
  margin-left: 6px;
  color: rgba(255,255,255,0.35);
  font-weight: 900;
}
.sort-arrow.active {
  color: rgba(255,255,255,0.9);
}

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
</style>

