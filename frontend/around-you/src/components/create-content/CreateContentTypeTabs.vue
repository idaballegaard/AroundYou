<template>
  <div class="mb-6 flex flex-wrap items-center gap-3">
    <button
      v-for="option in contentTypeOptions"
      :key="option.value"
      type="button"
      class="rounded-full px-4 py-2 text-sm font-semibold transition"
      :class="typeButtonClass(option.value)"
      @click="model = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ContentType } from '@/types/content'

defineProps<{
  typeButtonClass: (value: ContentType) => string
}>()

const model = defineModel<ContentType>({ required: true })

const contentTypeOptions: { value: ContentType; label: string }[] = [
  { value: 'event', label: 'Event' },
  { value: 'attraction', label: 'Attraktion' },
  { value: 'city', label: 'By' },
]
</script>
