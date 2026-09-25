<template>
  <section class="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-[#de5826]">Crawler</p>
        <h2 class="mt-2 text-lg font-black text-[#094b7b] sm:text-xl">Nye eventkandidater</h2>
        <p class="mt-1 text-sm text-slate-600">Rå events fra Oplev Esbjerg, som endnu ikke er gennemgået.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <label v-if="crawlerSources.length > 1" class="sr-only" for="crawler-source">Eventkilde</label>
        <select
          v-if="crawlerSources.length > 1"
          id="crawler-source"
          :value="selectedSourceId"
          class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700"
          @change="setSelectedSource(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="source in crawlerSources" :key="source.id" :value="source.id" :disabled="source.status !== 'active'">
            {{ source.label }}{{ source.status === 'planned' ? ' (kommer snart)' : '' }}
          </option>
        </select>
        <button
          class="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isLoading || isCrawling"
          @click="loadCandidates"
        >
          Opdater liste
        </button>
        <button
          v-if="activeStatus === 'new'"
          class="rounded-md bg-[#094b7b] px-3 py-2 text-sm font-black text-white hover:bg-[#073d65] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isCrawling"
          @click="runCrawler"
        >
          {{ isCrawling ? 'Henter events...' : `Hent events fra ${selectedSourceLabel}` }}
        </button>
      </div>
    </div>

    <div class="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
      <p class="font-black text-[#094b7b]">Importstatus</p>
      <template v-if="crawlerStatus">
        <p v-if="crawlerStatus.lastRun" class="mt-1">
          Seneste import: {{ formatDate(crawlerStatus.lastRun.finishedAt || crawlerStatus.lastRun.startedAt) }}
          <span class="text-slate-500">· {{ crawlerStatus.lastRun.trigger === 'scheduled' ? 'Automatisk' : 'Manuel' }}</span>
          <span v-if="crawlerStatus.lastRun.status === 'succeeded'" class="font-semibold text-emerald-700">
            · Gennemført: {{ crawlerStatus.lastRun.inserted }} nye, {{ crawlerStatus.lastRun.updated }} opdaterede
          </span>
          <span v-else-if="crawlerStatus.lastRun.status === 'failed'" class="font-semibold text-rose-700">
            · Mislykkedes{{ crawlerStatus.lastRun.errorMessage ? `: ${crawlerStatus.lastRun.errorMessage}` : '' }}
          </span>
          <span v-else class="font-semibold text-amber-700">· Kører</span>
        </p>
        <p v-else class="mt-1 text-slate-500">Der er endnu ikke gennemført en import.</p>
        <p class="mt-1 text-slate-500">
          {{ crawlerStatus.dailyImportEnabled && crawlerStatus.nextImportAt
            ? `Næste automatiske import: ${formatDate(crawlerStatus.nextImportAt)}`
            : crawlerStatus.source.supportsScheduledImport
              ? 'Automatisk import er deaktiveret.'
              : 'Automatisk import er ikke sat op for denne kilde.' }}
        </p>
      </template>
      <p v-else class="mt-1 text-slate-500">Henter importstatus...</p>
      <p v-if="statusError" class="mt-1 font-semibold text-rose-700">{{ statusError }}</p>
    </div>

    <div class="mt-4 flex gap-2 overflow-x-auto border-b border-slate-200">
      <button
        v-for="tab in statusTabs"
        :key="tab.status"
        type="button"
        class="shrink-0 border-b-2 px-3 py-2 text-sm font-black transition"
        :class="activeStatus === tab.status ? 'border-[#094b7b] text-[#094b7b]' : 'border-transparent text-slate-500 hover:text-slate-800'"
        @click="setActiveStatus(tab.status)"
      >
        {{ tab.label }}
      </button>
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
      {{ activeStatus === 'new' ? 'Der er ingen nye eventkandidater. Hent events for at starte en import.' : `Der er ingen ${activeStatus === 'approved' ? 'godkendte' : 'afviste'} eventkandidater.` }}
    </div>
    <div v-else class="mt-4 grid gap-3">
      <article v-for="candidate in candidates" :key="candidate._id" class="rounded-lg border border-slate-200 p-3 sm:p-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-black text-slate-900">{{ candidate.title }}</h3>
              <span v-if="candidate.category" class="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{{ candidate.category }}</span>
              <span v-if="candidate.possibleDuplicates.length" class="rounded-full bg-amber-100 px-2 py-1 text-xs font-black text-amber-800">Mulig dublet</span>
            </div>
            <p v-if="candidate.description" class="mt-2 whitespace-pre-line text-sm text-slate-700">{{ candidate.description }}</p>
            <p class="mt-2 text-sm text-slate-500">{{ candidate.dateText }}<span v-if="candidate.locationText"> · {{ candidate.locationText }}</span></p>
            <div v-if="candidate.possibleDuplicates.length" class="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              <p class="font-bold">Kontrollér før godkendelse</p>
              <ul class="mt-1 grid gap-1">
                <li v-for="duplicate in candidate.possibleDuplicates" :key="duplicate._id">
                  <span class="font-black">{{ duplicate.matchConfidence }} sandsynlighed ({{ duplicate.matchScore }}%)</span>
                  · {{ duplicate.matchReasons.join(', ') }}
                  <br />
                  {{ duplicate.status === 'approved' ? 'Allerede godkendt' : 'Ny kandidat' }} fra {{ duplicate.source }}: {{ duplicate.title }}
                  <button type="button" class="ml-2 font-bold text-[#094b7b] underline underline-offset-2" @click="toggleDuplicateComparison(candidate, duplicate._id)">
                    {{ isComparingDuplicate(candidate._id, duplicate._id) ? 'Luk sammenligning' : 'Sammenlign' }}
                  </button>
                </li>
              </ul>
            </div>
            <section
              v-for="duplicate in candidate.possibleDuplicates"
              v-show="isComparingDuplicate(candidate._id, duplicate._id)"
              :key="`comparison-${duplicate._id}`"
              class="mt-3 grid gap-3 rounded-md border border-[#094b7b] bg-slate-50 p-3 lg:grid-cols-2"
            >
              <article class="min-w-0 rounded-md bg-white p-3 shadow-sm">
                <p class="text-xs font-black uppercase tracking-wide text-[#094b7b]">Denne kandidat</p>
                <img v-if="candidate.imageUrl" :src="candidate.imageUrl" :alt="candidate.title" class="mt-2 h-32 w-full rounded object-cover" />
                <h4 class="mt-2 font-black text-slate-900">{{ candidate.title }}</h4>
                <dl class="mt-2 grid gap-1 text-sm text-slate-700">
                  <div><dt class="inline font-bold">Tid: </dt><dd class="inline">{{ formatEventDateTime(candidate.startDate, candidate.endDate) }}</dd></div>
                  <div><dt class="inline font-bold">Sted: </dt><dd class="inline">{{ candidate.locationText || 'Ikke oplyst' }}</dd></div>
                  <div><dt class="inline font-bold">Adresse: </dt><dd class="inline">{{ candidate.addressText || 'Ikke oplyst' }}</dd></div>
                </dl>
                <p class="mt-2 max-h-28 overflow-y-auto whitespace-pre-line text-sm text-slate-700">{{ candidate.description || 'Ingen beskrivelse fra kilden.' }}</p>
              </article>
              <article class="min-w-0 rounded-md bg-white p-3 shadow-sm">
                <p class="text-xs font-black uppercase tracking-wide text-amber-800">Mulig dublet · {{ duplicate.matchConfidence }} sandsynlighed</p>
                <img v-if="duplicate.imageUrl" :src="duplicate.imageUrl" :alt="duplicate.title" class="mt-2 h-32 w-full rounded object-cover" />
                <h4 class="mt-2 font-black text-slate-900">{{ duplicate.title }}</h4>
                <dl class="mt-2 grid gap-1 text-sm text-slate-700">
                  <div><dt class="inline font-bold">Tid: </dt><dd class="inline">{{ formatEventDateTime(duplicate.startDate, duplicate.endDate) }}</dd></div>
                  <div><dt class="inline font-bold">Sted: </dt><dd class="inline">{{ duplicate.locationText || 'Ikke oplyst' }}</dd></div>
                  <div><dt class="inline font-bold">Adresse: </dt><dd class="inline">{{ duplicate.addressText || 'Ikke oplyst' }}</dd></div>
                </dl>
                <p class="mt-2 max-h-28 overflow-y-auto whitespace-pre-line text-sm text-slate-700">{{ duplicate.description || 'Ingen beskrivelse fra kilden.' }}</p>
              </article>
            </section>
            <p v-if="candidate.reviewedAt" class="mt-2 text-xs font-semibold text-slate-500">
              Behandlet {{ new Date(candidate.reviewedAt).toLocaleString('da-DK') }}
              <span v-if="candidate.rejectionReason"> · {{ candidate.rejectionReason }}</span>
            </p>
          </div>
          <div class="flex shrink-0 flex-wrap gap-2">
            <a :href="candidate.sourceUrl" target="_blank" rel="noopener noreferrer" class="text-sm font-bold text-[#094b7b] underline underline-offset-2">Se kilde</a>
            <template v-if="activeStatus === 'new'">
              <button type="button" class="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-black text-white disabled:opacity-60" :disabled="Boolean(activeCandidateId)" @click="openApproval(candidate)">Godkend</button>
              <button v-if="candidate.possibleDuplicates.length" type="button" class="rounded-md border border-amber-500 px-3 py-1.5 text-sm font-black text-amber-900 hover:bg-amber-50 disabled:opacity-60" :disabled="Boolean(activeCandidateId)" @click="rejectCandidateAsDuplicate(candidate)">Afvis som dublet</button>
              <button type="button" class="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-black text-white disabled:opacity-60" :disabled="Boolean(activeCandidateId)" @click="rejectCandidate(candidate._id)">Afvis</button>
            </template>
          </div>
        </div>
        <form
          v-if="activeStatus === 'new' && approvalCandidate?._id === candidate._id && approvalForm"
          class="mt-4 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2"
          @submit.prevent="approveCandidate"
        >
          <div class="sm:col-span-2">
            <h4 class="font-black text-[#094b7b]">Godkend event</h4>
            <p class="mt-1 text-sm text-slate-600">Kildens tidspunkt: {{ candidate.dateText || 'Ikke oplyst' }}</p>
            <p v-if="candidate.possibleDuplicates.length" class="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
              Dette ligner et event fra en anden kilde. Kontrollér det, før du publicerer.
            </p>
          </div>
          <label class="grid gap-1 text-sm font-bold text-slate-700">Navn<input v-model.trim="approvalForm.name" required class="rounded-md border border-slate-300 px-3 py-2 font-normal" /></label>
          <label class="grid gap-1 text-sm font-bold text-slate-700">Pris i kr.<input v-model.number="approvalForm.price" required min="0" step="1" type="number" class="rounded-md border border-slate-300 px-3 py-2 font-normal" /></label>
          <label class="grid gap-1 text-sm font-bold text-slate-700 sm:col-span-2">Beskrivelse<textarea v-model.trim="approvalForm.description" required rows="3" class="rounded-md border border-slate-300 px-3 py-2 font-normal" /></label>
          <label class="grid gap-1 text-sm font-bold text-slate-700 sm:col-span-2">Billedlink<input v-model.trim="approvalForm.heroImage" required type="url" class="rounded-md border border-slate-300 px-3 py-2 font-normal" /></label>
          <label class="grid gap-1 text-sm font-bold text-slate-700 sm:col-span-2">Kildelink<input v-model.trim="approvalForm.link" required type="url" class="rounded-md border border-slate-300 px-3 py-2 font-normal" /></label>
          <label class="grid gap-1 text-sm font-bold text-slate-700">Starttidspunkt<input v-model="approvalForm.startDate" required type="datetime-local" class="rounded-md border border-slate-300 px-3 py-2 font-normal" /><span v-if="!approvalForm.startDate" class="text-xs font-normal text-amber-700">Starttidspunktet er ikke oplyst af kilden.</span></label>
          <label class="grid gap-1 text-sm font-bold text-slate-700">Sluttidspunkt <span class="font-normal">(valgfrit)</span><input v-model="approvalForm.endDate" type="datetime-local" class="rounded-md border border-slate-300 px-3 py-2 font-normal" /><span v-if="!approvalForm.endDate" class="text-xs font-normal text-slate-500">Kilden angiver ikke et sluttidspunkt.</span></label>
          <label class="grid gap-1 text-sm font-bold text-slate-700">Adresse<input v-model.trim="approvalForm.address" class="rounded-md border border-slate-300 px-3 py-2 font-normal" /></label>
          <label class="grid gap-1 text-sm font-bold text-slate-700">By<input v-model.trim="approvalForm.city" class="rounded-md border border-slate-300 px-3 py-2 font-normal" /></label>
          <label class="grid gap-1 text-sm font-bold text-slate-700 sm:col-span-2">GPS-koordinater <span class="font-normal">(findes automatisk ud fra stedet, når det er muligt)</span><input v-model.trim="approvalForm.gpsPosition" :placeholder="isGeocoding ? 'Finder GPS-koordinater...' : '55.4765,8.4594'" class="rounded-md border border-slate-300 px-3 py-2 font-normal" /><span v-if="isGeocoding" class="text-xs font-normal text-slate-500">Slår stedet op i OpenStreetMap...</span><span v-else-if="!approvalForm.gpsPosition" class="text-xs font-normal text-slate-500">Kun hvis stedet ikke kan findes automatisk, skal du angive GPS eller rette stedfeltet.</span></label>
          <label class="flex items-center gap-2 text-sm font-bold text-slate-700 sm:col-span-2"><input v-model="approvalForm.isAnnual" type="checkbox" />Årligt event</label>
          <div class="flex flex-wrap gap-2 sm:col-span-2">
            <button class="rounded-md bg-emerald-600 px-3 py-2 text-sm font-black text-white disabled:opacity-60" :disabled="activeCandidateId === candidate._id" type="submit">{{ activeCandidateId === candidate._id ? 'Godkender...' : 'Godkend og publicér' }}</button>
            <button class="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700" type="button" @click="closeApproval">Annuller</button>
          </div>
        </form>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useAdminCrawlerCandidates } from '@/composables/admin/useAdminCrawlerCandidates'

const {
  activeCandidateId,
  activeStatus,
  approvalCandidate,
  approvalForm,
  approveCandidate,
  candidates,
  crawlerSources,
  crawlerStatus,
  closeApproval,
  errorMessage,
  isCrawling,
  isGeocoding,
  isLoading,
  isComparingDuplicate,
  loadCandidates,
  openApproval,
  rejectCandidate,
  rejectCandidateAsDuplicate,
  runCrawler,
  selectedSourceId,
  selectedSourceLabel,
  setSelectedSource,
  setActiveStatus,
  statusError,
  successMessage,
  toggleDuplicateComparison,
} = useAdminCrawlerCandidates()

const statusTabs = [
  { status: 'new', label: 'Nye' },
  { status: 'approved', label: 'Godkendte' },
  { status: 'rejected', label: 'Afviste' },
] as const

function formatDate(value: string): string {
  return new Date(value).toLocaleString('da-DK', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function formatEventDateTime(startDate: string, endDate: string): string {
  if (!startDate) return 'Ikke oplyst'

  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : null
  if (Number.isNaN(start.getTime())) return 'Ikke oplyst'

  const date = start.toLocaleDateString('da-DK', { dateStyle: 'medium' })
  const startTime = start.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })
  const endTime = end && !Number.isNaN(end.getTime())
    ? end.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })
    : ''

  return `${date}, kl. ${startTime}${endTime ? `–${endTime}` : ''}`
}
</script>
