/** Psixolog "O'quvchilar" ro'yxati — formatlash va filtrlash */

export const DIRECTION_KEYS = ["emotional", "intellectual", "leadership", "social"];

export const DIRECTION_UZ = {
  emotional: "Emotsional",
  intellectual: "Intellektual",
  leadership: "Liderlik",
  social: "Ijtimoiy",
};

const DIR_SET = new Set(DIRECTION_KEYS);

/**
 * Telefon: +998 XX XXX-XX-XX
 * @param {string|null|undefined} raw
 */
export function formatPhoneUz(raw) {
  if (raw == null || String(raw).trim() === "") return "—";
  const d = String(raw).replace(/\D/g, "");
  let u = d;
  if (u.startsWith("998")) u = u.slice(3);
  if (u.length > 9) u = u.slice(0, 9);
  if (u.length < 9) return String(raw).trim() || "—";
  return `+998 ${u.slice(0, 2)} ${u.slice(2, 5)}-${u.slice(5, 7)}-${u.slice(7, 9)}`;
}

export function normalizeDirection(personalityType) {
  if (!personalityType) return null;
  const p = String(personalityType).toLowerCase().trim();
  return DIR_SET.has(p) ? p : null;
}

/** So'ngi test sanasi: YYYY-MM-DD HH:MM */
export function formatTestDateTime(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}:${min}`;
  } catch {
    return null;
  }
}

export function riskToXavfLabel(lastPsych) {
  if (!lastPsych) return "Test topshirilmagan";
  const lv = lastPsych.risk_level;
  if (lv === "high") return "Yuqori";
  if (lv === "medium") return "O'rta";
  if (lv === "normal") return "Normal";
  return "Test topshirilmagan";
}

export function testTypeToUz(testType) {
  if (testType === "psychological") return "Psixologik";
  if (testType === "portrait") return "Portret";
  return "—";
}

/** Psixolog detail URL: users.id (UUID) yoki student_id (ST-...) */
export function studentPsychologistDetailParam(s) {
  if (!s) return "";
  const u = s.id ?? s.user_id;
  if (u != null && String(u).trim() !== "") return String(u).trim();
  const sid = s.student_id ?? s.studentId;
  if (sid != null && String(sid).trim() !== "") return String(sid).trim();
  return "";
}

/**
 * @param {object} params
 * @param {Array<{id:string,full_name?:string,class_name?:string|null,age?:number|null,phone?:string|null}>} params.students
 * @param {Array<{user_id:string,test_type:string,taken_at:string,risk_level?:string,personality_type?:string|null}>} params.results
 */
export function buildStudentRows({ students, results }) {
  const psychLatest = new Map();
  const portraitLatest = new Map();
  const anyLatest = new Map();

  for (const r of results || []) {
    const uid = r.user_id;
    if (!uid) continue;
    const t = new Date(r.taken_at || 0).getTime();

    if (r.test_type === "psychological") {
      const prev = psychLatest.get(uid);
      if (!prev || t > new Date(prev.taken_at || 0).getTime()) psychLatest.set(uid, r);
    }
    if (r.test_type === "portrait") {
      const prev = portraitLatest.get(uid);
      if (!prev || t > new Date(prev.taken_at || 0).getTime()) portraitLatest.set(uid, r);
    }
    const prevA = anyLatest.get(uid);
    if (!prevA || t > new Date(prevA.taken_at || 0).getTime()) anyLatest.set(uid, r);
  }

  return (students || []).map((s, idx) => {
    const rowKey = studentPsychologistDetailParam(s) || `row-${idx}`;
    const lastPsych = psychLatest.get(s.id) || null;
    const lastPortrait = portraitLatest.get(s.id) || null;
    const lastAny = anyLatest.get(s.id) || null;
    const yonalishKey = normalizeDirection(lastPortrait?.personality_type);
    const xavfLabel = riskToXavfLabel(lastPsych);
    const lastIso = lastAny?.taken_at || null;

    return {
      ...s,
      _rowKey: rowKey,
      detailRouteParam: studentPsychologistDetailParam(s),
      lastPsych,
      lastPortrait,
      lastAny,
      phoneDisplay: formatPhoneUz(s.phone),
      lastTestDisplay: formatTestDateTime(lastIso),
      yonalishKey,
      yonalishLabel: yonalishKey ? DIRECTION_UZ[yonalishKey] : "—",
      xavfLabel,
      lastTestType: lastAny?.test_type || null,
      lastTestTypeUz: testTypeToUz(lastAny?.test_type),
    };
  });
}

/**
 * @param {ReturnType<typeof buildStudentRows>} rows
 * @param {object} f
 */
export function filterStudentRows(rows, f) {
  const q = (f.query || "").trim().toLowerCase();
  const classes = f.classes || [];
  const risk = f.risk || "all";
  const ageMin = f.ageMin !== "" && f.ageMin != null ? Number(f.ageMin) : null;
  const ageMax = f.ageMax !== "" && f.ageMax != null ? Number(f.ageMax) : null;
  const directions = f.directions || [];
  const testKinds = f.testKinds || [];

  return rows.filter((row) => {
    if (q) {
      const name = String(row.full_name || "").toLowerCase();
      const phoneDigits = String(row.phone || "").replace(/\D/g, "");
      const qDigits = q.replace(/\D/g, "");
      const nameOk = name.includes(q);
      const phoneOk = qDigits.length >= 3 ? phoneDigits.includes(qDigits) : false;
      if (!nameOk && !phoneOk) return false;
    }

    if (classes.length && !classes.includes(row.class_name || "")) return false;

    if (risk !== "all") {
      if (risk === "none") {
        if (row.lastPsych) return false;
      } else {
        const map = { high: "Yuqori", medium: "O'rta", normal: "Normal" };
        if (row.xavfLabel !== map[risk]) return false;
      }
    }

    if (ageMin != null && !Number.isNaN(ageMin)) {
      const a = row.age == null ? null : Number(row.age);
      if (a == null || Number.isNaN(a) || a < ageMin) return false;
    }
    if (ageMax != null && !Number.isNaN(ageMax)) {
      const a = row.age == null ? null : Number(row.age);
      if (a == null || Number.isNaN(a) || a > ageMax) return false;
    }

    if (directions.length) {
      if (!row.yonalishKey || !directions.includes(row.yonalishKey)) return false;
    }

    if (testKinds.length) {
      const wantPsych = testKinds.includes("psych");
      const wantPortrait = testKinds.includes("portrait");
      const hasPsych = !!row.lastPsych;
      const hasPortrait = !!row.lastPortrait;
      if (!((wantPsych && hasPsych) || (wantPortrait && hasPortrait))) return false;
    }

    return true;
  });
}

export function studentInitials(fullName) {
  const n = String(fullName || "").trim();
  if (!n) return "?";
  const p = n.split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
}

const AVATAR_PAIRS = [
  ["var(--st-av-1a)", "var(--st-av-1b)"],
  ["var(--st-av-2a)", "var(--st-av-2b)"],
  ["var(--st-av-3a)", "var(--st-av-3b)"],
  ["var(--st-av-4a)", "var(--st-av-4b)"],
  ["var(--st-av-5a)", "var(--st-av-5b)"],
  ["var(--st-av-6a)", "var(--st-av-6b)"],
];

export function avatarVars(index) {
  const [c1, c2] = AVATAR_PAIRS[Math.abs(index) % AVATAR_PAIRS.length];
  return { "--av-c1": c1, "--av-c2": c2 };
}
