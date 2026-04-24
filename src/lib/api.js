import axios from "axios";

const DEFAULT_API_URL = "https://stresstest-backend-1012645166107.us-central1.run.app";
const API_URL = import.meta.env.DEV
  ? ""
  : String(import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});
export const apiClient = api;

function devApiDiagnostic(error) {
  if (!import.meta.env.DEV) return;
  const config = error?.config || {};
  const response = error?.response || {};
  const body = response?.data;
  const endpoint = `${String(config.method || "GET").toUpperCase()} ${config.url || ""}`;
  const requestId =
    response?.headers?.["x-request-id"] ||
    response?.headers?.["x-correlation-id"] ||
    body?.requestId ||
    body?.request_id ||
    "n/a";
  const message = serverMessageFromBody(body) || error?.message || "Unknown error";
  console.groupCollapsed(`[API][${response?.status || "ERR"}] ${endpoint}`);
  console.log({
    endpoint,
    status: response?.status || 0,
    message,
    requestId,
    body,
  });
  console.groupEnd();
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    devApiDiagnostic(error);

    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      if (window.location.pathname !== "/auth/login") {
        window.location.href = "/auth/login";
      }
    }

    if (status === 403) {
      error.userMessage = "Ruxsat yo'q";
      error.normalized = { status: 403, message: "Ruxsat yo'q" };
    }

    return Promise.reject(error);
  },
);

/** JSON yoki matn bodydan foydalanuvchi xabari */
export function serverMessageFromBody(body) {
  if (body == null) return "";
  if (typeof body === "string") {
    const t = body.trim();
    return t ? t.slice(0, 500) : "";
  }
  if (typeof body !== "object") return "";
  const m = body.message ?? body.error;
  if (typeof m === "string" && m.trim()) return m.trim();
  return "";
}

/** GET /api/psychologist/students — items | data | students */
export function psychologistStudentsItems(payload) {
  if (!payload || typeof payload !== "object") return [];
  const a = payload.items ?? payload.data ?? payload.students;
  return Array.isArray(a) ? a : [];
}

/** Natijalar ro'yxati: results | items | data */
export function coerceResultsArray(payload) {
  if (!payload || typeof payload !== "object") return [];
  const a = payload.results ?? payload.items ?? payload.data;
  return Array.isArray(a) ? a : [];
}

function retrySecondsFromError(error) {
  const headers = error?.response?.headers || {};
  const body = error?.response?.data;
  const fromHeader = Number(headers["retry-after"] ?? headers["Retry-After"] ?? 0);
  const fromBody = Number(body?.retryAfterSec ?? body?.retry_after_sec ?? 0);
  return fromBody || fromHeader || 0;
}

export function getRetryAfterSeconds(error) {
  return retrySecondsFromError(error);
}

export function getApiErrorMessage(error, fallback = "Xatolik yuz berdi.") {
  const status = error?.response?.status;
  const body = error?.response?.data;
  const code = body?.code;
  const backendMessage = serverMessageFromBody(body);

  if (status === 429 || code === "RATE_LIMITED") {
    if (backendMessage) return backendMessage;
    const retrySec = retrySecondsFromError(error);
    if (retrySec > 0) {
      const min = Math.ceil(retrySec / 60);
      return min > 1
        ? `Juda ko'p urinish. Taxminan ${min} daqiqadan keyin qayta urinib ko'ring.`
        : `Juda ko'p urinish. ${retrySec} soniyadan keyin qayta urinib ko'ring.`;
    }
    return "Juda ko'p urinish. Keyinroq qayta urinib ko'ring.";
  }

  if (backendMessage) return backendMessage;

  if (status === 400) return "Ma'lumotlar noto'g'ri kiritildi.";
  if (status === 401) return "Sessiya tugagan. Qayta kiring.";
  if (status === 403) return "Ruxsat yo'q.";
  if (status === 404) return "Ma'lumot topilmadi.";
  if (status >= 500) return "Server xatosi. Keyinroq urinib ko'ring.";
  return fallback;
}

/** POST /api/students/test/submit — 401 / 429 / 5xx uchun alohida matn + server message */
export function getTestSubmitErrorMessage(error) {
  const status = error?.response?.status;
  const body = error?.response?.data;
  const msg = serverMessageFromBody(body);
  if (status === 401) return msg || "Sessiya tugagan. Qayta kiring.";
  if (status === 429) {
    return (
      msg ||
      getApiErrorMessage(error, "So'rovlar chegarasi oshib ketdi. Biroz kutib qayta urinib ko'ring.")
    );
  }
  if (status != null && status >= 500) {
    return msg || "Server vaqtincha xato qaytardi. Keyinroq urinib ko'ring.";
  }
  return getApiErrorMessage(error, "Natijani saqlashda xatolik yuz berdi.");
}

export function technicalErrorDetails(error) {
  const body = error?.response?.data;
  const headers = error?.response?.headers || {};
  const requestId =
    headers["x-request-id"] ||
    headers["x-correlation-id"] ||
    body?.requestId ||
    body?.request_id ||
    null;
  return {
    endpoint: error?.config?.url || "",
    method: String(error?.config?.method || "GET").toUpperCase(),
    status: error?.response?.status || 0,
    message: serverMessageFromBody(body) || error?.message || "",
    requestId,
  };
}

/** fetch() uchun: body JSON, xato matni */
export async function readResponseJsonOrEmpty(response) {
  const text = await response.text();
  if (!text?.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export function normalizeStudentResultItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    id: raw.id ?? null,
    user_id: raw.user_id ?? raw.userId ?? null,
    test_type: raw.test_type ?? raw.testType ?? "",
    risk_level: raw.risk_level ?? null,
    total_score: Number(raw.total_score ?? raw.totalScore ?? 0) || 0,
    category_scores:
      raw.category_scores && typeof raw.category_scores === "object" ? raw.category_scores : {},
    personality_type: raw.personality_type ?? raw.personalityType ?? null,
    taken_at: raw.taken_at ?? raw.created_at ?? null,
  };
}

export function normalizeStudentResults(payload) {
  return coerceResultsArray(payload).map(normalizeStudentResultItem).filter(Boolean);
}
