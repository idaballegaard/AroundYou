<template>
  <div ref="pickerRef" class="relative rounded-xl border border-slate-200 bg-white px-4 py-3">
    <label class="mb-2 block text-sm font-semibold text-slate-700">{{ label }}</label>
    <input
      v-model="query"
      type="text"
      class="w-full rounded-lg border border-transparent bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#de9b00] focus:bg-white"
      :placeholder="placeholder"
      @focus="isOpen = true"
      @input="isOpen = true"
      @keydown.enter.prevent="addQuery"
    />

    <div
      v-if="isOpen && menuItems.length"
      class="absolute left-4 right-4 top-[92px] z-30 max-h-52 overflow-y-auto rounded-xl border border-[#C1D2DE] bg-white p-2 shadow-lg"
    >
      <button
        v-for="item in menuItems"
        :key="item.value"
        type="button"
        class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-600 hover:bg-slate-100"
        @click="addCategory(item.value)"
      >
        <span>{{ item.label }}</span>
        <span v-if="item.isNew" class="text-xs text-[#094b7b]">Opret</span>
      </button>
    </div>

    <div v-if="modelValue.length" class="mt-3 flex flex-wrap gap-2">
      <button
        v-for="category in modelValue"
        :key="category"
        type="button"
        class="flex items-center gap-2 rounded-full bg-[#C1D2DE] px-3 py-1 text-xs font-semibold text-[#094b7b]"
        @click="removeCategory(category)"
      >
        <span>{{ category }}</span>
        <span class="text-sm font-bold leading-none">x</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    options?: string[]
    label?: string
    placeholder?: string
  }>(),
  {
    options: () => [],
    label: 'Kategorier',
    placeholder: 'Søg eller opret kategori',
  },
)

const emit = defineEmits<{ (event: 'update:modelValue', value: string[]): void }>()

const query = ref('')
const isOpen = ref(false)
const pickerRef = ref<HTMLElement | null>(null)

// Slugs are intentionally stored normalized so filtering, duplicate checks, and
// backend payloads all use the same category identity.
const normalizeCategory = (value: string) => value.trim().toLowerCase()

const selectedCategories = computed(() => new Set(props.modelValue.map(normalizeCategory)))

const filteredOptions = computed(() => {
  const normalizedQuery = normalizeCategory(query.value)
  return props.options
    .map(normalizeCategory)
    .filter(Boolean)
    .filter((category, index, categories) => categories.indexOf(category) === index)
    .filter((category) => !selectedCategories.value.has(category))
    .filter((category) => (normalizedQuery ? category.includes(normalizedQuery) : true))
    .sort()
})

const menuItems = computed(() => {
  const normalizedQuery = normalizeCategory(query.value)
  const items = filteredOptions.value.map((category) => ({
    value: category,
    label: category,
    isNew: false,
  }))

  if (
    normalizedQuery &&
    !selectedCategories.value.has(normalizedQuery) &&
    !filteredOptions.value.includes(normalizedQuery)
  ) {
    // Let users create a category from the current query when it does not exist
    // in the provided option list.
    items.unshift({
      value: normalizedQuery,
      label: normalizedQuery,
      isNew: true,
    })
  }

  return items
})

const addCategory = (category: string) => {
  const normalized = normalizeCategory(category)
  if (!normalized || selectedCategories.value.has(normalized)) {
    return
  }

  emit('update:modelValue', [...props.modelValue, normalized])
  query.value = ''
  isOpen.value = false
}

const addQuery = () => {
  addCategory(query.value)
}

const removeCategory = (category: string) => {
  emit('update:modelValue', props.modelValue.filter((item) => item !== category))
}

const handleOutsideClick = (event: MouseEvent) => {
  // The dropdown is not a native select, so close it manually when focus moves
  // outside the picker.
  const target = event.target as Node | null
  if (!target || !pickerRef.value?.contains(target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleOutsideClick)
})
</script>
