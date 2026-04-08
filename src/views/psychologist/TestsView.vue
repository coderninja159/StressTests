<template>
  <div class="tests-layout">
    <PsychologistSidebar />
    <div class="tests-main">
      <MobileHeader />
      <AppTopbar :show-nav-toggle="true">
        <template #title>
          <div>
            <h1 class="page-title">Testlar va savollar</h1>
            <p class="tests-sub label-std">Faqat o‘z maktabingiz uchun savollar qo‘shiladi</p>
          </div>
        </template>
      </AppTopbar>
      <div class="page-content">
        <QuestionsManager v-if="supabaseOk" variant="psychologist" />
        <p v-else class="tests-warn">Supabase sozlanmagan.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import PsychologistSidebar from "../../components/layout/PsychologistSidebar.vue";
import MobileHeader from "../../components/layout/MobileHeader.vue";
import AppTopbar from "../../components/layout/AppTopbar.vue";
import QuestionsManager from "../../components/questions/QuestionsManager.vue";
import { supabase } from "../../lib/supabase";

const supabaseOk = Boolean(supabase);
</script>

<style scoped>
.tests-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-page, var(--n-50, #f8fafc));
}

.tests-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.tests-sub {
  margin: 4px 0 0;
}

.tests-warn {
  padding: 1rem;
  color: var(--risk, #b91c1c);
}
</style>
