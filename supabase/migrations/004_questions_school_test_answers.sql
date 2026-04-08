-- Loyiha README / Supabase SQL Editor: ushbu faylni muhitda bajarish kerak.
-- questions: maktabga xos savollar (school_id NULL = barcha maktablar uchun umumiy)

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);

CREATE INDEX IF NOT EXISTS idx_questions_school_id ON questions(school_id);

-- Har bir savol javobi (faqat psixolog/admin tahlil uchun; o'quvchi o'z UI dan ko'rmaydi)

CREATE TABLE IF NOT EXISTS test_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id UUID NOT NULL REFERENCES results(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id),
  answer_value TEXT,
  option_id UUID REFERENCES answer_options(id),
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_answers_result_id ON test_answers(result_id);
CREATE INDEX IF NOT EXISTS idx_test_answers_question_id ON test_answers(question_id);

-- RLS: muhitingizdagi results/users siyosatiga qarab qo'shing.
-- Tavsiya: INSERT — natija egasi (o'quvchi); SELECT — admin/psixolog.
