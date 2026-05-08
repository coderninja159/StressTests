# BACKEND API — FRONTEND ASOSIDA 100% TO'LIQ SPETSIFIKATSIYA

> Bu hujjat frontendni to'liq skanerlash asosida tayyorlangan.
> Backend SHU hujjatga 100% mos bo'lishi SHART.
> Har bir endpoint, har bir maydon, har bir javob formati aniq ko'rsatilgan.

---

## UMUMIY QOIDALAR

### Base URL va Auth
- Production: `https://stresstest-backend-1012645166107.us-central1.run.app`
- Dev: proxy orqali (baseURL bo'sh)
- **Barcha himoyalangan endpointlarga** `Authorization: Bearer <token>` header yuboriladi
- Token `localStorage.getItem("token")` dan olinadi
- Agar token yo'q bo'lsa, header yuborilmaydi

### Javob formati (BARCHA endpointlar uchun)
Har bir endpoint **quyidagi umumiy formatda** javob qaytarishi SHART:
```json
{
  "success": true,
  "...qo'shimcha maydonlar..."
}
```
Xatolik bo'lsa:
```json
{
  "success": false,
  "message": "Xatolik tavsifi (o'zbekcha)"
}
```

### Xatolik kodlari (frontend kutadi)
| Status | Ma'nosi | Frontend xatti-harakati |
|--------|---------|------------------------|
| 400 | Noto'g'ri ma'lumot | "Ma'lumotlar noto'g'ri kiritildi" |
| 401 | Token yaroqsiz / yo'q | Faqat `/api/students/me`, `/api/psychologist/stats`, `/api/admin/stats`, `/api/auth/logout` endpointlarida logout qiladi. Boshqa endpointlarda 401 ni e'tiborsiz qoldiradi |
| 403 | Ruxsat yo'q | "Ruxsat yo'q" |
| 404 | Topilmadi | "Ma'lumot topilmadi" |
| 429 | Rate limit | `Retry-After` header yoki body da `retryAfterSec` / `retry_after_sec` qaytarish kerak |
| 500+ | Server xatosi | "Server xatosi. Keyinroq urinib ko'ring" |

### Rate Limiting
429 javobda quyidagilardan biri bo'lishi kerak:
- Header: `Retry-After: <seconds>`
- Body: `{ "retryAfterSec": 60 }` yoki `{ "retry_after_sec": 60 }`
- Body: `{ "code": "RATE_LIMITED", "message": "..." }`

---

## DATABASE SCHEMA

### schools
```sql
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,        -- 4 belgili: "AB12"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT UNIQUE,           -- format: ST-YYYY-XXXX (faqat studentlar)
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'psychologist', 'admin')),
  school_id UUID REFERENCES schools(id),
  class_name TEXT,                  -- masalan: "9-A"
  age INTEGER,
  phone TEXT,                       -- student telefon raqami
  email TEXT,                       -- psixolog/admin email
  password_hash TEXT,               -- hashed password (psixolog/admin)
  auth_id UUID UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### questions
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_type TEXT NOT NULL CHECK (test_type IN ('psychological', 'portrait')),
  question_text TEXT NOT NULL,
  category TEXT NOT NULL,           -- psychological: lie_scale|delinquency|addiction|aggression|self_harm
                                    -- portrait: leadership|social|intellectual|emotional
  order_num INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  school_id UUID REFERENCES schools(id)  -- NULL = umumiy savol, UUID = maktabga xos
);
```

### answer_options (faqat portrait test uchun)
```sql
CREATE TABLE answer_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  personality_type TEXT NOT NULL,    -- leadership|social|intellectual|emotional
  points INTEGER DEFAULT 1
);
```

### results
```sql
CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  test_type TEXT NOT NULL CHECK (test_type IN ('psychological', 'portrait')),
  total_score INTEGER,
  risk_level TEXT CHECK (risk_level IN ('normal', 'medium', 'high')),
  category_scores JSONB,            -- {delinquency: {score, max, percentage, level}, ...}
  personality_type TEXT,             -- portrait uchun: leadership|social|intellectual|emotional
  ai_explanation TEXT,               -- student uchun AI izoh
  ai_professional TEXT,              -- psixolog uchun AI professional tahlil
  taken_at TIMESTAMPTZ DEFAULT NOW()
);
```

### test_answers (har bir savol-javob yozuvi)
```sql
CREATE TABLE test_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id UUID REFERENCES results(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id),
  answer_value TEXT,                 -- psychological: "ha"|"bazan"|"yoq"
  option_id UUID REFERENCES answer_options(id),  -- portrait uchun
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ROLLAR VA HUQUQLAR

| Rol | Huquqlar |
|-----|----------|
| **student** | O'z profilini ko'rish, test topshirish, o'z natijalarini ko'rish |
| **psychologist** | O'z maktabi o'quvchilarini ko'rish, natijalarni ko'rish, excel export, AI tahlil |
| **admin** | Barcha maktablar, barcha psixologlar, barcha o'quvchilar, barcha natijalar, CRUD |

---

## ENDPOINTLAR TO'LIQ RO'YXATI

---

### 1. AUTH ENDPOINTLAR

#### POST `/api/auth/admin/login`
**Auth:** Yo'q
**Body:**
```json
{
  "email": "admin@example.com",
  "password": "parol123"
}
```
**Javob (200):**
```json
{
  "success": true,
  "token": "jwt-token-string",
  "user": {
    "id": "uuid",
    "role": "admin",
    "full_name": "Admin Ism",
    "email": "admin@example.com"
  }
}
```

#### POST `/api/auth/psychologist/login`
**Auth:** Yo'q
**Body:**
```json
{
  "email": "psixolog@maktab.uz",
  "password": "parol123"
}
```
**Javob (200):**
```json
{
  "success": true,
  "token": "jwt-token-string",
  "user": {
    "id": "uuid",
    "role": "psychologist",
    "full_name": "Psixolog Ism",
    "email": "psixolog@maktab.uz",
    "school_id": "school-uuid",
    "school_name": "Maktab nomi"
  }
}
```

#### POST `/api/auth/student/verify-school`
**Auth:** Yo'q
**Body:**
```json
{
  "schoolCode": "AB12"
}
```
**Javob (200):**
```json
{
  "success": true,
  "schoolId": "school-uuid",
  "schoolName": "Maktab nomi"
}
```
**Xatolik:** Kod noto'g'ri bo'lsa 400/404 + `{ "success": false, "message": "Maktab kodi noto'g'ri" }`

#### POST `/api/auth/student/login`
**Auth:** Yo'q
**Body:**
```json
{
  "studentId": "ST-2024-0001"
}
```
**Javob (200):**
```json
{
  "success": true,
  "token": "jwt-token-string",
  "user": {
    "id": "uuid",
    "role": "student",
    "full_name": "O'quvchi Ism",
    "student_id": "ST-2024-0001",
    "class_name": "9-A",
    "school_id": "school-uuid",
    "school_name": "Maktab nomi",
    "age": 15,
    "phone": "+998901234567"
  }
}
```
**Muhim:** Frontend `studentId` ni uppercase va turli formatda yuborishi mumkin (asl, uppercase, `_` olib tashlangan). Backend case-insensitive qidirish qilishi kerak.

#### POST `/api/auth/student/register`
**Auth:** Yo'q
**Body:**
```json
{
  "fullName": "Ism Familiya",
  "phone": "+998901234567",
  "age": 15,
  "className": "9-A",
  "schoolId": "school-uuid"
}
```
**Javob (200):**
```json
{
  "success": true,
  "studentId": "ST-2024-0001",
  "userId": "uuid",
  "token": "jwt-token-string",
  "user": {
    "id": "uuid",
    "role": "student",
    "full_name": "Ism Familiya",
    "student_id": "ST-2024-0001",
    "class_name": "9-A",
    "school_id": "school-uuid",
    "age": 15,
    "phone": "+998901234567"
  }
}
```
**Muhim:** Backend avtomatik `student_id` generatsiya qilishi kerak (format: `ST-YYYY-XXXX`). Token ham qaytarish kerak!

#### POST `/api/auth/logout`
**Auth:** Bearer token
**Javob (200):**
```json
{
  "success": true
}
```

---

### 2. STUDENT ENDPOINTLAR

#### GET `/api/students/me`
**Auth:** Bearer token (student)
**Javob (200):**
```json
{
  "success": true,
  "student": {
    "id": "uuid",
    "student_id": "ST-2024-0001",
    "full_name": "Ism Familiya",
    "role": "student",
    "class_name": "9-A",
    "school_id": "school-uuid",
    "school_name": "Maktab nomi",
    "age": 15,
    "phone": "+998901234567"
  }
}
```
**Muhim:** Bu endpoint sessiyani tekshirish uchun ishlatiladi. 401 qaytarsa — frontend logout qiladi.

#### GET `/api/students/me/results`
**Auth:** Bearer token (student)
**Query params:** `?limit=1&offset=0` (ixtiyoriy)
**Javob (200):**
```json
{
  "success": true,
  "results": [
    {
      "id": "result-uuid",
      "user_id": "user-uuid",
      "test_type": "psychological",
      "total_score": 8,
      "risk_level": "medium",
      "category_scores": {
        "delinquency": { "score": 2, "max": 6, "percentage": 33.3, "level": "medium", "label": "Huquqbuzarlik moyilligi" },
        "addiction": { "score": 1, "max": 6, "percentage": 16.7, "level": "normal", "label": "Zavisimlik moyilligi" },
        "aggression": { "score": 3, "max": 6, "percentage": 50, "level": "medium", "label": "Tajovuzkorlik" },
        "self_harm": { "score": 2, "max": 6, "percentage": 33.3, "level": "medium", "label": "O'z-o'ziga zarar" },
        "lie_scale": { "score": 1, "max": 6, "percentage": 16.7, "note": "Yolg'on ko'rsatkichi" },
        "summary": { "overall_risk_level": "medium", "overall_percentage": 50, "worst_category": "aggression" }
      },
      "personality_type": null,
      "taken_at": "2024-05-01T10:30:00Z"
    }
  ]
}
```

#### GET `/api/students/me/results/:resultId`
**Auth:** Bearer token (student)
**Javob (200):**
```json
{
  "success": true,
  "result": {
    "id": "result-uuid",
    "user_id": "user-uuid",
    "test_type": "psychological",
    "total_score": 8,
    "risk_level": "medium",
    "category_scores": { "...yuqoridagi formatda..." },
    "personality_type": null,
    "taken_at": "2024-05-01T10:30:00Z"
  }
}
```
**Muhim:** Frontend `resp.result` yoki `resp.item` yoki `resp.data` dan natija qidiradi. Eng yaxshisi `result` kalitida qaytarish.

#### POST `/api/students/test/submit`
**Auth:** Bearer token (student)
**Body:**
```json
{
  "test_type": "psychological",
  "answers": [
    { "question_id": "uuid", "answer_value": "ha" },
    { "question_id": "uuid", "answer_value": "bazan" },
    { "question_id": "uuid", "answer_value": "yoq" }
  ],
  "score": 8,
  "total_score": 8,
  "risk_level": "medium",
  "personality_type": null,
  "category_scores": {
    "delinquency": { "score": 2, "max": 6, "percentage": 33.3, "level": "medium" },
    "addiction": { "score": 1, "max": 6, "percentage": 16.7, "level": "normal" },
    "aggression": { "score": 3, "max": 6, "percentage": 50, "level": "medium" },
    "self_harm": { "score": 2, "max": 6, "percentage": 33.3, "level": "medium" },
    "lie_scale": { "score": 1, "max": 6, "percentage": 16.7 },
    "summary": { "overall_risk_level": "medium", "overall_percentage": 50, "worst_category": "aggression" }
  }
}
```
**Portrait test uchun body:**
```json
{
  "test_type": "portrait",
  "answers": [
    { "question_id": "uuid", "option_id": "answer-option-uuid" }
  ],
  "score": 15,
  "total_score": 15,
  "risk_level": null,
  "personality_type": "leadership",
  "category_scores": {
    "leadership": { "score": 6, "percentage": 40 },
    "social": { "score": 4, "percentage": 26.7 },
    "intellectual": { "score": 3, "percentage": 20 },
    "emotional": { "score": 2, "percentage": 13.3 },
    "total_points": 15
  }
}
```
**Javob (200):**
```json
{
  "success": true,
  "resultId": "new-result-uuid"
}
```
**Muhim:** Frontend `data.resultId` yoki `data.result.id` yoki `data.data.id` dan result ID qidiradi. Eng yaxshisi `resultId` qaytarish. Backend shu body dagi `category_scores`, `risk_level`, `personality_type`, `total_score` ni results jadvaliga saqlashi SHART. Shuningdek har bir `answers[]` elementini `test_answers` jadvaliga saqlashi kerak.

---

### 3. PSYCHOLOGIST ENDPOINTLAR

#### GET `/api/psychologist/stats`
**Auth:** Bearer token (psychologist)
**Javob (200):**
```json
{
  "success": true,
  "stats": {
    "schoolName": "Maktab nomi"
  },
  "results": [
    {
      "id": "result-uuid",
      "user_id": "user-uuid",
      "test_type": "psychological",
      "total_score": 8,
      "risk_level": "medium",
      "category_scores": { "...to'liq formatda..." },
      "personality_type": null,
      "taken_at": "2024-05-01T10:30:00Z"
    }
  ]
}
```
**Muhim:** Bu endpoint 2 ta narsa qaytaradi:
1. `stats` — maktab nomi va boshqa statistika
2. `results` — shu psixolog maktabidagi BARCHA o'quvchilarning BARCHA test natijalari

Frontend bu `results` ro'yxatidan:
- Haftalik testchilar sonini hisoblaydi
- Kategoriyalar o'rtacha foizini hisoblaydi (delinquency, addiction, aggression, self_harm)
- 30 kunlik test faolligini hisoblaydi (psychological va portrait alohida)
- Har bir o'quvchining oxirgi xavf darajasini aniqlaydi

Bu endpoint 401 qaytarsa — frontend logout qiladi.

#### GET `/api/psychologist/students`
**Auth:** Bearer token (psychologist)
**Javob (200):**
```json
{
  "success": true,
  "students": [
    {
      "id": "user-uuid",
      "student_id": "ST-2024-0001",
      "full_name": "O'quvchi Ism",
      "class_name": "9-A",
      "age": 15,
      "phone": "+998901234567",
      "school_id": "school-uuid"
    }
  ]
}
```
**Muhim:** Frontend `data.students` yoki `data.items` yoki `data.data` dan ro'yxat qidiradi. Eng yaxshisi `students` kalitida qaytarish. Faqat shu psixolog maktabidagi o'quvchilar qaytarilishi kerak.

#### GET `/api/psychologist/students/:studentId`
**Auth:** Bearer token (psychologist)
**`:studentId`** — users.id (UUID) yoki student_id (ST-...) bo'lishi mumkin
**Javob (200):**
```json
{
  "success": true,
  "student": {
    "id": "user-uuid",
    "student_id": "ST-2024-0001",
    "full_name": "O'quvchi Ism",
    "class_name": "9-A",
    "age": 15,
    "phone": "+998901234567",
    "school_id": "school-uuid"
  }
}
```

#### GET `/api/psychologist/students/:studentId/results`
**Auth:** Bearer token (psychologist)
**Javob (200):**
```json
{
  "success": true,
  "results": [
    {
      "id": "result-uuid",
      "user_id": "user-uuid",
      "test_type": "psychological",
      "total_score": 8,
      "risk_level": "medium",
      "category_scores": { "...to'liq formatda..." },
      "personality_type": null,
      "taken_at": "2024-05-01T10:30:00Z"
    }
  ]
}
```

#### GET `/api/psychologist/export`
**Auth:** Bearer token (psychologist)
**Javob:** Excel fayl (blob) yoki 404 (bo'lmasa frontend o'zi XLSX yaratadi — ixtiyoriy endpoint)

---

### 4. ADMIN ENDPOINTLAR

#### GET `/api/admin/stats`
**Auth:** Bearer token (admin)
**Javob (200):**
```json
{
  "success": true,
  "stats": {
    "schools": 12,
    "psychologists": 8,
    "students": 450,
    "testsToday": 23
  },
  "results": [
    {
      "id": "result-uuid",
      "user_id": "user-uuid",
      "test_type": "psychological",
      "total_score": 8,
      "risk_level": "medium",
      "category_scores": { "...to'liq formatda..." },
      "personality_type": null,
      "taken_at": "2024-05-01T10:30:00Z"
    }
  ]
}
```
**Muhim:** Bu endpoint 401 qaytarsa — frontend logout qiladi. `results` — BARCHA tizim bo'yicha natijalar. Frontend bu natijalardan xavf taqsimotini, kategoriya o'rtachalarini va test faolligini hisoblaydi.

#### GET `/api/admin/schools`
**Auth:** Bearer token (admin)
**Query params:** `?code=AB12` (ixtiyoriy — kod bo'yicha qidirish)
**Javob (200):**
```json
{
  "success": true,
  "schools": [
    {
      "id": "school-uuid",
      "name": "Maktab nomi",
      "school_name": "Maktab nomi",
      "code": "AB12",
      "school_code": "AB12",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```
**Muhim:** Frontend `name` yoki `school_name`, `code` yoki `school_code` ni qidiradi. Ikkalasini ham qaytarish tavsiya etiladi.

#### POST `/api/admin/schools`
**Auth:** Bearer token (admin)
**Body:**
```json
{
  "name": "Yangi maktab",
  "code": "XY34",
  "is_active": true
}
```
**Javob (200/201):**
```json
{
  "success": true,
  "school": { "id": "new-uuid", "name": "Yangi maktab", "code": "XY34", "is_active": true }
}
```

#### PATCH `/api/admin/schools/:schoolId`
**Auth:** Bearer token (admin)
**Body (qisman yangilash):**
```json
{
  "name": "Yangilangan nom",
  "code": "AB12",
  "is_active": false
}
```
**Javob (200):**
```json
{
  "success": true
}
```

#### GET `/api/admin/psychologists`
**Auth:** Bearer token (admin)
**Javob (200):**
```json
{
  "success": true,
  "psychologists": [
    {
      "id": "user-uuid",
      "full_name": "Psixolog Ism",
      "email": "psixolog@mail.uz",
      "school_id": "school-uuid",
      "schools": { "name": "Maktab nomi" },
      "is_active": true,
      "created_at": "2024-01-15T00:00:00Z"
    }
  ]
}
```
**Muhim:** `schools` ichida `name` bo'lishi kerak (maktab nomi ko'rsatish uchun). Frontend `is_active === false` yoki `deleted_at` bo'lganlarni filtrlaydi.

#### POST `/api/admin/psychologists`
**Auth:** Bearer token (admin)
**Body:**
```json
{
  "fullName": "Yangi Psixolog",
  "email": "yangi@mail.uz",
  "password": "parol123",
  "schoolId": "school-uuid"
}
```
**Javob (200/201):**
```json
{
  "success": true,
  "psychologist": { "id": "new-uuid" }
}
```
**Muhim:** Backend yangi user yaratadi (role: "psychologist"), parolni hash qiladi va saqlaydi.

#### DELETE `/api/admin/psychologists/:psychologistId`
**Auth:** Bearer token (admin)
**Javob (200):**
```json
{
  "success": true
}
```

#### GET `/api/admin/students`
**Auth:** Bearer token (admin)
**Javob (200):**
```json
{
  "success": true,
  "students": [
    {
      "id": "user-uuid",
      "student_id": "ST-2024-0001",
      "full_name": "O'quvchi Ism",
      "class_name": "9-A",
      "age": 15,
      "phone": "+998901234567",
      "school_id": "school-uuid"
    }
  ]
}
```

#### GET `/api/admin/export`
**Auth:** Bearer token (admin)
**Javob:** Excel fayl (blob) yoki 404 (ixtiyoriy — bo'lmasa frontend o'zi XLSX yaratadi)

---

### 5. AI ENDPOINTLAR

#### POST `/api/ai/student-explanation/:resultId`
**Auth:** Bearer token
**Body:** Yo'q (result_id URL dan olinadi)
**Javob (200):**
```json
{
  "success": true,
  "text": "Sizning test natijangiz shuni ko'rsatadiki...\n\nTavsiyalar:\n1. ..."
}
```
**Muhim:** Bu endpoint test natijasiga asoslanib AI (OpenAI/Gemini) orqali o'quvchiga tushunarli tilda izoh yaratadi. Natija `results.ai_explanation` ga saqlanishi va keyingi so'rovlarda cache dan qaytarilishi kerak. `text` — oddiy matn (HTML emas), paragraflar `\n\n` bilan ajratilgan.

#### POST `/api/ai/professional-analysis/:resultId`
**Auth:** Bearer token
**Body:** Yo'q
**Javob (200):**
```json
{
  "success": true,
  "text": "Professional psixologik tahlil:\n\nKategoriyalar bo'yicha batafsil...\n\nTavsiyalar..."
}
```
**Muhim:** Bu endpoint psixolog uchun professional darajadagi tahlil yaratadi. Natija `results.ai_professional` ga saqlanishi kerak. Har ikki AI endpointda agar allaqachon saqlangan bo'lsa — qayta generatsiya qilmasdan cache dan qaytarish.

---

## TEST MEXANIZMI BATAFSIL

### Psychological test
- 5 kategoriya: `lie_scale`, `delinquency`, `addiction`, `aggression`, `self_harm`
- Har bir kategoriyadan 3 ta savol tanlanadi = jami 15 ta savol
- Javob variantlari: `"ha"` (2 ball), `"bazan"` (1 ball), `"yoq"` (0 ball)
- Har bir kategoriya max = savollar_soni × 2
- Foiz = (score / max) × 100
- `lie_scale` — yolg'on shkalasi, umumiy xavf hisobiga kirmaydi
- Risk level: 0-33% = `"normal"`, 34-66% = `"medium"`, 67-100% = `"high"`
- Umumiy risk = eng yuqori kategoriya foiziga qarab aniqlanadi

### Portrait test
- 4 shaxsiyat turi: `leadership`, `social`, `intellectual`, `emotional`
- 15 ta savol, har birida variantlar (answer_options jadvalidan)
- Har bir variant `personality_type` va `points` ga ega
- Jami ball = barcha tanlangan variantlar ballari yig'indisi
- Asosiy tur = eng ko'p ball to'plagan personality_type
- `risk_level` = `null` (portrait testda xavf darajasi yo'q)

### category_scores formati (psychological)
```json
{
  "delinquency": {
    "score": 2,
    "max": 6,
    "question_count": 3,
    "percentage": 33.3,
    "level": "medium",
    "label": "Huquqbuzarlik moyilligi"
  },
  "addiction": {
    "score": 1,
    "max": 6,
    "question_count": 3,
    "percentage": 16.7,
    "level": "normal",
    "label": "Zavisimlik moyilligi"
  },
  "aggression": {
    "score": 3,
    "max": 6,
    "question_count": 3,
    "percentage": 50,
    "level": "medium",
    "label": "Tajovuzkorlik"
  },
  "self_harm": {
    "score": 2,
    "max": 6,
    "question_count": 3,
    "percentage": 33.3,
    "level": "medium",
    "label": "O'z-o'ziga zarar"
  },
  "lie_scale": {
    "score": 1,
    "max": 6,
    "percentage": 16.7,
    "note": "Yolg'on ko'rsatkichi — umumiy xavf hisobiga kirmaydi"
  },
  "summary": {
    "overall_risk_level": "medium",
    "overall_percentage": 50,
    "worst_category": "aggression"
  }
}
```

### category_scores formati (portrait)
```json
{
  "leadership": { "score": 6, "percentage": 40 },
  "social": { "score": 4, "percentage": 26.7 },
  "intellectual": { "score": 3, "percentage": 20 },
  "emotional": { "score": 2, "percentage": 13.3 },
  "total_points": 15
}
```

---

## USER OBYEKTI NORMALIZATSIYASI

Frontend har bir user obyektini quyidagi formatga normalize qiladi. Backend ham shu formatda qaytarishi kerak:

```json
{
  "id": "uuid",
  "role": "student|psychologist|admin",
  "full_name": "Ism Familiya",
  "student_id": "ST-2024-0001",
  "class_name": "9-A",
  "school_id": "school-uuid",
  "school_name": "Maktab nomi",
  "age": 15,
  "phone": "+998901234567",
  "email": "email@mail.uz"
}
```

Frontend quyidagi alternativ kalitlarni ham qidiradi (lekin birlamchi kalitlar ustun):
- `id` ← `user_id`
- `full_name` ← `fullName`
- `student_id` ← `studentId`
- `class_name` ← `className`
- `school_id` ← `schoolId`
- `school_name` ← `schoolName`

---

## FRONTEND ROUTING VA ROLE GUARD

| Route | Role | Endpoint(lar) |
|-------|------|---------------|
| `/auth/login` | public | auth/* |
| `/auth/register` | public | auth/student/* |
| `/student/dashboard` | student | `/api/students/me`, `/api/students/me/results` |
| `/student/test` | student | Supabase questions + `/api/students/test/submit` |
| `/student/result?id=X` | student | `/api/students/me/results/:id`, `/api/ai/student-explanation/:id` |
| `/psychologist/dashboard` | psychologist | `/api/psychologist/stats`, `/api/psychologist/students` |
| `/psychologist/students` | psychologist | `/api/psychologist/students`, `/api/psychologist/stats` |
| `/psychologist/students/:id` | psychologist | `/api/psychologist/students/:id`, `/api/psychologist/students/:id/results` |
| `/psychologist/tests` | psychologist | Supabase questions (to'g'ridan-to'g'ri) |
| `/admin/dashboard` | admin | `/api/admin/stats`, `/api/admin/schools`, `/api/admin/psychologists`, `/api/admin/students` |
| `/admin/schools` | admin | `/api/admin/schools`, `/api/admin/psychologists`, `/api/admin/students` |
| `/admin/psychologists` | admin | `/api/admin/schools`, `/api/admin/psychologists` |
| `/admin/tests` | admin | Supabase questions (to'g'ridan-to'g'ri) |
| `/admin/analytics` | admin | `/api/admin/stats`, `/api/admin/schools`, `/api/admin/students` + Supabase |

---

## SUPABASE BILAN BOG'LIQ MUHIM ESLATMALAR

Frontend savollarni (`questions`, `answer_options`) TO'G'RIDAN-TO'G'RI Supabase dan oladi (backend orqali emas). Ammo test natijalarini backend API orqali saqlaydi.

Agar kelajakda savollarni ham backend orqali boshqarish kerak bo'lsa, quyidagi endpointlar qo'shilishi mumkin:
- `GET /api/questions?test_type=psychological&school_id=...`
- `GET /api/questions/:id/options`
- `POST /api/questions` (admin/psychologist)
- `PATCH /api/questions/:id`
- `DELETE /api/questions/:id`

---

## JWT TOKEN FORMATI (tavsiya)

```json
{
  "sub": "user-uuid",
  "role": "student|psychologist|admin",
  "school_id": "school-uuid",
  "iat": 1714567890,
  "exp": 1714654290
}
```

Backend har bir himoyalangan endpointda:
1. `Authorization: Bearer <token>` header dan token oladi
2. JWT ni tekshiradi (muddati, imzo)
3. Token ichidagi `sub` (user id) va `role` ni aniqlaydi
4. Role huquqlarini tekshiradi
5. Psixolog endpointlarida — faqat o'z maktabi ma'lumotlarini qaytaradi

---

## XULOSA — BACKENDNI TO'G'RI QILISH UCHUN CHECKLIST

- [ ] Barcha endpointlar `{ "success": true/false, ... }` formatida javob qaytaradi
- [ ] Auth endpointlar JWT token va user obyektini qaytaradi
- [ ] Student register da `student_id` avtomatik generatsiya qilinadi (ST-YYYY-XXXX)
- [ ] Student login case-insensitive qidiradi
- [ ] Test submit natijada `resultId` qaytaradi va `results` + `test_answers` jadvallariga saqlaydi
- [ ] `category_scores` JSONB formatida to'liq saqlanadi (score, max, percentage, level)
- [ ] Psychologist faqat o'z maktabi o'quvchilarini va natijalarini ko'radi
- [ ] Admin barcha ma'lumotlarga ega
- [ ] `/api/psychologist/stats` da `results` massivi qaytariladi
- [ ] `/api/admin/stats` da ham `results` massivi qaytariladi
- [ ] AI endpointlar `{ "success": true, "text": "..." }` qaytaradi
- [ ] 401 xatolik faqat belgilangan endpointlarda logout qildiradi
- [ ] 429 xatolikda `retryAfterSec` yoki `Retry-After` header qaytariladi
- [ ] CORS sozlangan (frontend domeni ruxsat etilgan)
- [ ] Barcha UUID lar `gen_random_uuid()` bilan generatsiya qilinadi
