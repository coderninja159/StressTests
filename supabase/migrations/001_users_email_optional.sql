-- Psixolog emailini jadvalda ko'rsatish uchun (admin panel).
-- Supabase SQL Editor da bir marta ishga tushiring.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
