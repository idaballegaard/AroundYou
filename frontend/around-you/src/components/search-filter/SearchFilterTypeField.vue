<template>
  <div class="relative flex min-w-[200px] flex-1 items-center">
    <button
      type="button"
      class="flex w-full items-center justify-between gap-3 rounded-full bg-transparent px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100/70"
      @click="emit('toggle')"
    >
      <span>Event / Attraktion</span>
      <span class="text-xs text-slate-600">{{ isOpen ? '▲' : '▼' }}</span>
    </button>

    <div
      v-if="isOpen"
      class="absolute top-full z-20 mt-2.5 w-56 rounded-2xl bg-[#C1D2DE] p-3 shadow-lg"
    >
      <div class="flex items-center justify-between rounded-xl bg-[#C1D2DE] px-4 py-2">
        <button
          type="button"
          class="flex items-center gap-2 text-sm font-semibold text-slate-700"
          @click="emit('toggle-type', 'event')"
        >
          <span :class="typeDotClass('event')" />
          Event
        </button>
        <button
          type="button"
          class="flex items-center gap-2 text-sm font-semibold text-slate-700"
          @click="emit('toggle-type', 'attraction')"
        >
          <span :class="typeDotClass('attraction')" />
          Attraction
        </button>
      </div>
      <button
        type="button"
        class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-500"
        @click="emit('clear')"
      >
        Ryd type
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SearchFilterType } from '@/types/search'

defineProps<{
  isOpen: boolean
  typeDotClass: (value: SearchFilterType) => string
}>()

const emit = defineEmits<{
  clear: []
  toggle: []
  'toggle-type': [type: SearchFilterType]
}>()
</script>
