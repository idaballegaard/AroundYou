<template>
  <main
    class="min-h-screen relative bg-cover bg-center bg-no-repeat py-4 sm:py-[50px]"
    style="background-image: url('/danmarkskort_1800x1280.jpg')"
  >
    <div class="pointer-events-none absolute inset-0 bg-[#e8c7aa]/55"></div>

    <div class="relative z-10 mx-4 sm:mx-[50px] bg-white shadow-2xl rounded-xl overflow-hidden">
      <section class="bg-white px-8 py-8">
        <h1 class="text-5xl font-black tracking-tight text-[#094b7b]">Hvad sker der omkring dig?</h1>
        <p class="mt-2 text-xl text-[#094b7b]">Find noget at lave lige nu, snart eller senere i dag.</p>
        <div class="mt-5 flex items-center gap-2 text-sm font-semibold text-[#094b7b] sm:text-lg">
          <span class="text-xl leading-none" aria-hidden="true">●</span>
          <span>{{ userLocationName }}</span>
          <span class="mx-1 text-gray-300" aria-hidden="true">|</span>
          <button
            type="button"
            class="text-sm underline underline-offset-2 transition hover:text-[#de5826] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#094b7b] sm:text-base"
            @click="changeLocation"
          >
            Skift lokation
          </button>
        </div>
      </section>

      <section class="px-4 pt-4 pb-8 sm:px-8 sm:pt-6 sm:pb-10">
        <div class="flex flex-col gap-8">

          <SearchFilter
            v-model="filters"
            :location-options="locationOptions"
            :category-options="categoryOptions"
          />

          <div class="grid gap-6 lg:grid-cols-[calc(50vw-90px)_minmax(400px,1fr)] lg:items-start lg:justify-between">
            <div class="lg:max-h-[656px] lg:max-w-[calc(50vw-90px)] lg:overflow-y-auto lg:pr-2">
              <div
                v-if="isLoading"
                class="rounded-2xl bg-white p-6 text-sm font-semibold text-slate-500"
              >
                Loader resultater...
              </div>

              <div
                v-else-if="errorMessage"
                class="rounded-2xl bg-rose-50 p-6 text-sm font-semibold text-rose-700"
              >
                {{ errorMessage }}
              </div>

              <div v-else class="space-y-5">
                <div ref="resultsGrid" class="grid gap-4 grid-cols-2 xl:grid-cols-2">
                  <template v-for="item in visibleResults" :key="item.id">
                    <div :data-result-id="item.id" :class="resultCardClass(item.id)">
                      <SearchResultCard :result="item" />
                    </div>
                  </template>
                </div>
              </div>
            </div>

            <aside class="hidden lg:block">
              <div class="sticky top-24 rounded-2xl bg-white p-3 shadow-sm">
                <LocationMap
                  :show-location-button="false"
                  :show-user-marker="false"
                  :center="selectedCityCenter"
                  :center-zoom="selectedCityCenter ? 13 : 11"
                  v-model:selected-marker-id="selectedResultId"
                  :markers="mapMarkers"
                  map-class="h-[620px] w-full rounded-xl"
                  @marker-selected="handleMapMarkerSelected"
                />
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
<script setup lang="ts">
import LocationMap from '@/components/map/LocationMap.vue'
import SearchFilter from '@/components/SearchFilter.vue'
import SearchResultCard from '@/components/SearchResultCard.vue'
import { useSearchView } from '@/composables/search/useSearchView'

const {
  categoryOptions,
  changeLocation,
  errorMessage,
  filters,
  handleMapMarkerSelected,
  isLoading,
  locationOptions,
  mapMarkers,
  resultCardClass,
  resultsGrid,
  selectedCityCenter,
  selectedResultId,
  userLocationName,
  visibleResults,
} = useSearchView()
</script>
