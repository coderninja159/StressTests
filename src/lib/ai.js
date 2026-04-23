import { api } from "./api";

export async function getStudentExplanationByResultId(resultId) {
  if (!resultId) return null;
  try {
    const { data } = await api.post(`/api/ai/student-explanation/${encodeURIComponent(resultId)}`);
    return data?.success ? data.text || null : null;
  } catch {
    return null;
  }
}

export async function getProfessionalAnalysisByResultId(resultId) {
  if (!resultId) return null;
  try {
    const { data } = await api.post(`/api/ai/professional-analysis/${encodeURIComponent(resultId)}`);
    return data?.success ? data.text || null : null;
  } catch {
    return null;
  }
}