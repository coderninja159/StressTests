import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { supabase } from "../lib/supabase";
import router from "../router";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const isLoading = ref(false);
  const errorMessage = ref("");

  const isAuthenticated = computed(() => Boolean(user.value));
  const currentUser = computed(() => user.value);

  const clearError = () => {
    errorMessage.value = "";
  };

  const generateStudentId = async () => {
    const year = new Date().getFullYear();
    const prefix = `ST-${year}-`;

    const { data, error } = await supabase
      .from("users")
      .select("student_id")
      .ilike("student_id", `${prefix}%`);

    if (error) {
      throw error;
    }

    const maxSequence = (data || []).reduce((max, item) => {
      const raw = item.student_id?.split("-")?.[2];
      const sequence = Number.parseInt(raw, 10);
      if (Number.isNaN(sequence)) {
        return max;
      }
      return Math.max(max, sequence);
    }, 0);

    const next = String(maxSequence + 1).padStart(4, "0");
    return `${prefix}${next}`;
  };

  const loginAdmin = async ({ email, password }) => {
    isLoading.value = true;
    clearError();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", data.user.id)
        .eq("role", "admin")
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        throw new Error("Email yoki parol noto'g'ri");
      }

      user.value = profile;
      return profile;
    } catch (error) {
      errorMessage.value = "Email yoki parol noto'g'ri";
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const loginPsychologist = async ({ email, password }) => {
    isLoading.value = true;
    clearError();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", data.user.id)
        .eq("role", "psychologist")
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        throw new Error("Email yoki parol noto'g'ri");
      }

      user.value = profile;
      return profile;
    } catch (error) {
      errorMessage.value = "Email yoki parol noto'g'ri";
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const loginStudentWithCode = async (schoolCode) => {
    isLoading.value = true;
    clearError();

    try {
      const { data, error } = await supabase
        .from("schools")
        .select("id, name")
        .eq("code", schoolCode)
        .eq("is_active", true)
        .single();

      if (error) throw error;

      return {
        schoolId: data.id,
        schoolName: data.name,
      };
    } catch (error) {
      errorMessage.value = "Maktab kodi noto'g'ri";
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const loginStudentWithId = async (studentId) => {
    isLoading.value = true;
    clearError();

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("student_id", studentId)
        .eq("role", "student")
        .single();

      if (error || !data) {
        throw new Error("Student ID topilmadi");
      }

      user.value = data;
      // Student sessiyasini saqlash
      localStorage.setItem("student_session", JSON.stringify(data));

      await router.push("/student/dashboard");
      return data;
    } catch (error) {
      errorMessage.value = "Student ID topilmadi";
      user.value = null;
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const registerStudent = async ({ fullName, age, className, schoolId }) => {
    isLoading.value = true;
    clearError();

    try {
      const studentId = await generateStudentId();

      const { data, error } = await supabase
        .from("users")
        .insert({
          full_name: fullName,
          age,
          class_name: className,
          school_id: schoolId,
          role: "student",
          student_id: studentId,
        })
        .select("*")
        .single();

      if (error) throw error;

      user.value = data;
      // Student sessiyasini saqlash
      localStorage.setItem("student_session", JSON.stringify(data));

      return studentId;
    } catch (error) {
      errorMessage.value = "Ro'yxatdan o'tishda xatolik yuz berdi.";
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchCurrentUser = async () => {
    isLoading.value = true;
    clearError();

    try {
      // Avval Supabase auth tekshirish (admin va psixolog uchun)
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        // Supabase auth yo'q — student sessiyasini tekshir
        const studentSession = localStorage.getItem("student_session");
        if (studentSession) {
          try {
            const studentData = JSON.parse(studentSession);
            user.value = studentData;
            return studentData;
          } catch {
            localStorage.removeItem("student_session");
          }
        }
        user.value = null;
        return null;
      }

      // Supabase auth bor — admin yoki psixolog
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", data.user.id)
        .single();

      if (profileError || !profile) {
        user.value = null;
        return null;
      }

      user.value = profile;
      return profile;
    } catch (error) {
      // Xato bo'lsa student sessiyasini tekshir
      const studentSession = localStorage.getItem("student_session");
      if (studentSession) {
        try {
          const studentData = JSON.parse(studentSession);
          user.value = studentData;
          return studentData;
        } catch {
          localStorage.removeItem("student_session");
        }
      }
      user.value = null;
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    isLoading.value = true;
    clearError();

    try {
      // Student sessiyasini o'chirish
      localStorage.removeItem("student_session");

      // Supabase auth sessiyasini o'chirish (admin/psixolog uchun)
      await supabase.auth.signOut();

      user.value = null;
      await router.push("/auth/login");
    } catch (error) {
      // Xato bo'lsa ham logout qilish
      user.value = null;
      localStorage.removeItem("student_session");
      await router.push("/auth/login");
    } finally {
      isLoading.value = false;
    }
  };

  return {
    user,
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