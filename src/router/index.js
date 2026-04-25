import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { pinia } from "../stores";
import { logInfo, logWarn } from "../lib/logger";

import LoginView from "../views/auth/LoginView.vue";
import RegisterView from "../views/auth/RegisterView.vue";
import TelegramTasdiqDemoView from "../views/auth/TelegramTasdiqDemoView.vue";
import StudentDashboardView from "../views/student/DashboardView.vue";
import StudentTestView from "../views/student/TestView.vue";
import StudentResultView from "../views/student/ResultView.vue";
import PsychologistDashboardView from "../views/psychologist/DashboardView.vue";
import StudentsView from "../views/psychologist/StudentsView.vue";
import StudentDetailView from "../views/psychologist/StudentDetailView.vue";
import AdminDashboardView from "../views/admin/DashboardView.vue";
import SchoolsView from "../views/admin/SchoolsView.vue";
import PsychologistsView from "../views/admin/PsychologistsView.vue";
import TestsView from "../views/admin/TestsView.vue";
import PsychologistTestsView from "../views/psychologist/TestsView.vue";
import AnalyticsView from "../views/admin/AnalyticsView.vue";
import NotFoundView from "../views/NotFoundView.vue";
import ForbiddenView from "../views/ForbiddenView.vue";

const routes = [
  { path: "/", redirect: "/auth/login" },
  { path: "/auth/login", name: "login", component: LoginView },
  { path: "/auth/register", name: "register", component: RegisterView },
  {
    path: "/auth/telegram-tasdiq",
    name: "telegram-tasdiq-demo",
    component: TelegramTasdiqDemoView,
  },
  {
    path: "/student/dashboard",
    name: "student-dashboard",
    component: StudentDashboardView,
    meta: { requiresAuth: true, role: "student" },
  },
  {
    path: "/student/test",
    name: "student-test",
    component: StudentTestView,
    meta: { requiresAuth: true, role: "student" },
  },
  {
    path: "/student/result",
    name: "student-result",
    component: StudentResultView,
    meta: { requiresAuth: true, role: "student" },
  },
  {
    path: "/psychologist/dashboard",
    name: "psychologist-dashboard",
    component: PsychologistDashboardView,
    meta: { requiresAuth: true, role: "psychologist" },
  },
  {
    path: "/psychologist/students",
    name: "psychologist-students",
    component: StudentsView,
    meta: { requiresAuth: true, role: "psychologist" },
  },
  {
    path: "/psychologist/students/:studentId",
    name: "psychologist-student-detail",
    component: StudentDetailView,
    meta: { requiresAuth: true, role: "psychologist" },
  },
  {
    path: "/psychologist/tests",
    name: "psychologist-tests",
    component: PsychologistTestsView,
    meta: { requiresAuth: true, role: "psychologist" },
  },
  { path: "/admin", redirect: "/admin/dashboard" },
  {
    path: "/admin/dashboard",
    name: "admin-dashboard",
    component: AdminDashboardView,
    meta: { requiresAuth: true, role: "admin" },
  },
  {
    path: "/admin/schools",
    name: "admin-schools",
    component: SchoolsView,
    meta: { requiresAuth: true, role: "admin" },
  },
  {
    path: "/admin/psychologists",
    name: "admin-psychologists",
    component: PsychologistsView,
    meta: { requiresAuth: true, role: "admin" },
  },
  {
    path: "/admin/tests",
    name: "admin-tests",
    component: TestsView,
    meta: { requiresAuth: true, role: "admin" },
  },
  {
    path: "/admin/analytics",
    name: "admin-analytics",
    component: AnalyticsView,
    meta: { requiresAuth: true, role: "admin" },
  },
  { path: "/403", name: "forbidden", component: ForbiddenView },
  { path: "/:pathMatch(.*)*", name: "not-found", component: NotFoundView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const roleHomeMap = {
  student: "/student/dashboard",
  psychologist: "/psychologist/dashboard",
  admin: "/admin/dashboard",
};

// Himoya shart emas sahifalar
const publicRoutes = ["login", "register", "telegram-tasdiq-demo", "forbidden", "not-found"];

router.beforeEach(async (to) => {
  const authStore = useAuthStore(pinia);
  logInfo("ROUTER", "NAV_START", { to: to.fullPath, name: String(to.name || "") });

  // Public sahifalarga har doim o'tish mumkin (fetchCurrentUser chaqirmasdan)
  if (publicRoutes.includes(to.name)) {
    // Agar allaqachon kirgan bo'lsa, o'z dashboardiga yo'naltir
    if (authStore.isAuthenticated) {
      const user = authStore.currentUser;
      logInfo("ROUTER", "PUBLIC_REDIRECT_AUTHENTICATED", { role: user?.role || null });
      return roleHomeMap[user.role] || "/auth/login";
    }
    logInfo("ROUTER", "PUBLIC_ALLOW", { to: to.fullPath });
    return true;
  }

  // Himoyalangan sahifalar uchun:
  // Faqat user yo'q bo'lganda fetchCurrentUser chaqir
  if (!authStore.isAuthenticated) {
    logInfo("ROUTER", "PROTECTED_FETCH_SESSION");
    await authStore.fetchCurrentUser();
  }

  const user = authStore.currentUser;

  // User hali ham yo'q — login ga
  if (!user) {
    logWarn("ROUTER", "REDIRECT_LOGIN_NO_USER", { to: to.fullPath });
    return "/auth/login";
  }

  // Role tekshirish
  if (to.path.startsWith("/admin") && user.role !== "admin") {
    logWarn("ROUTER", "FORBIDDEN_ADMIN", { role: user.role, to: to.fullPath });
    return "/403";
  }

  if (to.path.startsWith("/psychologist") && user.role !== "psychologist") {
    logWarn("ROUTER", "FORBIDDEN_PSY", { role: user.role, to: to.fullPath });
    return "/403";
  }

  if (to.path.startsWith("/student") && user.role !== "student") {
    logWarn("ROUTER", "FORBIDDEN_STUDENT", { role: user.role, to: to.fullPath });
    return "/403";
  }

  logInfo("ROUTER", "NAV_ALLOW", { to: to.fullPath, role: user.role });
  return true;
});

export default router;