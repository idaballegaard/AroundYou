<template>
  <div class="flex max-w-full overflow-x-auto rounded-md border border-slate-200 bg-slate-50 p-1">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="shrink-0 rounded px-2.5 py-1.5 text-sm font-black sm:px-3"
      :class="model === tab.key ? 'bg-white text-[#094b7b] shadow-sm' : 'text-slate-500'"
      @click="model = tab.key"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup lang="ts" generic="TKey extends string">
defineProps<{
  tabs: { key: TKey; label: string }[]
}>()

const model = defineModel<TKey>({ required: true })
</script>
