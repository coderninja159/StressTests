# StressTest — Loyiha Konteksti

## Loyiha haqida
StressTest — maktab o'quvchilari uchun psixologik test platformasi.
O'quvchilar test topshiradi, maktab psixologi natijalarni ko'radi va tahlil qiladi.

## Foydalanuvchi rollari (MVP)
1. **student** — o'quvchi: test topshiradi, natijasini ko'radi
2. **psychologist** — maktab psixologi: o'quvchilar natijalarini ko'radi, tahlil qiladi
3. **admin** — tizim administratori: maktablar va psixologlarni boshqaradi

## Til
Barcha UI **O'zbek tilida (lotin alifbosi)** bo'lishi shart.

## Texnologiyalar
- Frontend: Vue 3 + Vite + Vue Router + Pinia
- Backend/DB: Supabase (PostgreSQL + Auth)
- AI: DeepSeek API (openai-compatible)
- CSS: Custom (hech qanday UI framework ishlatma — tailwind ham, bootstrap ham)

## Dizayn
- Minimalistik, zamonaviy
- Asosiy rang:rgb(58, 208, 24) (Yashil)
- Fon: #f8fafc (och kulrang)
- Yumaloq burchaklar, toza layout
- Mobile-friendly

## Muhim qoidalar (DOIMO amal qil)
1. Hech qachon hardcode qilma — env fayldan o'qi
2. Har doim xatoliklarni handle qil (try/catch)
3. Loading holatlarini ko'rsat
4. Supabase Row Level Security ishlatiladi
5. Foydalanuvchi ma'lumotlari maxfiy — hech qachon console.log qilma