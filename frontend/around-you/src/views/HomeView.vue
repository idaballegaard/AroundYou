<template>
  <!-- Map background wrapper -->
  <div
    class="min-h-screen relative bg-cover bg-center bg-no-repeat py-3 sm:py-[50px]"
    style="background-image: url('/danmarkskort_1800x1280.jpg')"
  >
    <div class="pointer-events-none absolute inset-0 bg-[#e8c7aa]/55"></div>

    <!-- White content card -->
    <div class="relative z-10 mx-3 overflow-hidden rounded-lg bg-white shadow-2xl sm:mx-[50px] sm:rounded-xl">
      <HomeContentSection
        v-if="showNearbySection"
        :title="`Oplevelser nær ${userLocation}`"
        :description="userLocationDescription"
        :loading="nearbyLoading"
        :error="nearbyError"
        :cards="nearbyCards"
        loading-text="Henter seværdigheder nær din lokation..."
        empty-text="Der blev ikke fundet seværdigheder i nærheden."
        title-class="text-xl leading-tight sm:text-5xl font-extrabold text-[#094b7b] text-center mb-2"
        description-class="text-sm leading-6 sm:text-xl text-gray-500 text-center max-w-3xl mx-auto mb-6 sm:mb-8"
      />

      <HomeContentSection
        title="Udforsk Danmarks største byer"
        description="Gå på opdagelse i København, Aarhus, Odense og Aalborg, hvor hver by byder på sin egen unikke stemning. Oplev alt fra pulserende byliv og spændende kultur til hyggelige kvarterer, historiske seværdigheder og nye smagsoplevelser."
        :loading="citiesLoading"
        :error="citiesError"
        :cards="cityCards"
        loading-text="Henter Danmarks største byer..."
        empty-text="Vi kunne ikke finde information om Danmarks største byer."
      />

      <HomeContentSection
        title="Oplev naturens perler"
        description="Gå på opdagelse i Danmarks smukkeste landskaber, hvor naturen byder på ro, vidde og unikke oplevelser. Oplev alt fra imponerende udsigtspunkter og kyststrækninger til skove, søer og skjulte perler rundt i landet."
        :loading="natureLoading"
        :error="natureError"
        :cards="natureCards"
        loading-text="Henter naturoplevelser..."
        empty-text="Vi kunne ikke finde nogle naturoplevelser."
      />

      <HomeContentSection
        title="Eventyr for hele familien"
        description="Gå på opdagelse i sjove og mindeværdige oplevelser for både børn og voksne i hele Danmark. Oplev alt fra legende aktiviteter og spændende attraktioner til lærerige oplevelser og hyggelige stunder, hvor hele familien kan være med."
        :loading="familyLoading"
        :error="familyError"
        :cards="familyCards"
        loading-text="Henter familieoplevelser..."
        empty-text="Vi kunne ikke finde nogle familieoplevelser."
      />

    </div>
  </div>
</template>

<script setup lang="ts">
import HomeContentSection from '@/components/HomeContentSection.vue'
import { useHomeViewData } from '@/composables/home/useHomeViewData'

const {
  showNearbySection,
  userLocation,
  userLocationDescription,
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
</script>
