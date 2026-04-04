/**
 * Admin / psixolog dashboardlari uchun ma'lumot — haqiqiy sxema:
 * users (role=student), schools, results (taken_at, user_id, …)
 * Eski UI esa v_* view va test_results ga tayanardi — bu loyihada yo'q.
 */

export function dayKey(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return String(iso).slice(0, 10);
  }
}

export function buildResultsByUser(results) {
  const byUser = new Map();
  for (const r of results || []) {
    const uid = r.user_id;
    if (!uid) continue;
    if (!byUser.has(uid)) byUser.set(uid, []);
    byUser.get(uid).push(r);
  }
  for (const list of byUser.values()) {
    list.sort((a, b) => new Date(b.taken_at || 0) - new Date(a.taken_at || 0));
  }
  return byUser;
}

/** UI filter: high | medium | low | not_tested */
export function mapDbRiskToUi(level) {
  if (level === "high") return "high";
  if (level === "medium") return "medium";
  if (level === "normal") return "low";
  return "not_tested";
}

export function buildStudentFullRows(students, schoolMap, byUser) {
  return (students || []).map((s) => {
    const arr = byUser.get(s.id) || [];
    const psych = arr.find((x) => x.test_type === "psychological");
    const portraits = [
      ...new Set(
        arr.filter((x) => x.test_type === "portrait" && x.personality_type).map((x) => x.personality_type),
      ),
    ];
    return {
      student_id: s.student_id || s.id,
      id: s.id,
      full_name: s.full_name,
      age: s.age,
      class_name: s.class_name,
      school_id: s.school_id,
      school_name: schoolMap.get(s.school_id)?.name || "—",
      student_code: s.student_id || "",
      phone: s.phone,
      created_at: s.created_at,
      tests_taken: arr.length,
      last_test_date: arr[0]?.taken_at || null,
      avg_stress: psych ? Number(psych.total_score) || 0 : 0,
      risk_level: psych ? mapDbRiskToUi(psych.risk_level) : "not_tested",
      personality_types: portraits.length ? portraits.join(", ") : null,
    };
  });
}

export function buildSchoolStatsRow(school, studentsInSchool, byUser) {
  const total_students = studentsInSchool.length;
  let tested_students = 0;
  let high_risk_count = 0;
  let stressWeighted = 0;
  let stressN = 0;
  let last_activity = null;
  let total_tests = 0;

  for (const s of studentsInSchool) {
    const arr = byUser.get(s.id) || [];
    total_tests += arr.length;
    if (arr.length) tested_students += 1;
    const psych = arr.find((x) => x.test_type === "psychological");
    if (psych) {
      if (psych.risk_level === "high") high_risk_count += 1;
      stressWeighted += Number(psych.total_score || 0);
      stressN += 1;
    }
    const lt = arr[0]?.taken_at;
    if (lt && (!last_activity || new Date(lt) > new Date(last_activity))) {
      last_activity = lt;
    }
  }

  const not_tested_students = total_students - tested_students;
  const completion_rate = total_students ? Math.round((tested_students / total_students) * 100) : 0;
  const avg_stress = stressN ? Math.round((stressWeighted / stressN) * 10) / 10 : 0;

  return {
    school_id: school.id,
    school_name: school.name,
    school_code: school.code,
    is_active: school.is_active,
    total_students,
    tested_students,
    not_tested_students,
    completion_rate,
    avg_stress,
    high_risk_count,
    last_activity,
    total_tests,
  };
}

export function buildClassBreakdownForSchool(school, studentsInSchool, byUser) {
  const byClass = new Map();
  for (const s of studentsInSchool) {
    const cn = s.class_name || "—";
    if (!byClass.has(cn)) byClass.set(cn, []);
    byClass.get(cn).push(s);
  }
  const rows = [];
  for (const [class_name, studs] of byClass) {
    const total_students = studs.length;
    let tested_students = 0;
    let high_risk = 0;
    let stressSum = 0;
    let stressN = 0;
    for (const s of studs) {
      const arr = byUser.get(s.id) || [];
      if (arr.length) tested_students += 1;
      const psych = arr.find((x) => x.test_type === "psychological");
      if (psych) {
        if (psych.risk_level === "high") high_risk += 1;
        stressSum += Number(psych.total_score || 0);
        stressN += 1;
      }
    }
    const not_tested = total_students - tested_students;
    const completion_pct = total_students ? Math.round((tested_students / total_students) * 100) : 0;
    const avg_stress = stressN ? Math.round((stressSum / stressN) * 10) / 10 : 0;
    rows.push({
      school_id: school.id,
      school_name: school.name,
      class_name,
      total_students,
      tested_students,
      not_tested,
      remaining_to_test: not_tested,
      completion_pct,
      avg_stress,
      high_risk,
    });
  }
  return rows.sort((a, b) => String(a.class_name).localeCompare(String(b.class_name)));
}

/** So'nggi ~`daysBack` kun uchun kunlik faollik (v_daily_activity o'rniga) */
export function buildPlatformDaily(results, daysBack = 100) {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - daysBack);
  const rows = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.toISOString().slice(0, 10);
    const dayResults = (results || []).filter((r) => dayKey(r.taken_at) === day);
    const tests_done = dayResults.length;
    const unique_students = new Set(dayResults.map((r) => r.user_id).filter(Boolean)).size;
    const psychScores = dayResults
      .filter((r) => r.test_type === "psychological")
      .map((r) => Number(r.total_score || 0));
    const avg_stress = psychScores.length
      ? Math.round((psychScores.reduce((a, b) => a + b, 0) / psychScores.length) * 10) / 10
      : 0;
    rows.push({ day, tests_done, unique_students, avg_stress });
  }
  return rows;
}

export function buildStressDistribution(students, byUser) {
  let low_stress = 0;
  let medium_stress = 0;
  let high_stress = 0;
  for (const s of students || []) {
    const psych = (byUser.get(s.id) || []).find((x) => x.test_type === "psychological");
    if (!psych) continue;
    if (psych.risk_level === "high") high_stress += 1;
    else if (psych.risk_level === "medium") medium_stress += 1;
    else low_stress += 1;
  }
  return { low_stress, medium_stress, high_stress };
}

export function buildAgeDistribution(students) {
  const g = { g7_9: 0, g10_12: 0, g13_15: 0, g16_18: 0 };
  for (const s of students || []) {
    const a = Number(s.age);
    if (Number.isNaN(a)) continue;
    if (a >= 7 && a <= 9) g.g7_9 += 1;
    else if (a >= 10 && a <= 12) g.g10_12 += 1;
    else if (a >= 13 && a <= 15) g.g13_15 += 1;
    else if (a >= 16 && a <= 18) g.g16_18 += 1;
  }
  return g;
}

export function buildWeeklyStressTrend(results, userIdFilterSet, numWeeks = 8) {
  const psych = (results || []).filter(
    (r) =>
      r.test_type === "psychological" &&
      r.taken_at &&
      (!userIdFilterSet || userIdFilterSet.has(r.user_id)),
  );
  const map = new Map();
  for (const r of psych) {
    const d = new Date(r.taken_at);
    const day = d.getDay();
    const diff = d.getDate() - ((day + 6) % 7);
    const mon = new Date(d);
    mon.setDate(diff);
    mon.setHours(0, 0, 0, 0);
    const key = mon.toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(Number(r.total_score || 0));
  }
  const keys = [...map.keys()].sort();
  const slice = keys.slice(-numWeeks);
  if (!slice.length) {
    return { cats: [], series: [{ name: "Stress", data: [] }] };
  }
  const data = slice.map((k) => {
    const arr = map.get(k) || [];
    return arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;
  });
  const cats = slice.map((k) => k.slice(5));
  return { cats, series: [{ name: "Stress", data }] };
}

/** Slide-over / tarix UI uchun (completed_at, result_label kutiladi) */
export function mapResultRowForHistory(r) {
  let result_label = null;
  if (r.test_type === "psychological" && r.risk_level) {
    if (r.risk_level === "high") result_label = "Yuqori risk";
    else if (r.risk_level === "medium") result_label = "O'rta risk";
    else if (r.risk_level === "normal") result_label = "Past risk";
    else result_label = String(r.risk_level);
  } else if (r.personality_type) {
    result_label = r.personality_type;
  }
  return {
    id: r.id,
    completed_at: r.taken_at,
    total_score: Number(r.total_score || 0),
    test_type: r.test_type,
    result_label,
    personality_type: r.personality_type,
    ai_recommendation: r.ai_professional || r.ai_explanation || null,
  };
}

const RESULT_SELECT =
  "id, user_id, test_type, taken_at, total_score, risk_level, personality_type, category_scores, ai_explanation, ai_professional";

/** PostgREST standart limitidan oshmasligi uchun */
export async function fetchAllResultsRows(supabase, pageSize = 1000) {
  const all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from("results").select(RESULT_SELECT).range(from, from + pageSize - 1);
    if (error) throw error;
    const batch = data || [];
    all.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

/** .in() URL limiti — katta ro'yxatni bo'laklash */
export async function fetchResultsForUserIds(supabase, userIds, chunkSize = 120) {
  const ids = userIds || [];
  if (!ids.length) return [];
  const out = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    const slice = ids.slice(i, i + chunkSize);
    const { data, error } = await supabase.from("results").select(RESULT_SELECT).in("user_id", slice);
    if (error) throw error;
    out.push(...(data || []));
  }
  return out;
}
