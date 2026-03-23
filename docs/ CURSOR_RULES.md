# Cursor uchun Qoidalar (DOIMO amal qil)

## Kod yozish qoidalari
1. Vue 3 Composition API ishlatish, Options API EMAS
2. `<script setup>` sintaksisini ishlatish
3. TypeScript EMAS — oddiy JavaScript
4. Hech qanday UI framework (Bootstrap, Tailwind) EMAS — faqat custom CSS
5. CSS Variables ishlatish (--color-primary, --radius, va h.k.)
6. `async/await` ishlatish, `.then()` EMAS

## Xato boshqaruv
- Har doim try/catch ishlatish
- Foydalanuvchiga tushunarli xato xabari ko'rsatish
- Loading holat bo'lishi shart (isLoading variable)

## Supabase qoidalari
- Har doim `const { data, error } = await supabase...` formatida
- Error ni tekshirish: `if (error) throw error`
- Env dan o'qish: `import.meta.env.VITE_SUPABASE_URL`

## Loyiha tili
- Barcha UI matni O'zbek tilida (lotin)
- Kod kommentariyalari O'zbek yoki ingliz tilida

## Fayl nomlash
- Vue komponentlari: PascalCase (LoginView.vue, BaseButton.vue)
- JS fayllar: camelCase (supabase.js, authStore.js)

## Import tartibi
1. Vue/kutubxona importlari
2. Komponent importlari
3. Store importlari
4. Lib/util importlari