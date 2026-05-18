<template>
  <p v-if="message" ref="messageElement" :class="messageClass">
    {{ message }}
  </p>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CreateContentMessageType } from '@/types/content/useCreateContent'

const props = defineProps<{
  message: string
  messageType: CreateContentMessageType
}>()

const messageElement = ref<HTMLElement | null>(null)

const messageClass = computed(() => [
  'mb-4 rounded-xl px-4 py-3 text-sm font-semibold',
  props.messageType === 'success'
    ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
    : props.messageType === 'error'
      ? 'bg-rose-50 text-rose-800 ring-1 ring-rose-200'
      : 'bg-[#C1D2DE] text-[#094b7b]',
])

defineExpose({
  scrollIntoView: () => {
    messageElement.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  },
})
</script>
