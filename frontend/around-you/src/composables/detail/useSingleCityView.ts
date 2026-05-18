import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { getCityByName } from '@/api/attractions.api'
import { useAsyncData } from '@/composables/useAsyncData'
import type { CityApiItem } from '@/types/city-api-item'
import {
  DEFAULT_ATTRACTION_HERO_IMAGE,
  formatPopulation,
  type DetailFact,
} from './detailView.helpers'

/**
 * Collects and manages all state used by the single city detail view.
 */
export function useSingleCityView() {
  const route = useRoute()
  const reviewRating = ref<number | null>(null)

  // Resolves the city name from the current route params.
  const cityParam = computed(() => {
    const routeCity = route.params.cityName
    return typeof routeCity === 'string' ? routeCity.trim() : ''
  })

  // Loads the selected city from the API.
  const citySection = useAsyncData<CityApiItem | null>(() => getCityByName(cityParam.value), {
    defaultValue: null,
    getErrorMessage: () => 'Vi kunne ikke hente byen fra databasen.',
  })

  // Refetches city data when the route city name changes.
  watch(
    cityParam,
    () => {
      void citySection.execute().catch((error) => {
        console.error('Fejl ved hentning af bydata:', error)
      })
    },
    { immediate: true },
  )

  // Maps async state into detail-view friendly values.
  const city = computed(() => citySection.data.value)
  const cityLoading = computed(() => citySection.loading.value)
  const cityError = computed(() => citySection.error.value)
  const displayCityName = computed(() => city.value?.name ?? '')
  const heroImage = computed(() => city.value?.heroImage ?? DEFAULT_ATTRACTION_HERO_IMAGE)

  // Builds the fact list shown in the city detail sidebar.
  const cityFacts = computed<DetailFact[]>(() => {
    if (!city.value) return []

    return [
      { label: 'Kommune', value: city.value.commune },
      { label: 'Region', value: city.value.region },
      { label: 'Land', value: city.value.country },
      { label: 'Befolkning', value: formatPopulation(city.value.population) },
      { label: 'Visitor Center', value: city.value.visitorCenter },
    ]
  })

  // Stores the latest average review rating emitted by the review section.
  const handleAverageRating = (rating: number | null) => {
    reviewRating.value = rating
  }

  return {
    city,
    cityError,
    cityFacts,
    cityLoading,
    displayCityName,
    handleAverageRating,
    heroImage,
    reviewRating,
  }
}
