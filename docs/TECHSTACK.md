# Tech Stack

## Frontend
- Vue 3 (Composition API, <script setup> sintaksisi)
- Vite (build tool)
- Vue Router 4 (sahifalar)
- Pinia (global state)

## Backend
- Supabase (Auth + PostgreSQL database)
- @supabase/supabase-js kutubxonasi

## AI
- DeepSeek API (OpenAI-compatible endpoint)
- Base URL: https://api.deepseek.com
- Model: deepseek-chat
- axios orqali so'rov yuborish

## Papka strukturasi
src/
├── assets/
│   └── main.css
├── components/
│   ├── ui/              ← BaseButton, BaseInput, BaseCard, LoadingSpinner
│   └── layout/          ← AppHeader, AppSidebar
├── views/
│   ├── auth/            ← LoginView.vue, RegisterView.vue
│   ├── student/         ← DashboardView, TestView, ResultView
│   ├── psychologist/    ← DashboardView, StudentsView, StudentDetailView
│   └── admin/           ← DashboardView, SchoolsView, PsychologistsView
├── router/
│   └── index.js
├── stores/
│   ├── auth.js          ← foydalanuvchi auth holati
│   └── test.js          ← test jarayoni holati
├── lib/
│   ├── supabase.js      ← supabase client
│   └── ai.js            ← AI API helper
└── main.js

## Environment variables (.env)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_DEEPSEEK_API_KEY=