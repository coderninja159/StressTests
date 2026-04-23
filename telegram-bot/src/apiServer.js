/**
 * Lokal API: Vue → Vite proxy → bu server.
 */

import express from "express";
import cors from "cors";

import { createSession, getSessionStatus } from "./sessions.js";

let cachedBotUsername = null;

async function getBotUsername(botToken) {
  if (cachedBotUsername) {
    return cachedBotUsername;
  }
  const r = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
  const j = await r.json();
  if (!j.ok || !j.result?.username) {
    throw new Error(j.description || "getMe muvaffaqiyatsiz");
  }
  cachedBotUsername = j.result.username;
  return cachedBotUsername;
}

export function startApiServer(botToken) {
  const app = express();
  const port = Number(process.env.TELEGRAM_API_PORT || 3847);

  app.use(cors({ origin: true }));
  app.use(express.json());

  app.get("/api/telegram/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/api/telegram/session", async (_req, res) => {
    try {
      const created = await createSession();
      if (!created.ok) {
        const code = created.error === "no_supabase" ? 503 : 500;
        return res.status(code).json({
          error: created.message || created.error || "Xato",
        });
      }

      const username = await getBotUsername(botToken);
      const deep_link = `https://t.me/${username}?start=${created.link_token}`;

      return res.json({
        link_token: created.link_token,
        expires_at: created.expires_at,
        deep_link,
      });
    } catch (e) {
      return res.status(500).json({ error: String(e.message || e) });
    }
  });

  app.get("/api/telegram/session/:token", async (req, res) => {
    try {
      const status = await getSessionStatus(req.params.token);
      return res.json(status);
    } catch (e) {
      return res.status(500).json({ error: String(e.message || e) });
    }
  });

  return new Promise((resolve) => {
    app.listen(port, "127.0.0.1", () => {
      console.info(`[api] http://127.0.0.1:${port} — POST /api/telegram/session`);
      resolve(app);
    });
  });
}
