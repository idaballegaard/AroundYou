<template>
  <div class="relative flex min-w-[180px] flex-1 items-center">
    <button
      type="button"
      class="flex w-full items-center justify-between gap-2 rounded-full bg-transparent px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100/70"
      @click="emit('toggle')"
    >
      <span>Tidspunkt</span>
      <span class="truncate text-sm text-slate-600">{{ displayValue }}</span>
      <span class="text-xs text-slate-600">{{ isOpen ? '▲' : '▼' }}</span>
    </button>

    <div
      v-if="isOpen"
      class="absolute left-1/2 top-full z-20 mt-2.5 w-60 -translate-x-1/2 rounded-2xl border-[5px] border-[#C1D2DE] bg-white p-2 shadow-lg"
    >
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-[#C1D2DE]/50"
        :class="time === option.value ? 'bg-[#C1D2DE]' : ''"
        @click="emit('select', option.value)"
      >
        {{ option.label }}
      </button>

      <label v-if="time === 'custom'" class="mt-2 block border-t border-slate-100 px-3 pt-3 text-xs font-semibold text-slate-600">
        Vælg klokkeslæt
        <input
          :value="customTime"
          type="time"
          class="mt-1 block w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700"
          @input="emit('update:custom-time', ($event.target as HTMLInputElement).value)"
        />
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SearchTimeFilter } from '@/types/search'

const props = defineProps<{
  customTime: string
  isOpen: boolean
  time: SearchTimeFilter | ''
}>()

const emit = defineEmits<{
  select: [time: SearchTimeFilter]
  toggle: []
  'update:custom-time': [time: string]
}>()

const options: Array<{ label: string; value: SearchTimeFilter }> = [
  { label: 'Lige nu', value: 'now' },
  { label: 'Næste par timer', value: 'next-hours' },
  { label: 'Senere i dag', value: 'later-today' },
  { label: 'Vælg tidspunkt', value: 'custom' },
]

const displayValue = computed(
  () => options.find((option) => option.value === props.time)?.label ?? '',
)
</script>
