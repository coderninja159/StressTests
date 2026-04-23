/**
 * telegram_link_sessions — faqat service_role kalit bilan.
 */

import { randomBytes } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Telegram deep link: faqat A–Z a–z 0–9 _ */
export function generateLinkToken() {
  return randomBytes(18).toString("hex").slice(0, 36);
}

export async function createSession() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { ok: false, error: "no_supabase", message: "SUPABASE_SERVICE_ROLE_KEY yoki URL yo‘q." };
  }

  const link_token = generateLinkToken();
  const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error } = await supabase.from("telegram_link_sessions").insert({
    link_token,
    expires_at,
    status: "pending",
    metadata: {},
  });

  if (error) {
    return { ok: false, error: "insert_failed", message: error.message };
  }

  return { ok: true, link_token, expires_at };
}

export async function getSessionStatus(link_token) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { status: "error", message: "Supabase sozlanmagan." };
  }

  const { data, error } = await supabase
    .from("telegram_link_sessions")
    .select("status, expires_at, telegram_chat_id")
    .eq("link_token", link_token)
    .maybeSingle();

  if (error || !data) {
    return { status: "not_found" };
  }

  if (new Date(data.expires_at) < new Date()) {
    return { status: "expired", expires_at: data.expires_at };
  }

  return {
    status: data.status,
    expires_at: data.expires_at,
    telegram_chat_id: data.telegram_chat_id,
  };
}

export async function confirmTelegramSession(payload, chatId, username) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { ok: false, error: "no_supabase" };
  }

  const { data: row, error: selErr } = await supabase
    .from("telegram_link_sessions")
    .select("id, expires_at, status")
    .eq("link_token", payload)
    .maybeSingle();

  if (selErr || !row) {
    return { ok: false, error: "not_found" };
  }

  if (row.status !== "pending") {
    return { ok: false, error: "already_used" };
  }

  if (new Date(row.expires_at) < new Date()) {
    await supabase.from("telegram_link_sessions").update({ status: "expired" }).eq("id", row.id);
    return { ok: false, error: "expired" };
  }

  const { error: upErr } = await supabase
    .from("telegram_link_sessions")
    .update({
      status: "confirmed",
      telegram_chat_id: chatId,
      telegram_username: username ?? null,
    })
    .eq("id", row.id);

  if (upErr) {
    return { ok: false, error: "update_failed", message: upErr.message };
  }

  return { ok: true };
}
