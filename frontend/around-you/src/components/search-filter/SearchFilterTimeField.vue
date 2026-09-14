<template>
  <div class="relative flex min-w-[180px] flex-1 items-center">
    <button
      type="button"
      class="flex w-full items-center justify-between gap-2 rounded-full bg-white/25 px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-[#094b7b]/10 transition hover:bg-white/55 hover:ring-[#094b7b]/25"
      @click="emit('toggle')"
    >
      <span>Tidspunkt</span>
      <span class="min-w-0 flex-1 truncate text-right text-sm text-slate-600">{{ displayValue }}</span>
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
        <div class="mt-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <select
            :value="selectedHour"
            aria-label="Time"
            class="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700"
            @change="updateTimePart('hour', $event)"
          >
            <option value="">Time</option>
            <option v-for="hour in hours" :key="hour" :value="hour">{{ hour }}</option>
          </select>
          <span aria-hidden="true">:</span>
          <select
            :value="selectedMinute"
            aria-label="Minutter"
            class="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700"
            @change="updateTimePart('minute', $event)"
          >
            <option value="">Min.</option>
            <option v-for="minute in minutes" :key="minute" :value="minute">{{ minute }}</option>
          </select>
        </div>
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
const hours = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'))
const minutes = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'))

const selectedHour = computed(() => props.customTime.split(':')[0] ?? '')
const selectedMinute = computed(() => props.customTime.split(':')[1] ?? '')

const displayValue = computed(() => {
  if (props.time === 'custom') {
    return props.customTime || 'Vælg tidspunkt'
  }

  return options.find((option) => option.value === props.time)?.label ?? ''
})

const updateTimePart = (part: 'hour' | 'minute', event: Event) => {
  const value = (event.target as HTMLSelectElement).value
  const hour = part === 'hour' ? value : selectedHour.value || '00'
  const minute = part === 'minute' ? value : selectedMinute.value || '00'

  emit('update:custom-time', hour && minute ? `${hour}:${minute}` : '')
}
</script>
