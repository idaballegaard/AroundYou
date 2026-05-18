<template>
  <div
    class="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 px-3 py-4 sm:px-4 sm:py-6"
    role="dialog"
    aria-modal="true"
    aria-labelledby="ticket-modal-title"
    @click.self="$emit('close')"
  >
    <article
      class="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-4 shadow-2xl sm:p-5"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-[#de5826]">Henvendelse</p>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <h3
              id="ticket-modal-title"
              class="break-words text-xl font-black text-[#094b7b] sm:text-2xl"
            >
              {{ ticket.subject }}
            </h3>
            <span class="rounded-full px-2 py-1 text-xs font-black" :class="category.badgeClass">
              {{ category.label }}
            </span>
            <span
              class="rounded-full px-2 py-1 text-xs font-black"
              :class="getContactTicketStatusBadgeClass(ticket.status)"
            >
              {{ getContactTicketStatusLabel(ticket.status) }}
            </span>
          </div>
        </div>
        <button
          class="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700"
          @click="$emit('close')"
        >
          Luk
        </button>
      </div>

      <div
        class="mt-5 grid gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 sm:grid-cols-2 sm:p-4"
      >
        <p><span class="font-black text-slate-900">Bruger:</span> {{ ticket.submittedByName }}</p>
        <p><span class="font-black text-slate-900">Email:</span> {{ ticket.submittedByEmail }}</p>
        <p>
          <span class="font-black text-slate-900">Oprettet:</span>
          {{ formatDate(ticket.createdAt) }}
        </p>
        <p>
          <span class="font-black text-slate-900">Opdateret:</span>
          {{ formatDate(ticket.updatedAt) }}
        </p>
        <p v-if="ticket.completedAt">
          <span class="font-black text-slate-900">Afsluttet:</span>
          {{ formatDate(ticket.completedAt) }}
        </p>
        <p v-if="ticket.rejectedAt">
          <span class="font-black text-slate-900">Afvist:</span>
          {{ formatDate(ticket.rejectedAt) }}
        </p>
      </div>

      <div class="mt-5 rounded-lg border border-slate-200 p-3 sm:p-4">
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Beskrivelse</p>
        <p class="mt-3 whitespace-pre-line text-sm leading-6 text-slate-800">
          {{ ticket.message }}
        </p>
      </div>

      <div
        v-if="ticket.rejectionReason"
        class="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-3 sm:p-4"
      >
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-rose-700">Afvisningsårsag</p>
        <p class="mt-3 whitespace-pre-line text-sm leading-6 text-rose-800">
          {{ ticket.rejectionReason }}
        </p>
      </div>

      <div class="mt-5 grid gap-2 sm:flex sm:flex-wrap sm:justify-between">
        <a
          class="rounded-md bg-[#094b7b] px-3 py-2 text-sm font-black text-white transition hover:bg-[#0b5d98]"
          :href="`mailto:${ticket.submittedByEmail}?subject=${encodeMailSubject(ticket.subject)}`"
        >
          Skriv til bruger
        </a>
        <button
          v-if="ticket.status === 'open'"
          class="rounded-md bg-sky-700 px-3 py-2 text-sm font-black text-white"
          @click="$emit('startWork', ticket._id)"
        >
          Behandl sag
        </button>
        <button
          v-if="ticket.status !== 'completed' && ticket.status !== 'rejected'"
          class="rounded-md bg-emerald-600 px-3 py-2 text-sm font-black text-white"
          @click="$emit('complete', ticket._id)"
        >
          Afslut sag
        </button>
        <button
          v-if="ticket.status !== 'completed' && ticket.status !== 'rejected'"
          class="rounded-md bg-rose-600 px-3 py-2 text-sm font-black text-white"
          @click="$emit('reject', ticket._id)"
        >
          Afvis sag
        </button>
        <button
          v-else
          class="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700"
          @click="$emit('reopen', ticket._id)"
        >
          Genåbn sag
        </button>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  formatAdminContactTicketDate,
  getContactTicketStatusBadgeClass,
  getContactTicketStatusLabel,
} from '@/composables/admin/adminContactTickets.helpers'
import { getContactTicketCategoryMeta, type ContactTicket } from '@/types/contact-ticket'

const props = defineProps<{
  ticket: ContactTicket
}>()

defineEmits<{
  close: []
  complete: [id: string]
  reject: [id: string]
  reopen: [id: string]
  startWork: [id: string]
}>()

const category = computed(() => getContactTicketCategoryMeta(props.ticket.category))
const formatDate = formatAdminContactTicketDate

function encodeMailSubject(subject: string): string {
  return encodeURIComponent(`Vedrørende din henvendelse: ${subject}`)
}
</script>
