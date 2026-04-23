import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { api, getApiErrorMessage } from "../lib/api";
import router from "../router";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const token = ref(localStorage.getItem("token") || "");
  const isLoading = ref(false);
  const errorMessage = ref("");

  const isAuthenticated = computed(() => Boolean(token.value) && Boolean(user.value));
  const currentUser = computed(() => user.value);

  const clearError = () => {
    errorMessage.value = "";
  };

  const setAuth = ({ nextToken, nextUser }) => {
    token.value = nextToken || "";
    user.value = nextUser || null;

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
  };

  const loginAdmin = async ({ email, password }) => {
    isLoading.value = true;
    clearError();

    try {
      const { data } = await api.post("/api/auth/admin/login", {
        email,
        password,
      });
      if (!data?.success || !data?.token || !data?.user) {
        throw new Error("Login muvaffaqiyatsiz.");
      }
      setAuth({ nextToken: data.token, nextUser: data.user });
      return data.user;
    } catch (error) {
      errorMessage.value = getApiErrorMessage(error, "Email yoki parol noto'g'ri");
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const loginPsychologist = async ({ email, password }) => {
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
      return data.user;
    } catch (error) {
      errorMessage.value = getApiErrorMessage(error, "Email yoki parol noto'g'ri");
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const loginStudentWithCode = async (schoolCode) => {
    isLoading.value = true;
    clearError();

    try {
      const { data } = await api.post("/api/auth/student/verify-school", { schoolCode });
      if (!data?.success) throw new Error("Maktab kodi noto'g'ri");
      return {
        schoolId: data.schoolId,
        schoolName: data.schoolName,
      };
    } catch (error) {
      errorMessage.value = getApiErrorMessage(error, "Maktab kodi noto'g'ri");
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const loginStudentWithId = async (studentId) => {
    isLoading.value = true;
    clearError();

    try {
      const normalized = String(studentId || "").trim().toUpperCase();
      if (!/^ST-\d{4}-[A-Z0-9]{4,}$/.test(normalized)) {
        throw new Error("Student ID formati noto'g'ri");
      }
      const res = await api.post("/api/auth/student/login", { studentId: normalized });
      if (!res.data?.success || !res.data?.token || !res.data?.user) {
        throw new Error("Student ID topilmadi");
      }
      setAuth({ nextToken: res.data.token, nextUser: res.data.user });

      await router.push("/student/dashboard");
      return res.data.user;
    } catch (error) {
      errorMessage.value = getApiErrorMessage(error, "Student ID topilmadi");
      setAuth({ nextToken: "", nextUser: null });
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
      setAuth({ nextToken: data.token, nextUser: data.user || null });
      return data.studentId || null;
    } catch (error) {
      errorMessage.value = getApiErrorMessage(error, "Ro'yxatdan o'tishda xatolik yuz berdi.");
      return null;
    } finally {
      isLoading.value = false;
    }
  };
  const fetchCurrentUser = async () => {
    isLoading.value = true;
    clearError();

    try {
      if (!token.value) {
        const lsToken = localStorage.getItem("token") || "";
        const rawUser = localStorage.getItem("user");
        if (!lsToken || !rawUser) {
          setAuth({ nextToken: "", nextUser: null });
          return null;
        }
        token.value = lsToken;
        try {
          user.value = JSON.parse(rawUser);
        } catch {
          setAuth({ nextToken: "", nextUser: null });
          return null;
        }
      }

      const role = user.value?.role;
      if (role === "student") {
        const { data } = await api.get("/api/students/me");
        if (!data?.success || !data?.student) throw new Error("Sessiya yaroqsiz");
        setAuth({ nextToken: token.value, nextUser: data.student });
        return data.student;
      }
      if (role === "psychologist") {
        const { data } = await api.get("/api/psychologist/stats");
        if (!data?.success) throw new Error("Sessiya yaroqsiz");
        return user.value;
      }
      if (role === "admin") {
        const { data } = await api.get("/api/admin/stats");
        if (!data?.success) throw new Error("Sessiya yaroqsiz");
        return user.value;
      }
      setAuth({ nextToken: "", nextUser: null });
      return null;
    } catch {
      setAuth({ nextToken: "", nextUser: null });
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
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