<template>
  <div class="relative flex min-w-[140px] flex-1 items-center">
    <button
      type="button"
      class="flex w-full items-center justify-between gap-2 rounded-full bg-transparent px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100/70"
      @click="emit('toggle')"
    >
      <span class="min-w-[40px]">Dato</span>
      <div class="flex items-center gap-2">
        <span class="text-sm text-slate-600">
          {{ displayDate }}
        </span>
        <span class="text-xs text-slate-600">{{ isOpen ? '▲' : '▼' }}</span>
      </div>
    </button>

    <div
      v-if="isOpen"
      class="absolute left-1/2 top-full z-20 mt-2.5 w-[230px] -translate-x-1/2 rounded-[28px] bg-[#C1D2DE] p-2 shadow-lg"
    >
      <div class="flex items-center justify-between rounded-[24px] bg-white px-3 py-2">
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-full text-slate-700 hover:bg-[#C1D2DE]/60"
          @click="emit('previous-month')"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <span class="text-sm font-semibold text-slate-700">{{ monthLabel }}</span>
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-full text-slate-700 hover:bg-[#C1D2DE]/60"
          @click="emit('next-month')"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <div class="mt-3 rounded-[22px] bg-white px-3 pb-3 pt-2">
        <div class="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#1E5A88]">
          <span v-for="day in weekdayLabels" :key="day">{{ day }}</span>
        </div>
        <div class="mt-2 grid grid-cols-7 gap-1 text-center text-sm text-[#1E5A88]">
          <button
            v-for="(day, index) in calendarDays"
            :key="index"
            type="button"
            class="h-7 w-7 rounded-full text-sm font-semibold"
            :class="dayButtonClass(day)"
            :disabled="!day"
            @click="emit('select-date', day)"
          >
            {{ day || '' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  calendarDays: Array<number | null>
  dayButtonClass: (day: number | null) => string
  displayDate: string
  isOpen: boolean
  monthLabel: string
  weekdayLabels: string[]
}>()

const emit = defineEmits<{
  'next-month': []
  'previous-month': []
  'select-date': [day: number | null]
  toggle: []
}>()
</script>
