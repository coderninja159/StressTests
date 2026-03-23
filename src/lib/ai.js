import axios from "axios";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

function getApiKey() {
  return import.meta.env.VITE_DEEPSEEK_API_KEY?.trim() || "";
}

async function postChat({ system, user }) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return null;
  }

  try {
    const { data } = await axios.post(
      DEEPSEEK_URL,
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 500,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 60000,
      },
    );

    const text = data?.choices?.[0]?.message?.content;
    return typeof text === "string" && text.trim() ? text.trim() : null;
  } catch {
    return null;
  }
}

/**
 * O'quvchi uchun AI izohi (psixologik yoki portret).
 * @param {object} categoryScores — results.category_scores
 * @param {string} riskLevel — psixologik: xavf darajasi matni; portret: asosiy tur sarlavhasi
 * @param {'psychological'|'portrait'} testType
 */
export async function getStudentExplanation(categoryScores, riskLevel, testType) {
  if (!categoryScores || !testType) {
    return null;
  }

  const d = categoryScores.delinquency?.percentage ?? 0;
  const a = categoryScores.addiction?.percentage ?? 0;
  const ag = categoryScores.aggression?.percentage ?? 0;
  const sh = categoryScores.self_harm?.percentage ?? 0;

  const l = categoryScores.leadership?.percentage ?? 0;
  const s = categoryScores.social?.percentage ?? 0;
  const i = categoryScores.intellectual?.percentage ?? 0;
  const e = categoryScores.emotional?.percentage ?? 0;

  if (testType === "psychological") {
    const system =
      "Sen maktab o'quvchilariga yordam beruvchi do'stona psixologik yordamchisan. " +
      "Natijalarni oddiy, tushunarli tilda tushuntir. " +
      "Hech qachon qo'rqitma, har doim umid ber. " +
      "Javobni 3 qismga bo'l: 1) Qisqa tushuntirish 2) Kuchli tomonlaring 3) Maslahat. " +
      "O'zbek tilida yoz. Maksimum 200 so'z.";

    const user =
      "O'quvchi test natijasi:\n" +
      `Huquqbuzarlik: ${d}%\n` +
      `Zavisimlik: ${a}%\n` +
      `Tajovuzkorlik: ${ag}%\n` +
      `O'z-o'ziga zarar: ${sh}%\n` +
      `Umumiy xavf darajasi: ${riskLevel || "noma'lum"}\n` +
      "Shu natijaga asoslanib o'quvchiga tushunarli izoh va maslahat ber.";

    return await postChat({ system, user });
  }

  if (testType === "portrait") {
    const system =
      "Sen shaxsiyat tahlilchisan. Natijani ijobiy va rag'batlantiruvchi tilda tushuntir. " +
      "O'zbek tilida yoz. Maksimum 150 so'z.";

    const user =
      "O'quvchi shaxsiyat testi natijasi:\n" +
      `Yetakchilik: ${l}%\n` +
      `Ijtimoiylik: ${s}%\n` +
      `Intellekt: ${i}%\n` +
      `Hissiyot: ${e}%\n` +
      `Asosiy shaxsiyat turi: ${riskLevel || "noma'lum"}\n` +
      "Shu natijaga asoslanib ijobiy izoh va kuchli tomonlarni yoz.";

    return await postChat({ system, user });
  }

  return null;
}

function levelUz(level) {
  if (level === "high") return "Yuqori";
  if (level === "medium") return "O'rta";
  if (level === "normal") return "Normal";
  return String(level || "—");
}

function riskUz(risk) {
  if (risk === "high") return "Yuqori";
  if (risk === "medium") return "O'rta";
  if (risk === "normal") return "Normal";
  return String(risk || "—");
}

/**
 * Psixolog uchun professional tahlil (faqat psixologik kontekst).
 * @param {object} categoryScores
 * @param {string} riskLevel — 'normal'|'medium'|'high'
 * @param {{ age?: number|null, className?: string|null }} studentInfo
 */
export async function getProfessionalAnalysis(categoryScores, riskLevel, studentInfo) {
  if (!categoryScores) {
    return null;
  }

  const age = studentInfo?.age ?? "—";
  const className = studentInfo?.className ?? "—";

  const d = categoryScores.delinquency?.percentage ?? 0;
  const a = categoryScores.addiction?.percentage ?? 0;
  const ag = categoryScores.aggression?.percentage ?? 0;
  const sh = categoryScores.self_harm?.percentage ?? 0;

  const dL = levelUz(categoryScores.delinquency?.level);
  const aL = levelUz(categoryScores.addiction?.level);
  const agL = levelUz(categoryScores.aggression?.level);
  const shL = levelUz(categoryScores.self_harm?.level);

  const system =
    "Sen tajribali maktab psixologisan. " +
    "Natijalarni professional tilda tahlil qil. " +
    "Xavf omillarini aniq ko'rsat. " +
    "Amaliy tavsiyalar ber. " +
    "O'zbek tilida yoz. Maksimum 250 so'z.";

  const user =
    "O'quvchi ma'lumotlari:\n" +
    `Yosh: ${age}, Sinf: ${className}\n` +
    "Test natijalari:\n" +
    `Huquqbuzarlik: ${d}% (${dL})\n` +
    `Zavisimlik: ${a}% (${aL})\n` +
    `Tajovuzkorlik: ${ag}% (${agL})\n` +
    `O'z-o'ziga zarar: ${sh}% (${shL})\n` +
    `Umumiy xavf: ${riskUz(riskLevel)}\n` +
    "Professional psixologik tahlil va amaliy tavsiyalar ber.";

  return await postChat({ system, user });
}
