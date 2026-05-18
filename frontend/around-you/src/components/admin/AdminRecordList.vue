<template>
  <section class="rounded-lg border border-slate-200 bg-white p-3 sm:p-5">
    <div class="grid gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
      <div>
        <h2 class="text-base font-black text-[#094b7b] sm:text-xl">Poster i samlingen</h2>
        <p class="text-xs text-slate-500 sm:text-sm">
          {{ activeRecords.length }} aktive · {{ hiddenRecords.length }} skjulte
        </p>
      </div>

      <AdminSegmentedTabs v-model="activeTab" :tabs="recordTabs" />
    </div>

    <div
      v-if="activeTab === 'hidden' && isHiddenLoading"
      class="mt-3 rounded-md bg-slate-50 p-3 text-sm font-semibold text-slate-600 sm:mt-4 sm:p-4"
    >
      Henter skjulte poster...
    </div>

    <div
      v-else-if="!displayedRecords.length"
      class="mt-3 rounded-md bg-slate-50 p-3 text-sm font-semibold text-slate-600 sm:mt-4 sm:p-4"
    >
      {{ activeTab === 'hidden' ? 'Der er ingen skjulte poster.' : 'Der er ingen aktive poster.' }}
    </div>

    <div v-else class="mt-3 grid gap-2 sm:mt-4 sm:gap-3">
      <article
        v-for="record in paginatedRecords"
        :key="record._id"
        class="rounded-lg border border-slate-200 p-2.5 sm:p-4"
      >
        <div class="grid gap-2 sm:flex sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="break-words text-sm font-black text-slate-900 sm:text-base">
                {{ record.name || record._id }}
              </h3>
              <span
                v-if="record.isHidden"
                class="rounded-full bg-amber-100 px-2 py-1 text-xs font-black text-amber-800"
              >
                Skjult
              </span>
            </div>
            <p class="mt-1 hidden line-clamp-2 text-sm text-slate-600 sm:block">
              {{ record.description }}
            </p>
          </div>
          <div class="grid grid-cols-2 gap-2 sm:flex">
            <button
              class="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-bold sm:px-3 sm:py-2 sm:text-sm"
              @click="$emit('edit', record)"
            >
              Rediger
            </button>
            <button
              v-if="record.isHidden"
              class="rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-black text-white sm:px-3 sm:py-2 sm:text-sm"
              @click="$emit('restore', record._id)"
            >
              Gendan
            </button>
            <button
              v-else
              class="rounded-md bg-rose-600 px-2.5 py-1.5 text-xs font-black text-white sm:px-3 sm:py-2 sm:text-sm"
              @click="$emit('hide', record._id)"
            >
              Skjul
            </button>
          </div>
        </div>
      </article>

      <div
        v-if="totalPages > 1"
        class="mt-2 grid gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:px-3"
      >
        <p class="text-xs font-semibold text-slate-600 sm:text-sm">
          Viser {{ pageStart }}-{{ pageEnd }} af {{ displayedRecords.length }}
        </p>

        <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex">
          <button
            type="button"
            class="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-sm"
            :disabled="currentPage === 1"
            @click="goToPreviousPage"
          >
            Forrige
          </button>
          <span class="text-xs font-semibold text-slate-600 sm:text-sm"
            >Side {{ currentPage }} / {{ totalPages }}</span
          >
          <button
            type="button"
            class="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-sm"
            :disabled="currentPage === totalPages"
            @click="goToNextPage"
          >
            Næste
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import AdminSegmentedTabs from '@/components/admin/AdminSegmentedTabs.vue'
import { useAdminRecordList } from '@/composables/admin/useAdminRecordList'
import type { AdminRecord } from '@/types/admin'

const props = defineProps<{
  activeRecords: AdminRecord[]
  hiddenRecords: AdminRecord[]
  isHiddenLoading: boolean
}>()

const emit = defineEmits<{
  edit: [record: AdminRecord]
  hide: [id: string]
  restore: [id: string]
  loadHidden: []
}>()

const {
  activeTab,
  currentPage,
  displayedRecords,
  goToNextPage,
  goToPreviousPage,
  pageEnd,
  pageStart,
  paginatedRecords,
  recordTabs,
  totalPages,
} = useAdminRecordList(props, () => emit('loadHidden'))
</script>
