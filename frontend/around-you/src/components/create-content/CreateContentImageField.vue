<template>
  <div class="rounded-xl border border-slate-200 px-4 py-3">
    <label class="mb-2 block text-sm font-semibold text-slate-700">{{ label }}</label>
    <input
      :id="inputId"
      type="file"
      accept="image/png,image/jpeg,image/jpg,image/webp"
      capture="environment"
      class="sr-only"
      @change="emit('selected', $event)"
    />
    <label
      :for="inputId"
      class="inline-flex cursor-pointer rounded-lg bg-[#094b7b] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0b5d98]"
    >
      Vælg billede
    </label>
    <p v-if="selectedFile" class="mt-2 break-all text-xs text-slate-600">
      Valgt: {{ selectedFile.name }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue'

withDefaults(
  defineProps<{
    label?: string
    selectedFile: File | null
  }>(),
  {
    label: 'Primært billede',
  },
)

const emit = defineEmits<{
  selected: [event: Event]
}>()

const inputId = `hero-image-${useId()}`
</script>
