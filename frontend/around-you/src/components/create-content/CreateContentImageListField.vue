<template>
  <div class="rounded-xl border border-slate-200 px-4 py-3">
    <label class="mb-2 block text-sm font-semibold text-slate-700">{{ label }}</label>
    <input
      :id="inputId"
      type="file"
      multiple
      accept="image/png,image/jpeg,image/jpg,image/webp"
      capture="environment"
      class="sr-only"
      @change="emit('selected', $event)"
    />
    <label
      :for="inputId"
      class="inline-flex cursor-pointer rounded-lg bg-[#094b7b] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0b5d98]"
    >
      Vælg billeder
    </label>
    <p class="mt-2 text-xs text-slate-600">{{ files.length }} billeder valgt</p>
    <div v-if="files.length" class="mt-3 flex flex-wrap gap-2">
      <span
        v-for="(file, index) in files"
        :key="`${file.name}-${file.size}-${file.lastModified}-${index}`"
        class="inline-flex max-w-full items-center gap-2 rounded-full border border-[#C1D2DE] bg-[#C1D2DE]/35 px-3 py-1 text-xs font-semibold text-[#094b7b]"
      >
        <span class="truncate">{{ file.name }}</span>
        <button
          type="button"
          class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-sm leading-none transition hover:bg-white/70"
          :aria-label="`Fjern ${file.name}`"
          @click="emit('remove', index)"
        >
          x
        </button>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    files: File[]
    inputId: string
    label?: string
  }>(),
  {
    label: 'Ekstra billeder',
  },
)

const emit = defineEmits<{
  selected: [event: Event]
  remove: [index: number]
}>()
</script>
