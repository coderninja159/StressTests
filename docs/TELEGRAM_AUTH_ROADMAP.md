# Telegram orqali ro‘yxatdan o‘tish / tasdiqlash — reja va roadmap

Bu hujjat **StressTest** loyihasida Telegram bot orqali foydalanuvchini bog‘lash, tasdiqlash va (keyinchalik) bir martalik havola + xavfsiz kirish modulini bosqichma-bosqich joriy qilish uchun yo‘l xaritasi.

---

## 1. Asosiy g‘oya (qisqa)

1. **Sayt:** o‘quvchi “Telegram orqali davom etish”ni tanlaydi → server **bir martalik `link_token`** yaratadi va `https://t.me/YourBot?start=<link_token>` havolasini ko‘rsatadi.
2. **Telegram:** foydalanuvchi botga kiradi, `/start <link_token>` yuboriladi (havola ustidagi tugma ham shuni qiladi).
3. **Bot:** tokenni serverga yuboradi → server **web sessiyasini** shu `chat_id` bilan bog‘laydi (yoki “kutilayotgan ro‘yxat” yozuvini tasdiqlaydi).
4. **Keyingi qadam:** barcha shaxsiy ma’lumot **faqat saytda** to‘ldiriladi (tavsiya) yoki minimal ma’lumot botda — lekin **bitta manba** siyosatini buzmaslik kerak.
5. **Tasdiq tugagach:** server **bir martalik login havolasi** (1–2 daqiqa) va/alohida **doimiy kirish uchun maxfiy identifikator** (random, xeshlangan) generatsiya qiladi; foydalanuvchiga bot orqali yoki saytda ko‘rsatiladi.

---

## 2. Nimalar qilish kerak (tayyorlik ro‘yxati)

| # | Vazifa | Kim / qayerda |
|---|--------|----------------|
| 1 | **@BotFather** da bot yaratish, `BOT_TOKEN` olish | Siz |
| 2 | **HTTPS** domen (webhook uchun majburiy): VPS, Railway, Fly.io, Render | Siz |
| 3 | **Webhook URL** belgilash: `https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://sizning-domen.com/telegram/webhook` | Deploydan keyin |
| 4 | **Supabase** jadval yoki `telegram_link_sessions`, `login_magic_tokens` (yoki mavjud `users` ga `telegram_chat_id`, `telegram_username`) | Dasturchi |
| 5 | **Backend** webhook qabul qiladigan endpoint (Vue emas — alohida Node yoki Supabase Edge Function) | Dasturchi |
| 6 | **`.env`** — `TELEGRAM_BOT_TOKEN`, `WEBHOOK_SECRET` (ixtiyoriy), `APP_BASE_URL` | DevOps |
| 7 | **Sayt UI** — Telegram yo‘li, havola, holat (“Botda Start bosing”), muvaffaqiyat | Frontend |

---

## 3. Arxitektura (tavsiya)

```
[Brauzer: Vue SPA]  --REST-->  [Backend: Node / Edge]
                                  |
                    +------------+------------+
                    |                         |
              [Supabase DB]            [Telegram API]
```

- **Vue (Vite)** to‘g‘ridan-to‘g‘ri Telegram webhook qabul qila olmaydi** (build statik). Shuning uchun webhook **alohida server**da.
- Variantlar: **kichik Node server** (`telegram-bot/` papkasida), **Supabase Edge Functions**, **Cloudflare Workers**.

---

## 4. Bosqichlar (roadmap)

### Faza 0 — Tayyorlik (1–3 kun)
- [ ] BotFather → bot nomi, token
- [ ] Domen + SSL
- [ ] DB sxemasi: `link_token`, `expires_at`, `chat_id`, `user_id` (nullable), `status` (`pending` / `confirmed` / `expired`)
- [ ] Xavfsizlik: token UUID, TTL 15 daqiqagacha; rate limit

### Faza 1 — Minimal bot (3–5 kun)
- [ ] Webhook o‘rnatish, yangilanishlarni qabul qilish
- [ ] `/start` — parametrsiz: “StressTest boti. Ro‘yxatdan o‘tish uchun saytdan havola oling.”
- [ ] `/start <payload>` — payloadni serverga yuborish, DB tekshirish, `chat_id` saqlash
- [ ] Xato / muddati o‘tgan → tushunarli xabar

### Faza 2 — Web integratsiyasi (5–10 kun)
- [ ] Ro‘yxatdan o‘tish oqimida “Telegram bilan tasdiqlash” tugmasi
- [ ] Backend: `POST /api/telegram/start-session` → `link_token` + `t.me/...?start=...`
- [ ] Saytda polling yoki WebSocket **shart emas** — foydalanuvchi “Tasdiqlandi” uchun **“Tekshirish”** tugmasi yoki 3–5 soniyada bir marta `GET /api/telegram/session-status?token=...`
- [ ] Tasdiqlangach — mavjud `/student/register` qadamiga o‘tish yoki forma ochilish

### Faza 3 — Magic link + kirish (7–14 kun)
- [ ] Tasdiqdan keyin **bir martalik** `https://sayt.uz/auth/verify?token=...` (1–2 daqiqa, bir marta ishlatish)
- [ ] **Doimiy kirish:** ketma-ket Student ID o‘rniga **random `login_secret`** (serverda bcrypt/argon2) yoki **PIN** majburiy o‘rnatish
- [ ] Eski “faqat Student ID” oqimini bosqichma-bosqich almashtirish yoki ikkala usulni parallel saqlash (CPO qarori)

### Faza 4 — Prod va nazorat (doimiy)
- [ ] Loglar: `/start` xatolari, token reuse urinishlari
- [ ] Kanalga xabar (ixtiyoriy): faqat **anonim** yoki minimal (maktab kodi, vaqt) — shaxsiy ma’lumotni ochiq kanalga yozmang
- [ ] GDPR / mahalliy qonun: o‘quvchi va ota-ona roziligi matni

---

## 5. Vaqt taxmini (kichik jamoa)

| Faza | Taxminiy muddat |
|------|------------------|
| 0 | 1–3 kun |
| 1 | 3–5 kun |
| 2 | 5–10 kun |
| 3 | 7–14 kun |
| 4 | ketma-ket |

**MVP (eng tez yo‘l):** Faza 0 + 1 + 2ning yarimi — faqat “sayt ↔ bot bog‘lash + chat_id saqlash”, magic link **keyingi sprint**.

---

## 6. Xavfsizlik eslatmalari

- `start` parametri **uzun va taxmin qilib bo‘lmasin** (UUID yoki signed JWT).
- Bir token — **bir marta** ishlatish; muddati o‘tgach — o‘chirish.
- Webhook endpointda **Telegram `secret_token`** header tekshiruvi (BotFather orqali sozlash).
- **Hech qachon** ochiq kanalga magic link yubormang.

---

## 7. Loyihadagi kod boshlanishi

Repoda `telegram-bot/` papkasi: minimal **polling** rejimi (`npm run dev`) va keyin **webhook** uchun tayyor struktura.

---

## 8. Bajarish rejasi — “hammasini boshlash” tartibi

Quyidagi tartibda ishlang: avval **ma’lumot va qoidalar**, keyin **bot + server**, oxirida **Vue**. Oldingi bosqich “tayyor” bo‘lmasa keyingisiga o‘tmang.

### Sprint 0 — Tayyorlik (0.5–1 kun)

| # | Vazifa | Done |
|---|--------|------|
| 0.1 | `@BotFather` → bot, `TELEGRAM_BOT_TOKEN` | Token `.env` da (faqat gitga emas) |
| 0.2 | `telegram-bot/.env` to‘ldirish | `npm run dev` → `/start` javob beradi |
| 0.3 | Supabase loyiha ochiq, lokal `.env` da `VITE_SUPABASE_*` ishlaydi | Mavjud StressTest login/register tekshiruvdan o‘tdi |
| 0.4 | **Webhook domeni** qaror: hozircha lokal bo‘lsa faqat **polling**; prod uchun domen nomini yozib qo‘ying | Hujjatda URL yozilgan |

### Sprint 1 — Baza va RLS (1–2 kun)

| # | Vazifa | Done |
|---|--------|------|
| 1.1 | `supabase/migrations/005_telegram_link_sessions.sql` ni tekshirish / deploy | SQL fayl repoda |
| 1.2 | Jadval (tavsiya): `telegram_link_sessions` | Ustunlar: `id`, `link_token` (unique), `expires_at`, `telegram_chat_id` (nullable), `telegram_username` (nullable), `status` (`pending` \| `confirmed` \| `expired` \| `consumed`), `created_at`, ixtiyoriy `metadata` (jsonb) |
| 1.3 | **RLS:** anon client yozmasin yoki faqat `insert` cheklangan; o‘qish/yangilash **service_role** yoki Edge | Supabase Dashboardda siyosat ishga tushgan |
| 1.4 | SQL ni **Supabase SQL Editor** da bajarish | Jadval prod/stagingda mavjud |

### Sprint 2 — Backend (bot + DB ulanishi) (3–6 kun)

**Tanlov:** `telegram-bot` ni **Express + webhook** ga kengaytirish **yoki** **Supabase Edge Function**. Bittasini tanlang, ikkalasini bir vaqtda emas.

| # | Vazifa | Done |
|---|--------|------|
| 2.1 | `POST /session` (yoki Edge): `link_token` generatsiya, DB ga `pending` yozish, `expires_at` | Postman/curl bilan 201 + token |
| 2.2 | Webhook: `/start <payload>` → DB da token topilsa → `telegram_chat_id` yozish, `confirmed`, foydalanuvchiga “Tasdiqlandi” xabari | Telegramda test |
| 2.3 | `GET /session/:token` yoki Edge: status qaytaradi (`pending` / `confirmed` / …) | Vue dan chaqirishga tayyor |
| 2.4 | `secret_token` (Telegram) webhook tekshiruvi | Noto‘g‘ri so‘rov rad etiladi |
| 2.5 | HTTPS da **setWebhook** | `getWebhookInfo` toza |

### Sprint 3 — Vue (frontend) (4–8 kun)

| # | Vazifa | Done |
|---|--------|------|
| 3.1 | Ro‘yxat oqimida “Telegram bilan tasdiqlash” yo‘li (alohida qadam yoki tab) | UI bor |
| 3.2 | `start-session` chaqiruv → havola ko‘rsatish + “Botda Start bosing” | Foydalanuvchi botga o‘tadi |
| 3.3 | “Holatni tekshirish” tugmasi yoki avto-poll (masalan 3 s) → `confirmed` bo‘lsa keyingi qadam | Mavjud forma ochiladi |
| 3.4 | Xato holatlar: muddati o‘tdi, noto‘g‘ri token | Matn + qayta boshlash |

### Sprint 4 — Magic link + doimiy kirish (keyingi bosqich)

| # | Vazifa | Done |
|---|--------|------|
| 4.1 | `confirmed` dan keyin bir martalik URL token (serverda), muddati 1–2 daqiqa | Bir marta ochiladi |
| 4.2 | Keyingi kirish: PIN yoki random identifikator (serverda xesh) | CPO bilan matn kelishuvi |

### Sprint 5 — Prod

| # | Vazifa | Done |
|---|--------|------|
| 5.1 | Monitoring / loglar | Xato izi |
| 5.2 | Kanal xabari (agar kerak) — shaxsiy ma’lumotsiz | Qabul qilingan matn |

---

## 9. Birinchi hafta — kunlik (ixtiyoriy)

| Kun | Fokus |
|-----|--------|
| **1** | Sprint 0 to‘liq + Sprint 1.1–1.2 (SQL yozish) |
| **2** | Sprint 1.3–1.4 (RLS + migratsiya deploy) |
| **3** | Sprint 2.1 (token yaratish endpoint) |
| **4** | Sprint 2.2–2.3 (webhook + status) |
| **5** | Sprint 2.4–2.5 + Sprint 3.1–3.2 (HTTPS + UI boshlanishi) |

Hafta oxirida **MVP:** sayt token yaratadi → foydalanuvchi botda `/start token` → status `confirmed` → sayt keyingi qadamga o‘tadi. **Magic link** keyingi haftaga qoldirilishi mumkin.

---

## 10. Hozirgi repoda nima bor / nimani keyin yozasiz

| Holat | Joy |
|--------|-----|
| **Bor** | `telegram-bot/` (polling), `docs/TELEGRAM_AUTH_ROADMAP.md` |
| **Keyin yoziladi** | `supabase/migrations/...telegram...sql`, webhook server yoki Edge, Vue qadamlari |

---

## 11. Keyingi bitta amaliy qadam (hozir)

1. `telegram-bot/.env` → token → `npm run dev` → Telegramda `/start` tekshiring.  
2. Shu parallelda — `telegram_link_sessions` uchun SQL loyihasini yozing (Sprint 1.2 ustunlari bo‘yicha).

Shundan keyin **Sprint 2** uchun “Edge yoki Node webhook” tanlovini qat’iy qiling — ikkalasi ham yo‘l, lekin bittasi bilan boring.
