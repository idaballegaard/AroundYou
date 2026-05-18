<template>
  <section class="rounded-lg border border-slate-200 bg-white p-3 sm:p-5">
    <div class="flex items-center justify-between gap-2 sm:flex-wrap">
      <div>
        <div class="flex items-center gap-2">
          <h2 class="text-base font-black text-[#094b7b] sm:text-xl">Afventende forslag</h2>
          <span
            class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-600 sm:hidden"
          >
            {{ suggestions.length }}
          </span>
        </div>
        <p class="hidden text-sm text-slate-500 sm:block">
          {{ suggestions.length }} afventer godkendelse eller afvisning.
        </p>
      </div>
      <button
        class="shrink-0 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-bold sm:px-3 sm:py-2 sm:text-sm"
        @click="$emit('refresh')"
      >
        Opdater
      </button>
    </div>

    <div v-if="isLoading" class="mt-3 rounded-md bg-slate-50 p-3 font-semibold text-slate-600">
      Henter...
    </div>
    <div
      v-else-if="!suggestions.length"
      class="mt-3 rounded-md bg-slate-50 p-3 text-sm font-semibold text-slate-600 sm:p-4"
    >
      Der er ingen afventende forslag i denne samling.
    </div>
    <div v-else class="mt-3 grid gap-2 sm:mt-4 sm:gap-3">
      <article
        v-for="suggestion in suggestions"
        :key="suggestion._id"
        class="rounded-lg border border-slate-200 p-2.5 sm:p-4"
      >
        <div class="grid gap-2 sm:flex sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
          <div class="min-w-0">
            <h3 class="break-words text-sm font-black text-slate-900 sm:text-base">
              {{ suggestion.payload.name || 'Unavngivet forslag' }}
            </h3>
            <p class="text-xs text-slate-500 sm:text-sm">
              {{ suggestion.submittedByName }} ·
              {{ new Date(suggestion.createdAt).toLocaleString('da-DK') }}
            </p>
          </div>
          <div class="grid grid-cols-2 gap-2 sm:flex">
            <button
              class="rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-black text-white disabled:opacity-60 sm:px-3 sm:py-2 sm:text-sm"
              :disabled="activeSuggestionId === suggestion._id"
              @click="$emit('approve', suggestion._id)"
            >
              Godkend
            </button>
            <button
              class="rounded-md bg-rose-600 px-2.5 py-1.5 text-xs font-black text-white disabled:opacity-60 sm:px-3 sm:py-2 sm:text-sm"
              :disabled="activeSuggestionId === suggestion._id"
              @click="$emit('reject', suggestion._id)"
            >
              Afvis
            </button>
          </div>
        </div>
        <details class="mt-2 rounded-md bg-slate-50 px-2.5 py-2 text-sm md:hidden">
          <summary class="cursor-pointer text-xs font-black text-[#094b7b]">Vis detaljer</summary>
          <dl class="mt-2 grid gap-2">
            <div v-for="[key, value] in Object.entries(suggestion.payload)" :key="key">
              <dt class="text-[11px] font-black uppercase text-slate-400">
                {{ formatLabel(key) }}
              </dt>
              <dd class="mt-0.5 line-clamp-2 break-words text-xs text-slate-700">
                {{ formatValue(value) }}
              </dd>
            </div>
          </dl>
        </details>
        <dl class="mt-3 hidden gap-2 md:grid md:grid-cols-2">
          <div
            v-for="[key, value] in Object.entries(suggestion.payload)"
            :key="key"
            class="rounded-md bg-slate-50 p-3"
          >
            <dt class="text-xs font-black uppercase text-slate-400">{{ formatLabel(key) }}</dt>
            <dd class="mt-1 break-words text-sm text-slate-700">{{ formatValue(value) }}</dd>
          </div>
        </dl>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  formatAdminSuggestionValue,
  getAdminSuggestionLabel,
} from '@/composables/admin/adminSuggestionQueue.helpers'
import type { AdminCollectionConfig } from '@/types/admin'
import type { ContentSuggestion } from '@/types/content-suggestion'

const props = defineProps<{
  config: AdminCollectionConfig
  suggestions: ContentSuggestion[]
  isLoading: boolean
  activeSuggestionId: string
}>()

defineEmits<{
  refresh: []
  approve: [id: string]
  reject: [id: string]
}>()

const formatValue = formatAdminSuggestionValue
const fieldLabelByKey = computed(
  () => new Map(props.config.fields.map((field) => [field.key, field.label])),
)

function formatLabel(key: string): string {
  return getAdminSuggestionLabel(fieldLabelByKey.value, key)
}
</script>
