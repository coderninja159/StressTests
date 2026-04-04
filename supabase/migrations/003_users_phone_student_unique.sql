-- Ro'yxatdan o'tish: telefon va ism bo'yicha takrorlanishni oldini olish
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS unique_student_phone
ON users (full_name, phone)
WHERE role = 'student' AND phone IS NOT NULL AND phone <> '';
