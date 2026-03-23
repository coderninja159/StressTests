# Database Schema (Supabase / PostgreSQL)

## Jadvallar

### 1. schools
```sql
CREATE TABLE schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. users
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT UNIQUE,        -- faqat o'quvchilar uchun: ST-2024-0001
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'psychologist', 'admin')),
  school_id UUID REFERENCES schools(id),
  class_name TEXT,               -- masalan: "9-A"
  age INTEGER,
  auth_id UUID UNIQUE,           -- supabase auth.users bilan bog'liq
  email TEXT,                    -- ixtiyoriy: psixolog email (admin panel uchun)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. questions
```sql
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_type TEXT NOT NULL CHECK (test_type IN ('psychological', 'portrait')),
  question_text TEXT NOT NULL,
  category TEXT NOT NULL,
  order_num INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true
);
```

### 4. answer_options (faqat portrait test uchun)
```sql
CREATE TABLE answer_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  personality_type TEXT NOT NULL,
  points INTEGER DEFAULT 1
);
```

### 5. results
```sql
CREATE TABLE results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  test_type TEXT NOT NULL CHECK (test_type IN ('psychological', 'portrait')),
  total_score INTEGER,
  risk_level TEXT CHECK (risk_level IN ('normal', 'medium', 'high')),
  category_scores JSONB,
  personality_type TEXT,
  ai_explanation TEXT,
  ai_professional TEXT,
  taken_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Muhim eslatmalar
- Row Level Security (RLS) yoqilgan
- O'quvchi faqat o'z natijasini ko'ra oladi
- Psixolog faqat o'z maktabi o'quvchilarini ko'ra oladi
- Admin hamma narsani ko'ra oladi