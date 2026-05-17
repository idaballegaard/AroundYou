<template>
  <main class="min-h-screen bg-[#eef4f7] px-4 py-8">
    <section class="mx-auto grid max-w-7xl gap-6">
      <header class="rounded-lg border border-slate-200 bg-white p-6">
        <h6 class="text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-[#de5826]">Adminpanel</h6>
        <div class="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 class="text-3xl font-black tracking-tight text-[#094b7b]">Indholdskontrol</h1>
            <p class="mt-2 max-w-3xl text-sm text-slate-600">
              Adminpanelet giver adgang til godkendelse, redigering og moderation af sidens indhold.
            </p>
          </div>
        </div>
      </header>

      <nav class="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="rounded-md px-4 py-2 text-sm font-black transition"
          :class="
            activeTab === tab.key ? 'bg-[#094b7b] text-white' : 'text-slate-600 hover:bg-slate-100'
          "
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </nav>

      <AdminCollectionManager
        v-if="activeCollection"
        :key="activeCollection.key"
        :config="activeCollection"
      />
      <AdminContactTickets v-else-if="activeTab === 'contact'" />
      <AdminReviewReports v-else />
    </section>
  </main>
</template>

<script setup lang="ts">
import AdminCollectionManager from '@/components/admin/AdminCollectionManager.vue'
import AdminContactTickets from '@/components/admin/AdminContactTickets.vue'
import AdminReviewReports from '@/components/admin/AdminReviewReports.vue'
import { useAdminView } from '@/composables/admin/useAdminView'

const { activeCollection, activeTab, tabs } = useAdminView()
</script>
