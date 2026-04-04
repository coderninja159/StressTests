-- Phone column + uniqueness for students
-- Note: In this app, student rows are stored in `users` table (role='student').
-- If your project also has a separate `students` table, this migration updates it too.

DO $$
BEGIN
  -- users table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    EXECUTE 'ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT';

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'unique_student'
        AND conrelid = 'users'::regclass
    ) THEN
      EXECUTE 'ALTER TABLE users ADD CONSTRAINT unique_student UNIQUE (full_name, phone, school_id)';
    END IF;

    EXECUTE 'ALTER TABLE users ENABLE ROW LEVEL SECURITY';
  END IF;

  -- students table (optional)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students') THEN
    EXECUTE 'ALTER TABLE students ADD COLUMN IF NOT EXISTS phone TEXT';

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'unique_student'
        AND conrelid = 'students'::regclass
    ) THEN
      EXECUTE 'ALTER TABLE students ADD CONSTRAINT unique_student UNIQUE (full_name, phone, school_id)';
    END IF;

    EXECUTE 'ALTER TABLE students ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- RLS policies:
-- "Keep existing ones, just add phone to insert policy" is environment-specific.
-- You may need to ALTER the existing INSERT policy's WITH CHECK/USING expression
-- so it references/permits `phone` as well.

