-- Telegram /start orqali bog‘lash sessiyalari (StressTest).
-- Supabase SQL Editor yoki migratsiya orqali bajariladi.
--
-- Eslatma: RLS yoqilgan, policy yo‘q — anon/authenticated to‘g‘ridan-to‘g‘ri kira olmaydi.
-- Yozish/o‘qish: Edge Function yoki Node bot (SERVICE_ROLE_KEY) orqali.
-- Prod oldidan: kerak bo‘lsa cheklangan SELECT policy (faqat o‘z sessiyasi) qo‘shiladi.

CREATE TABLE IF NOT EXISTS telegram_link_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  telegram_chat_id bigint,
  telegram_username text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'expired', 'consumed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_telegram_link_sessions_token
  ON telegram_link_sessions (link_token);

CREATE INDEX IF NOT EXISTS idx_telegram_link_sessions_expires
  ON telegram_link_sessions (expires_at);

CREATE INDEX IF NOT EXISTS idx_telegram_link_sessions_status
  ON telegram_link_sessions (status);

ALTER TABLE telegram_link_sessions ENABLE ROW LEVEL SECURITY;

-- Policy qo‘shilmasa: anon key bilan jadvalga so‘rov rad etiladi (xavfsiz default).
-- Server (service_role) RLS dan chetda ishlaydi.
