<template>
  <form class="rounded-lg border border-slate-200 bg-white p-5" @submit.prevent="emit('submit')">
    <div>
      <h2 class="text-xl font-black text-[#094b7b]">Ny henvendelse</h2>
      <p class="mt-1 text-sm text-slate-600">
        Vælg den kategori der passer bedst, så admin lettere kan prioritere sagen.
      </p>
    </div>

    <fieldset class="mt-5 grid gap-3">
      <legend class="text-base font-black text-slate-800">Kategori</legend>
      <label
        v-for="option in categoryOptions"
        :key="option.key"
        class="cursor-pointer rounded-lg border border-slate-200 p-3 transition hover:border-[#094b7b]/40"
        :class="form.category === option.key ? 'bg-slate-50 ring-2 ring-[#094b7b]' : 'bg-white'"
      >
        <input v-model="form.category" class="sr-only" type="radio" :value="option.key" />
        <span class="flex flex-wrap items-center justify-between gap-2">
          <span class="font-black text-slate-900">{{ option.label }}</span>
          <span class="rounded-full px-2 py-1 text-xs font-black" :class="option.badgeClass">
            {{ option.label }}
          </span>
        </span>
        <span class="mt-1 block text-sm text-slate-600">{{ option.description }}</span>
      </label>
    </fieldset>

    <label class="mt-5 block">
      <span class="text-base font-black text-slate-800">Titel</span>
      <input
        v-model.trim="form.subject"
        class="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#094b7b] focus:ring-2 focus:ring-[#094b7b]/20"
        maxlength="140"
        placeholder="Kort titel på sagen"
        required
        type="text"
      />
    </label>

    <label class="mt-4 block">
      <span class="text-base font-black text-slate-800">Besked</span>
      <textarea
        v-model.trim="form.message"
        class="mt-2 min-h-40 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#094b7b] focus:ring-2 focus:ring-[#094b7b]/20"
        maxlength="3000"
        placeholder="Beskriv hvad der skete, hvor det skete, og hvad du forventede."
        required
      />
    </label>

    <p v-if="errorMessage" class="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
      {{ errorMessage }}
    </p>
    <p
      v-if="successMessage"
      class="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700"
    >
      {{ successMessage }}
    </p>

    <button
      class="mt-5 rounded-md bg-[#094b7b] px-4 py-2 text-sm font-black text-white transition hover:bg-[#0b5d98] disabled:cursor-not-allowed disabled:bg-slate-400"
      :disabled="isSubmitting"
      type="submit"
    >
      {{ isSubmitting ? 'Sender...' : 'Send henvendelse' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import type { CreateContactTicketPayload, contactTicketCategoryOptions } from '@/types/contact-ticket'

defineProps<{
  categoryOptions: typeof contactTicketCategoryOptions
  errorMessage: string
  form: CreateContactTicketPayload
  isSubmitting: boolean
  successMessage: string
}>()

const emit = defineEmits<{
  submit: []
}>()
</script>
