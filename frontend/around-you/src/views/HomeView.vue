<template>
  <!-- Map background wrapper -->
  <div
    class="min-h-screen relative bg-cover bg-center bg-no-repeat py-3 sm:py-[50px]"
    style="background-image: url('/danmarkskort_1800x1280.jpg')"
  >
    <div class="pointer-events-none absolute inset-0 bg-[#e8c7aa]/55"></div>

    <!-- White content card -->
    <div class="relative z-10 mx-3 overflow-hidden rounded-2xl bg-white shadow-2xl sm:mx-[50px]">
      <section class="px-5 pb-6 pt-9 text-center sm:px-12 sm:pb-8 sm:pt-12">
        <h1 class="text-3xl font-extrabold leading-tight text-[#094b7b] sm:text-5xl">
          Hvad sker der omkring dig?
        </h1>
        <p class="mt-2 text-sm leading-6 text-gray-500 sm:text-lg">
          Find oplevelser, aktiviteter og events – lige nu eller snart.
        </p>
        <div class="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-[#094b7b] sm:text-lg">
          <span class="text-xl leading-none" aria-hidden="true">●</span>
          <span>{{ userLocation }}</span>
          <span class="mx-1 text-gray-300" aria-hidden="true">|</span>
          <span class="cursor-default text-sm underline underline-offset-2 sm:text-base">Skift lokation</span>
        </div>
      </section>

      <div class="space-y-3 px-3 pb-6 sm:space-y-4 sm:px-8 sm:pb-10">
      <HomeContentSection
        title="Sker lige nu"
        description="Aktiviteter og oplevelser tæt på dig lige nu."
        :loading="nearbyLoading"
        :error="nearbyError"
        :cards="nowCards"
        loading-text="Henter seværdigheder nær din lokation..."
        empty-text="Der blev ikke fundet seværdigheder i nærheden."
        layout="timeline"
        icon="✳"
        icon-class="bg-[#de3d3d]"
        title-class="text-lg font-extrabold leading-tight text-[#094b7b] sm:text-xl"
        description-class="mt-0.5 text-xs leading-5 text-gray-500 sm:text-sm"
        show-all-to="/search"
      />

      <HomeContentSection
        title="Starter snart"
        description="Oplevelser, der er på vej til at begynde."
        :loading="citiesLoading"
        :error="citiesError"
        :cards="cityCards"
        loading-text="Henter oplevelser, der starter snart..."
        empty-text="Vi kunne ikke finde oplevelser, der starter snart."
        layout="timeline"
        icon="◷"
        icon-class="bg-[#f28c13]"
        title-class="text-lg font-extrabold leading-tight text-[#094b7b] sm:text-xl"
        description-class="mt-0.5 text-xs leading-5 text-gray-500 sm:text-sm"
        show-all-to="/search"
      />

      <HomeContentSection
        title="Senere i dag"
        description="Flere gode muligheder resten af dagen."
        :loading="natureLoading"
        :error="natureError"
        :cards="natureCards"
        loading-text="Henter oplevelser senere i dag..."
        empty-text="Vi kunne ikke finde oplevelser senere i dag."
        layout="timeline"
        icon="☀"
        icon-class="bg-[#f5ae16]"
        title-class="text-lg font-extrabold leading-tight text-[#094b7b] sm:text-xl"
        description-class="mt-0.5 text-xs leading-5 text-gray-500 sm:text-sm"
        show-all-to="/search"
      />

      <HomeContentSection
        title="Lokale favoritter"
        description="Oplevelser anbefalet af andre brugere i dit område."
        :loading="familyLoading"
        :error="familyError"
        :cards="familyCards"
        loading-text="Henter lokale favoritter..."
        empty-text="Vi kunne ikke finde lokale favoritter."
        layout="timeline"
        icon="★"
        icon-class="bg-[#094b7b]"
        title-class="text-lg font-extrabold leading-tight text-[#094b7b] sm:text-xl"
        description-class="mt-0.5 text-xs leading-5 text-gray-500 sm:text-sm"
        show-all-to="/search"
      />
      </div>

      <div class="pb-8 text-center sm:pb-10">
        <RouterLink
          :to="{ name: 'mapview' }"
          class="inline-flex items-center gap-3 rounded-full bg-[#094b7b] px-6 py-3 text-sm font-bold text-white shadow-[0_12px_25px_rgba(9,75,123,0.22)] transition hover:bg-[#0b5d98] sm:text-base"
        >
          <span aria-hidden="true">⌘</span>
          Se alt omkring mig på kort
        </RouterLink>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import HomeContentSection from '@/components/HomeContentSection.vue'
import { useHomeViewData } from '@/composables/home/useHomeViewData'

const {
  userLocation,
  nearbyCards,
  nearbyLoading,
  nearbyError,
  cityCards,
  citiesLoading,
  citiesError,
  natureCards,
  natureLoading,
  natureError,
  familyCards,
  familyLoading,
  familyError,
} = useHomeViewData()

// Indtil tidsfiltreret indhold hentes fra databasen, vises de eksisterende kort her.
// Bykortene er fallback, når brugerens lokation ikke er tilgængelig.
const nowCards = computed(() => (nearbyCards.value.length ? nearbyCards.value : cityCards.value))
</script>
