<template>
  <div class="relative flex min-w-[180px] flex-1 items-center">
    <div
      class="flex w-full items-center justify-between rounded-full bg-transparent px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100/70"
      @click="emit('toggle')"
    >
      <input
        :value="location"
        type="text"
        placeholder="Lokation"
        class="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-700"
        @click.stop
        @focus="emit('open')"
        @input="handleInput"
      />
      <span class="ml-2 shrink-0 text-xs text-slate-600">{{ isOpen ? '▲' : '▼' }}</span>
    </div>

    <div
      v-if="isOpen"
      class="absolute left-0 top-full z-20 mt-2.5 w-56 rounded-2xl border-[5px] border-[#C1D2DE] bg-white p-2 shadow-lg"
    >
      <div class="filter-scroll max-h-40 space-y-1 overflow-y-auto pr-1">
        <button
          v-for="locationOption in options"
          :key="locationOption"
          type="button"
          class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          @click="emit('select', locationOption)"
        >
          <span>{{ locationOption }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean
  location: string
  options: string[]
}>()

const emit = defineEmits<{
  open: []
  select: [location: string]
  toggle: []
  'update:location': [location: string]
}>()

const handleInput = (event: Event) => {
  emit('update:location', (event.target as HTMLInputElement).value)
  emit('open')
}
</script>
