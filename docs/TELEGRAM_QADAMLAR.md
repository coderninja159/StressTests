# Telegram tasdiq — qadam-baqadam (lokal)

## Talablar

- `005_telegram_link_sessions.sql` Supabase’da bajarilgan bo‘lsin.
- Loyiha ildizidagi `.env` da:
  - `VITE_SUPABASE_URL` yoki `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` — **faqat server/bot uchun**; gitga **qo‘ymang**.
  - `TELEGRAM_BOT_TOKEN`

`SERVICE_ROLE` kalitni olish: Supabase Dashboard → **Settings → API → service_role** (`secret`).

---

## 1-qadam: migratsiya

SQL Editor’da `supabase/migrations/005_telegram_link_sessions.sql` ni ishga tushiring.

---

## 2-qadam: `.env`

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # service_role, anon emas!
TELEGRAM_BOT_TOKEN=...
```

---

## 3-qadam: ikkita terminal

**Terminal A** — bot + API:

```bash
cd stresstest/telegram-bot
npm install
npm run dev
```

Kutilgan log: `[api] http://127.0.0.1:3847` va `[telegram] Polling ishlamoqda`.

**Terminal B** — Vue:

```bash
cd stresstest
npm run dev
```

---

## 4-qadam: brauzer

1. Oching: `http://localhost:5173/auth/telegram-tasdiq`
2. **Sessiya yaratish** → havola chiqadi.
3. Havolani bosing → Telegramda **Start**.
4. Saytga qaytib **Holatni tekshirish** → `Tasdiqlandi`.

---

## Muammo bo‘lsa

| Alomat | Tekshirish |
|--------|------------|
| `503` / Supabase xato | `SUPABASE_SERVICE_ROLE_KEY` va migratsiya |
| `fetch failed` / proxy | Terminal A ishlayaptimi, port `3847` |
| Bot javob bermaydi | `deleteWebhook`, token, terminal ochiq |
| `not_found` | Token muddati yoki noto‘g‘ri havola |

---

## Keyingi ish (keyingi sprint)

- `RegisterView` ga shu oqimni qo‘shish (maktab kodi dan keyin).
- Prod: API ni HTTPS domen orqali deploy; `VITE_TELEGRAM_API_URL` yoki proxy sozlash.
