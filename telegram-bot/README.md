# StressTest — Telegram bot (MVP skaffold)

## 1. BotFather

1. Telegramda `@BotFather` → `/newbot`
2. Tokenni nusxalang → `.env` faylida `TELEGRAM_BOT_TOKEN=...`

## 2. Ishga tushirish (polling — lokal uchun)

**Muhim:** `npm run dev` faqat **`telegram-bot`** papkasida ishlaydi (`package.json` shu yerda).  
`node_modules` yoki `node_modules/telegraf/...` ichida emas — aks holda `Missing script: "dev"` chiqadi.

```bash
cd telegram-bot
cp .env.example .env
# .env ichida TELEGRAM_BOT_TOKEN ni to'ldiring
npm install
npm run dev
```

Token loyiha ildizidagi `stresstest/.env` da bo‘lsa ham bo‘ladi — `src/index.js` uni avtomatik o‘qiydi.

### `/start` ga javob kelmasa

1. **Terminal ochiq tursin** — `npm run dev` ishlayotgina bot tinglaydi; terminal yopilsa, bot ham to‘xtaydi.
2. **Webhook** — BotFather yoki avvalgi sinovda webhook qolgan bo‘lsa, **polling** yangilik olmaydi. Kod endi ishga tushganda `deleteWebhook` chaqiradi; baribir bo‘lmasa brauzerda oching:  
   `https://api.telegram.org/bot<TOKEN>/deleteWebhook` (TOKEN o‘rniga o‘zingizniki).
3. **To‘g‘ri bot** — Telegramda aynan shu token bilan yaratilgan bot ochilganini tekshiring.
4. **401 xato** — token bekor qilingan yoki noto‘g‘ri; @BotFather → yangi token.

Botga `/start` yuboring — javob kelishi kerak.  
`/start abc123` — `abc123` payload demo sifatida logda ko‘rinadi (keyin Supabase bilan almashtirasiz).

## 3. Production (webhook)

1. HTTPS domen (masalan `https://api.sizning-domen.uz/telegram/webhook`).
2. `src/index.js` ichida `launchWebhook()` ni yoqing va `WEBHOOK_DOMAIN` + `WEBHOOK_PATH` ni to‘ldiring.
3. `setWebhook` Telegraf yoki qo‘lda Telegram API orqali.

Batafsil: `../docs/TELEGRAM_AUTH_ROADMAP.md`.
