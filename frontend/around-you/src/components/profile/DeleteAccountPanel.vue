<template>
  <div class="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4">
    <h3 class="text-lg font-black text-rose-800">Slet konto</h3>
    <p class="mt-2 text-sm leading-6 text-rose-700">
      Din konto bliver deaktiveret, og du bliver logget ud.
    </p>
    <button
      type="button"
      class="mt-4 rounded-full bg-rose-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
      :disabled="deletingAccount"
      @click="emit('open')"
    >
      Slet konto
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  deletingAccount: boolean
}>()

const emit = defineEmits<{
  open: []
}>()
</script>
