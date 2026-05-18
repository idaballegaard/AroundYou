<template>
  <section class="rounded-lg border border-slate-200 bg-white p-5">
    <p class="text-xs font-bold uppercase tracking-[0.18em] text-[#de5826]">Live preview</p>
    <h2 class="mt-2 text-xl font-black text-[#094b7b]">Sådan sendes din sag</h2>

    <article class="mt-5 rounded-lg border border-l-4 border-slate-200 p-4" :class="selectedCategory.borderClass">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="font-black text-slate-900">
              {{ previewSubject }}
            </h3>
            <span class="rounded-full px-2 py-1 text-xs font-black" :class="selectedCategory.badgeClass">
              {{ selectedCategory.label }}
            </span>
          </div>
          <p class="mt-1 text-sm text-slate-600">{{ displayUserName }} · {{ userEmail }}</p>
          <p class="mt-1 text-xs font-bold text-slate-500">Oprettes {{ previewDate }}</p>
        </div>
        <span class="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">
          Klar til afsendelse
        </span>
      </div>

      <p
        class="mt-4 min-h-36 whitespace-pre-line rounded-md bg-slate-50 p-3 text-sm text-slate-700"
        :class="hasMessage ? '' : 'font-semibold text-slate-400'"
      >
        {{ previewMessage }}
      </p>

      <div class="mt-4 grid gap-2 text-sm text-slate-600">
        <p>
          <span class="font-black text-slate-800">Kategori:</span>
          {{ selectedCategory.label }}
        </p>
        <p><span class="font-black text-slate-800">Dato:</span> {{ previewDate }}</p>
        <p><span class="font-black text-slate-800">Status:</span> Sendes som åben sag</p>
        <p>
          <span class="font-black text-slate-800">Kontakt:</span> Admin kan svare via email
        </p>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import type { getContactTicketCategoryMeta } from '@/types/contact-ticket'

defineProps<{
  displayUserName: string
  hasMessage: boolean
  previewDate: string
  previewMessage: string
  previewSubject: string
  selectedCategory: ReturnType<typeof getContactTicketCategoryMeta>
  userEmail: string
}>()
</script>
