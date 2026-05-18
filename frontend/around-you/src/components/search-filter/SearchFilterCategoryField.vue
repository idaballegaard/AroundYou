<template>
  <div class="relative flex min-w-[200px] flex-1 items-center">
    <div
      class="flex w-full items-center justify-between rounded-full bg-transparent px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100/70"
      @click="emit('toggle')"
    >
      <input
        :value="query"
        type="text"
        placeholder="Kategorier"
        class="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-700"
        @click.stop
        @focus="emit('open')"
        @input="handleInput"
        @keydown.enter.prevent="emit('add-query')"
      />
      <span class="ml-2 shrink-0 text-xs text-slate-600">{{ isOpen ? '▲' : '▼' }}</span>
    </div>

    <div
      v-if="isOpen"
      class="absolute right-0 top-full z-20 mt-2.5 w-56 rounded-2xl border-[5px] border-[#C1D2DE] bg-white p-2 shadow-lg"
    >
      <div class="filter-scroll max-h-40 space-y-1 overflow-y-auto pr-1">
        <button
          v-for="category in options"
          :key="category"
          type="button"
          class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          @click="emit('toggle-category', category)"
        >
          <span>{{ category }}</span>
        </button>
      </div>
      <div v-if="selectedCategories.length" class="-mx-2 -mb-2 mt-3 rounded-b-1xl bg-[#C1D2DE] p-3">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="category in selectedCategories"
            :key="category"
            type="button"
            class="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1E5A88]"
            @click="emit('remove-category', category)"
          >
            <span>{{ category }}</span>
            <span class="text-sm font-bold leading-none text-[#1E5A88]">×</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean
  options: string[]
  query: string
  selectedCategories: string[]
}>()

const emit = defineEmits<{
  'add-query': []
  open: []
  'remove-category': [category: string]
  toggle: []
  'toggle-category': [category: string]
  'update:query': [query: string]
}>()

const handleInput = (event: Event) => {
  emit('update:query', (event.target as HTMLInputElement).value)
  emit('open')
}
</script>
