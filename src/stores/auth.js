import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { api, getApiErrorMessage } from "../lib/api";
import { logError, logInfo, logWarn } from "../lib/logger";
import router from "../router";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const token = ref(localStorage.getItem("token") || "");
  const isLoading = ref(false);
  const errorMessage = ref("");
  const studentLoginLockedUntil = ref(0);

  const isAuthenticated = computed(() => Boolean(token.value) && Boolean(user.value));
  const currentUser = computed(() => user.value);

  const clearError = () => {
    errorMessage.value = "";
  };

  const normalizeUser = (raw) => {
    if (!raw || typeof raw !== "object") return null;
    return {
      ...raw,
      id: raw.id ?? raw.user_id ?? null,
      role: raw.role || raw.userRole || "",
      full_name: raw.full_name || raw.fullName || "",
      student_id: raw.student_id || raw.studentId || null,
      class_name: raw.class_name || raw.className || null,
      school_id: raw.school_id || raw.schoolId || null,
      school_name: raw.school_name || raw.schoolName || null,
    };
  };

  const studentFromMePayload = (payload) => {
    if (!payload || typeof payload !== "object") return null;
    return payload.student || payload.data || null;
  };

  const setAuth = ({ nextToken, nextUser }) => {
    token.value = nextToken || "";
    user.value = normalizeUser(nextUser);

    if (token.value) localStorage.setItem("token", token.value);
    else localStorage.removeItem("token");

    if (user.value) {
      localStorage.setItem("user", JSON.stringify(user.value));
      localStorage.setItem("role", String(user.value.role || ""));
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("role");
    }
    localStorage.removeItem("auth_user");
    logInfo("AUTH", "SET_AUTH", {
      hasToken: Boolean(token.value),
      role: user.value?.role || null,
      userId: user.value?.id || null,
    });
  };

  const loginAdmin = async ({ email, password }) => {
    isLoading.value = true;
    clearError();
    logInfo("AUTH", "LOGIN_ADMIN_START", { email });

    try {
      const { data } = await api.post("/api/auth/admin/login", {
        email,
        password,
      });
      if (!data?.success || !data?.token || !data?.user) {
        throw new Error("Login muvaffaqiyatsiz.");
      }
      setAuth({ nextToken: data.token, nextUser: data.user });
      logInfo("AUTH", "LOGIN_ADMIN_OK", { userId: data.user?.id, role: data.user?.role });
      return data.user;
    } catch (error) {
      errorMessage.value = getApiErrorMessage(error, "Email yoki parol noto'g'ri");
      logError("AUTH", "LOGIN_ADMIN_FAIL", { message: errorMessage.value });
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const loginPsychologist = async ({ email, password }) => {
    logInfo("AUTH", "LOGIN_PSY_START", { email });
    isLoading.value = true;
    clearError();

    try {
      const { data } = await api.post("/api/auth/psychologist/login", {
        email,
        password,
      });
      if (!data?.success || !data?.token || !data?.user) {
        throw new Error("Login muvaffaqiyatsiz.");
      }
      setAuth({ nextToken: data.token, nextUser: data.user });
      logInfo("AUTH", "LOGIN_PSY_OK", { userId: data.user?.id, role: data.user?.role });
      return data.user;
    } catch (error) {
      errorMessage.value = getApiErrorMessage(error, "Email yoki parol noto'g'ri");
      logError("AUTH", "LOGIN_PSY_FAIL", { message: errorMessage.value });
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const loginStudentWithCode = async (schoolCode) => {
    logInfo("AUTH", "VERIFY_SCHOOL_START", { schoolCode });
    isLoading.value = true;
    clearError();

    try {
      const { data } = await api.post("/api/auth/student/verify-school", { schoolCode });
      if (!data?.success) throw new Error("Maktab kodi noto'g'ri");
      logInfo("AUTH", "VERIFY_SCHOOL_OK", { schoolId: data.schoolId, schoolName: data.schoolName });
      return {
        schoolId: data.schoolId,
        schoolName: data.schoolName,
      };
    } catch (error) {
      errorMessage.value = getApiErrorMessage(error, "Maktab kodi noto'g'ri");
      logError("AUTH", "VERIFY_SCHOOL_FAIL", { message: errorMessage.value });
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const loginStudentWithId = async (studentId) => {
    logInfo("AUTH", "LOGIN_STUDENT_START", { studentId });
    isLoading.value = true;
    clearError();

    try {
      if (studentLoginLockedUntil.value > Date.now()) {
        const sec = Math.ceil((studentLoginLockedUntil.value - Date.now()) / 1000);
        throw new Error(`Juda ko'p urinish. ${sec} soniyadan keyin qayta urinib ko'ring.`);
      }
      const raw = String(studentId || "").trim();
      const normalized = raw.toUpperCase();
      // Backend: ST-YYYY-<suffix>
      if (!/^ST-\d{4}-[A-Z0-9_]+$/i.test(normalized)) {
        throw new Error("Student ID formati noto'g'ri");
      }

      // Ba'zi backendlarda student_id qidiruvi formatga sezgir bo'lishi mumkin.
      // Shu sabab original + uppercase + "_" olib tashlangan fallbacklarni sinaymiz.
      const candidates = [...new Set([
        raw,
        normalized,
        normalized.replace(/_/g, ""),
      ])].filter(Boolean);

      let loginData = null;
      let lastError = null;
      for (const candidate of candidates) {
        try {
          const res = await api.post("/api/auth/student/login", { studentId: candidate });
          if (res.data?.success && res.data?.token && res.data?.user) {
            loginData = res.data;
            break;
          }
          lastError = new Error("Student ID topilmadi");
        } catch (err) {
          lastError = err;
          const st = err?.response?.status;
          // Rate-limit / auth / server xatolarida ortiqcha qayta urinish qilmaymiz.
          if (st === 401 || st === 429 || (st && st >= 500)) {
            throw err;
          }
        }
      }

      if (!loginData) {
        throw lastError || new Error("Student ID topilmadi");
      }

      setAuth({
        nextToken: loginData.token,
        nextUser: { ...loginData.user, role: loginData.user?.role || "student" },
      });
      logInfo("AUTH", "LOGIN_STUDENT_OK", {
        userId: loginData.user?.id,
        role: loginData.user?.role || "student",
      });

      await router.push("/student/dashboard");
      return loginData.user;
    } catch (error) {
      const body = error?.response?.data || {};
      const retryAfter =
        Number(error?.response?.headers?.["retry-after"] || 0) ||
        Number(body.retryAfterSec ?? body.retry_after_sec ?? 0);
      if (error?.response?.status === 429 && retryAfter > 0) {
        studentLoginLockedUntil.value = Date.now() + retryAfter * 1000;
        logWarn("AUTH", "LOGIN_STUDENT_RATE_LIMITED", { retryAfterSec: retryAfter });
      }
      errorMessage.value = getApiErrorMessage(error, "Student ID topilmadi");
      // 429: rate-limit — mavjud sessiyani buzmaymiz; boshqa xatolarda ham login oldidan token bo'lmaydi
      if (error?.response?.status !== 429) {
        setAuth({ nextToken: "", nextUser: null });
      }
      logError("AUTH", "LOGIN_STUDENT_FAIL", { message: errorMessage.value });
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const buildStudentFullName = (firstName, lastName) =>
    [firstName, lastName]
      .map((s) => String(s || "").trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

  const registerStudent = async ({ firstName, lastName, age, className, schoolId, phone }) => {
    logInfo("AUTH", "REGISTER_STUDENT_START", { className, schoolId, age });
    isLoading.value = true;
    clearError();

    const fullName = buildStudentFullName(firstName, lastName);
    const normalizedPhone = String(phone || "")
      .replace(/\s/g, "")
      .trim();

    try {
      const { data } = await api.post("/api/auth/student/register", {
        fullName,
        phone: normalizedPhone,
        age,
        className,
        schoolId,
      });
      if (!data?.success) {
        throw new Error("Ro'yxatdan o'tishda xatolik.");
      }
      if (data.token) {
        setAuth({
          nextToken: data.token,
          nextUser: normalizeUser({
            ...(data.user || {}),
            id: data.user?.id ?? data.userId,
            role: data.user?.role || "student",
          }),
        });
      } else {
        logWarn("AUTH", "REGISTER_STUDENT_NO_TOKEN", {
          studentId: data.studentId || null,
        });
      }
      logInfo("AUTH", "REGISTER_STUDENT_OK", {
        studentId: data.studentId || null,
        userId: data.user?.id ?? data.userId ?? null,
      });
      return data.studentId || null;
    } catch (error) {
      errorMessage.value = getApiErrorMessage(error, "Ro'yxatdan o'tishda xatolik yuz berdi.");
      logError("AUTH", "REGISTER_STUDENT_FAIL", { message: errorMessage.value });
      return null;
    } finally {
      isLoading.value = false;
    }
  };
  const fetchCurrentUser = async () => {
    logInfo("AUTH", "FETCH_CURRENT_USER_START");
    isLoading.value = true;
    clearError();

    try {
      if (!token.value) {
        const lsToken = localStorage.getItem("token") || "";
        const rawUser = localStorage.getItem("user");
        if (!lsToken) {
          setAuth({ nextToken: "", nextUser: null });
          logWarn("AUTH", "FETCH_CURRENT_USER_NO_TOKEN");
          return null;
        }
        token.value = lsToken;
        if (rawUser) {
          try {
            user.value = normalizeUser(JSON.parse(rawUser));
          } catch {
            user.value = null;
          }
        }
      }

      // Ro'yxatdan keyin yoki local user shape to'liq bo'lmaganda — avval student endpointni sinaymiz
      if (!user.value || !user.value.role) {
        try {
          const { data } = await api.get("/api/students/me");
          const student = studentFromMePayload(data);
          if (data?.success && student) {
            setAuth({
              nextToken: token.value,
              nextUser: normalizeUser({ ...student, role: "student" }),
            });
            return user.value;
          }
        } catch {
          // next role checks
        }
      }

      const role = user.value?.role;
      if (role === "student") {
        const { data } = await api.get("/api/students/me");
        const student = studentFromMePayload(data);
        if (!data?.success || !student) throw new Error("Sessiya yaroqsiz");
        setAuth({
          nextToken: token.value,
          nextUser: normalizeUser({ ...student, role: "student" }),
        });
        logInfo("AUTH", "FETCH_CURRENT_USER_OK", { role: "student", userId: user.value?.id || null });
        return user.value;
      }
      if (role === "psychologist") {
        const { data } = await api.get("/api/psychologist/stats");
        if (!data?.success) throw new Error("Sessiya yaroqsiz");
        logInfo("AUTH", "FETCH_CURRENT_USER_OK", { role: "psychologist", userId: user.value?.id || null });
        return user.value;
      }
      if (role === "admin") {
        const { data } = await api.get("/api/admin/stats");
        if (!data?.success) throw new Error("Sessiya yaroqsiz");
        logInfo("AUTH", "FETCH_CURRENT_USER_OK", { role: "admin", userId: user.value?.id || null });
        return user.value;
      }
      // Agar role backenddan kelmasa, student sifatida tiklashga yana bir marta urinamiz
      try {
        const { data } = await api.get("/api/students/me");
        const student = studentFromMePayload(data);
        if (data?.success && student) {
          setAuth({
            nextToken: token.value,
            nextUser: normalizeUser({ ...student, role: "student" }),
          });
          return user.value;
        }
      } catch {
        // ignore
      }
      setAuth({ nextToken: "", nextUser: null });
      logWarn("AUTH", "FETCH_CURRENT_USER_CLEARED");
      return null;
    } catch (error) {
      const status = error?.response?.status;
      // 5xx / 429: vaqtinchalik — token va local userni saqlab qolamiz
      if (
        token.value &&
        user.value &&
        ((status && status >= 500) || status === 429)
      ) {
        logWarn("AUTH", "FETCH_CURRENT_USER_TEMP_ERROR_KEEP_SESSION", { status });
        return user.value;
      }
      setAuth({ nextToken: "", nextUser: null });
      logError("AUTH", "FETCH_CURRENT_USER_FAIL", { status: status || 0 });
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    logInfo("AUTH", "LOGOUT_START");
    isLoading.value = true;
    clearError();

    try {
      if (token.value) {
        await api.post("/api/auth/logout");
      }
    } catch {
      // intentionally ignored
    } finally {
      setAuth({ nextToken: "", nextUser: null });
      await router.push("/auth/login");
      logInfo("AUTH", "LOGOUT_DONE");
      isLoading.value = false;
    }
  };

  return {
    user,
    token,
    isLoading,
    errorMessage,
    isAuthenticated,
    currentUser,
    loginAdmin,
    loginPsychologist,
    loginStudentWithCode,
    loginStudentWithId,
    registerStudent,
    fetchCurrentUser,
    logout,
    clearError,
  };
});