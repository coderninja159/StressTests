import axios from "axios";

const DEFAULT_API_URL = "https://stresstest-backend-1012645166107.us-central1.run.app";
const API_URL = String(import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

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

export function getApiErrorMessage(error, fallback = "Xatolik yuz berdi.") {
  const status = error?.response?.status;
  const backendMessage = error?.response?.data?.message || error?.response?.data?.error;
  if (backendMessage) return backendMessage;

  if (status === 400) return "Ma'lumotlar noto'g'ri kiritildi.";
  if (status === 401) return "Sessiya tugagan. Qayta kiring.";
  if (status === 403) return "Ruxsat yo'q.";
  if (status === 404) return "Ma'lumot topilmadi.";
  if (status === 429) return "Juda ko'p urinish. Keyinroq qayta urinib ko'ring.";
  if (status >= 500) return "Server xatosi. Keyinroq urinib ko'ring.";
  return fallback;
}
