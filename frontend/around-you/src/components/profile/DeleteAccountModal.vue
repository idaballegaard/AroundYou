<template>
  <div
    class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="delete-account-title"
  >
    <div class="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.32)]">
      <h2 id="delete-account-title" class="text-2xl font-black text-[#094b7b]">Er du sikker?</h2>
      <p class="mt-3 text-sm leading-6 text-slate-700">
        Vil du slette din konto? Kontoen bliver deaktiveret, men dine data bliver ikke slettet
        permanent.
      </p>
      <p
        v-if="deleteAccountError"
        class="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
      >
        {{ deleteAccountError }}
      </p>
      <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="rounded-full px-5 py-2.5 text-sm font-semibold text-[#094b7b] transition hover:bg-[#C1D2DE]"
          :disabled="deletingAccount"
          @click="emit('close')"
        >
          Annuller
        </button>
        <button
          type="button"
          class="rounded-full bg-rose-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="deletingAccount"
          @click="emit('confirm')"
        >
          {{ deletingAccount ? 'Sletter...' : 'Ja, slet min konto' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  deleteAccountError: string
  deletingAccount: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()
</script>
