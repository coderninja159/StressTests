import { createClient } from "@supabase/supabase-js";

/**
 * Faqat vaqtinchalik auth amallari uchun (masalan, admin psixolog uchun signUp).
 * Session asosiy brauzer localStorage ga yozilmaydi — admin sessiyasi saqlanadi.
 */
const memoryStore = {};

const memoryStorage = {
  getItem: (key) => memoryStore[key] ?? null,
  setItem: (key, value) => {
    memoryStore[key] = value;
  },
  removeItem: (key) => {
    delete memoryStore[key];
  },
};

export function getEphemeralSupabase() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      storage: memoryStorage,
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
