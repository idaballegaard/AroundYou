<template>
  <section class="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-[#de5826]">Crawler</p>
        <h2 class="mt-2 text-lg font-black text-[#094b7b] sm:text-xl">Nye eventkandidater</h2>
        <p class="mt-1 text-sm text-slate-600">Rå events fra Oplev Esbjerg, som endnu ikke er gennemgået.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          class="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isLoading || isCrawling"
          @click="loadCandidates"
        >
          Opdater liste
        </button>
        <button
          class="rounded-md bg-[#094b7b] px-3 py-2 text-sm font-black text-white hover:bg-[#073d65] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isCrawling"
          @click="runCrawler"
        >
          {{ isCrawling ? 'Henter events...' : 'Hent events fra Oplev Esbjerg' }}
        </button>
      </div>
    </div>

    <p v-if="errorMessage" class="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
      {{ errorMessage }}
    </p>
    <p v-if="successMessage" class="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">
      {{ successMessage }}
    </p>

    <div v-if="isLoading" class="mt-4 rounded-md bg-slate-50 p-4 text-sm font-semibold text-slate-600">
      Henter eventkandidater...
    </div>
    <div v-else-if="!candidates.length" class="mt-4 rounded-md bg-slate-50 p-4 text-sm font-semibold text-slate-600">
      Der er endnu ingen nye eventkandidater. Hent events for at starte den første import.
    </div>
    <div v-else class="mt-4 grid gap-3">
      <article v-for="candidate in candidates" :key="candidate._id" class="rounded-lg border border-slate-200 p-3 sm:p-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-black text-slate-900">{{ candidate.title }}</h3>
              <span v-if="candidate.category" class="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{{ candidate.category }}</span>
            </div>
            <p v-if="candidate.description" class="mt-2 text-sm text-slate-700">{{ candidate.description }}</p>
            <p class="mt-2 text-sm text-slate-500">{{ candidate.dateText }}<span v-if="candidate.locationText"> · {{ candidate.locationText }}</span></p>
          </div>
          <a
            :href="candidate.sourceUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="shrink-0 text-sm font-bold text-[#094b7b] underline underline-offset-2"
          >
            Se kilde
          </a>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useAdminCrawlerCandidates } from '@/composables/admin/useAdminCrawlerCandidates'

const { candidates, errorMessage, isCrawling, isLoading, loadCandidates, runCrawler, successMessage } =
  useAdminCrawlerCandidates()
</script>
