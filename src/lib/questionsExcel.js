import * as XLSX from "xlsx";

export const PSYCH_CATS = ["lie_scale", "delinquency", "addiction", "aggression", "self_harm"];

export const PORTRAIT_TYPES = ["leadership", "social", "intellectual", "emotional"];

export function buildPsychTemplateWb() {
  const wb = XLSX.utils.book_new();
  const headers = ["savol_matni", "kategoriya", "tartib_raqami", "faol"];
  const sample1 = [
    "Namuna: Men yolg'on gapirishni xush ko'raman",
    "lie_scale",
    1,
    "ha",
  ];
  const sample2 = ["Namuna 2", "delinquency", 2, "ha"];
  const aoa = [headers, sample1, sample2];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 48 }, { wch: 18 }, { wch: 14 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(wb, ws, "Psixologik");
  return wb;
}

export function buildPortraitTemplateWb() {
  const wb = XLSX.utils.book_new();
  const headers = [
    "savol_matni",
    "tartib_raqami",
    "variant_1_matni",
    "variant_1_tur",
    "variant_1_ball",
    "variant_2_matni",
    "variant_2_tur",
    "variant_2_ball",
    "variant_3_matni",
    "variant_3_tur",
    "variant_3_ball",
    "variant_4_matni",
    "variant_4_tur",
    "variant_4_ball",
  ];
  const row1 = [
    "Namuna savol",
    1,
    "A variant",
    "leadership",
    2,
    "B variant",
    "social",
    1,
    "C",
    "intellectual",
    1,
    "D",
    "emotional",
    2,
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, row1]);
  ws["!cols"] = headers.map(() => ({ wch: 16 }));
  XLSX.utils.book_append_sheet(wb, ws, "Portret");
  return wb;
}

function parseBoolFaol(v) {
  const s = String(v || "")
    .trim()
    .toLowerCase();
  if (!s || s === "ha") return true;
  if (s === "yoq" || s === "yo'q" || s === "no") return false;
  return true;
}

export function validatePsychRow(raw) {
  const errors = [];
  const warnings = [];
  const savol = String(raw.savol_matni ?? "").trim();
  const kat = String(raw.kategoriya ?? "").trim().toLowerCase();
  const ord = Number(raw.tartib_raqami);
  if (!savol) errors.push("savol_matni bo'sh");
  if (!PSYCH_CATS.includes(kat)) errors.push("noto'g'ri kategoriya");
  if (!Number.isFinite(ord) || ord < 1) warnings.push("tartib shubhali");
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    row: {
      question_text: savol,
      category: kat || "lie_scale",
      order_num: Number.isFinite(ord) ? ord : 0,
      is_active: parseBoolFaol(raw.faol),
      test_type: "psychological",
    },
  };
}

export function validatePortraitRow(raw) {
  const errors = [];
  const warnings = [];
  const savol = String(raw.savol_matni ?? "").trim();
  const ord = Number(raw.tartib_raqami);
  if (!savol) errors.push("savol_matni bo'sh");
  if (!Number.isFinite(ord) || ord < 1) errors.push("tartib_raqami majburiy");
  const variants = [];
  for (let i = 1; i <= 4; i += 1) {
    const txt = String(raw[`variant_${i}_matni`] ?? "").trim();
    const tur = String(raw[`variant_${i}_tur`] ?? "").trim().toLowerCase();
    const ball = Number(raw[`variant_${i}_ball`]);
    if (!txt) continue;
    if (!PORTRAIT_TYPES.includes(tur)) {
      errors.push(`variant_${i}_tur`);
      continue;
    }
    if (ball !== 1 && ball !== 2) warnings.push(`variant_${i}_ball`);
    variants.push({
      option_text: txt,
      personality_type: tur,
      points: ball === 2 ? 2 : 1,
    });
  }
  if (variants.length < 2) errors.push("kamida 2 variant");
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    row: {
      question_text: savol,
      order_num: ord,
      is_active: true,
      test_type: "portrait",
      category: "portrait",
      variants,
    },
  };
}

export function sheetRowsToObjects(sheet) {
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}
