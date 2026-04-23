/**
 * StressTest Telegram bot + lokal sessiya API.
 * Reja: docs/TELEGRAM_AUTH_ROADMAP.md
 *
 * Ishga tushirish: telegram-bot papkasida `npm run dev`
 * Vue: Vite proxy /api/telegram → bu server (3847)
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import { Telegraf } from "telegraf";

import { startApiServer } from "./apiServer.js";
import { confirmTelegramSession } from "./sessions.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN .env da yo‘q.");
  process.exit(1);
}

const bot = new Telegraf(token);

bot.start(async (ctx) => {
  const payload = (ctx.startPayload || "").trim();
  const name = ctx.from?.first_name || "Foydalanuvchi";

  if (!payload) {
    return ctx.reply(
      [
        `Salom, ${name}!`,
        "",
        "Bu — StressTest boti.",
        "Saytdan berilgan havola bilan kiring — tugma ostida /start avtomatik yuboriladi.",
      ].join("\n"),
    );
  }

  const out = await confirmTelegramSession(payload, ctx.chat?.id, ctx.from?.username);

  if (out.ok) {
    return ctx.reply(
      [
        "✅ Telegram tasdiqlandi.",
        "",
        "Saytga qayting va «Holatni tekshirish» tugmasini bosing (yoki sahifa avtomatik yangilanadi).",
      ].join("\n"),
    );
  }

  if (out.error === "expired") {
    return ctx.reply("⏱ Havola muddati tugagan. Saytdan yangi havola oling.");
  }
  if (out.error === "not_found") {
    return ctx.reply("❓ Bu havola topilmadi. Saytdan yangi sessiya yarating.");
  }
  if (out.error === "already_used") {
    return ctx.reply("ℹ️ Bu havola allaqachon ishlatilgan.");
  }
  if (out.error === "no_supabase") {
    return ctx.reply("⚙️ Server sozlanmagan (Supabase service role). Administratorga murojaat qiling.");
  }

  console.error("[/start] confirm:", out);
  return ctx.reply("❌ Vaqtinchalik xato. Keyinroq urinib ko‘ring.");
});

bot.command("help", (ctx) =>
  ctx.reply("Yordam: sayt orqali «Telegram tasdiq» qadamidan havola oling."),
);

bot.catch((err, ctx) => {
  console.error("Bot xato:", err);
  return ctx.reply("Vaqtinchalik xato. Keyinroq urinib ko‘ring.");
});

const useWebhook = Boolean(process.env.WEBHOOK_DOMAIN && process.env.WEBHOOK_PATH);

async function main() {
  if (useWebhook) {
    const domain = process.env.WEBHOOK_DOMAIN.replace(/\/$/, "");
    const webhookPath = process.env.WEBHOOK_PATH.startsWith("/")
      ? process.env.WEBHOOK_PATH
      : `/${process.env.WEBHOOK_PATH}`;

    await bot.telegram.setWebhook(`${domain}${webhookPath}`);
    console.info("Webhook o‘rnatildi:", `${domain}${webhookPath}`);
    console.info("Webhook rejimi: HTTP server alohida kerak.");
    return;
  }

  await startApiServer(token);

  const info = await bot.telegram.getWebhookInfo();
  if (info.url) {
    console.warn("[telegram] Webhook faol edi:", info.url, "→ deleteWebhook.");
  }
  await bot.telegram.deleteWebhook({ drop_pending_updates: false });
  await bot.launch();
  console.info("[telegram] Polling ishlamoqda + API tayyor.");
}

main().catch((err) => {
  console.error("[telegram] Ishga tushmadi:", err?.message || err);
  if (String(err?.message || "").includes("401")) {
    console.error("Token noto'g'ri — @BotFather dan yangi token.");
  }
  process.exit(1);
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
