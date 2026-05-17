<template>
  <section class="rounded-lg border border-slate-200 bg-white p-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h6 class="text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-[#de5826]">Anmeldelser</h6>
        <h2 class="mt-2 text-xl font-black text-[#094b7b]">Rapporterede anmeldelser</h2>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <AdminSegmentedTabs v-model="activeReportTab" :tabs="reportTabs" />
        <button
          class="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold"
          @click="loadReports"
        >
          Opdater
        </button>
      </div>
    </div>

    <p
      v-if="errorMessage"
      class="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700"
    >
      {{ errorMessage }}
    </p>

    <div v-if="isLoading" class="mt-4 rounded-md bg-slate-50 p-4 font-semibold text-slate-600">
      Henter rapporter...
    </div>
    <div
      v-else-if="!reports.length"
      class="mt-4 rounded-md bg-slate-50 p-4 font-semibold text-slate-600"
    >
      {{
        activeReportTab === 'hidden'
          ? 'Der er ingen skjulte rapporterede anmeldelser.'
          : 'Der er ingen uløste anmeldelsesrapporter.'
      }}
    </div>
    <div v-else class="mt-4 grid gap-3">
      <article
        v-for="review in reports"
        :key="review._id"
        class="rounded-lg border border-slate-200 p-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-sm font-bold text-rose-700">{{ review.reportCount }} rapporter</p>
            <div class="mt-1 flex flex-wrap items-center gap-2">
              <h3 class="font-black text-slate-900">{{ review.title }}</h3>
              <span
                v-if="review.isHidden"
                class="rounded-full bg-amber-100 px-2 py-1 text-xs font-black text-amber-800"
              >
                Skjult
              </span>
            </div>
            <p class="text-sm text-slate-500">
              {{ review.author }} · {{ review.targetType }} · {{ review.rating }}/5
            </p>
          </div>
          <div class="flex gap-2">
            <button
              class="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold"
              @click="resolveReport(review._id)"
            >
              Ingen regelbrud
            </button>
            <button
              v-if="review.isHidden"
              class="rounded-md bg-emerald-600 px-3 py-2 text-sm font-black text-white"
              @click="restoreReview(review._id)"
            >
              Gendan
            </button>
            <button
              v-else
              class="rounded-md bg-rose-600 px-3 py-2 text-sm font-black text-white"
              @click="removeReview(review._id)"
            >
              Skjul
            </button>
          </div>
        </div>
        <p class="mt-3 text-sm text-slate-700">{{ review.description }}</p>
        <ul class="mt-3 grid gap-2">
          <li
            v-for="report in review.reports"
            :key="`${report.reportedBy}-${report.createdAt}`"
            class="rounded-md bg-slate-50 p-3 text-sm"
          >
            <span class="font-bold text-slate-800">{{
              report.reason || 'Ingen begrundelse angivet'
            }}</span>
            <span class="text-slate-500">
              · {{ new Date(report.createdAt).toLocaleString('da-DK') }}
            </span>
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import AdminSegmentedTabs from '@/components/admin/AdminSegmentedTabs.vue'
import { useAdminReviewReports } from '@/composables/admin/useAdminReviewReports'

const {
  activeReportTab,
  errorMessage,
  isLoading,
  loadReports,
  removeReview,
  reportTabs,
  reports,
  resolveReport,
  restoreReview,
} = useAdminReviewReports()
</script>
