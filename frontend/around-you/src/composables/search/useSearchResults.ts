import { computed, onMounted, ref, watch, type Ref } from 'vue'

import { fetchAttractions, fetchCities, fetchEvents } from '@/api/searchApi'
import {
  byNewestDate,
  distanceBetweenSearchCoordinates,
  getCityCoordinates,
  mapAttractionToSearchResult,
  mapCityToSearchResult,
  mapEventToSearchResult,
} from '@/api/helpers/searchMappers'
import { useGeolocationStore } from '@/stores/geolocation'
import type { Coordinates, SearchFilters, SearchResult } from '@/types/search'

export const useSearchResults = (filters: Ref<SearchFilters>) => {
  const geolocationStore = useGeolocationStore()
  const results = ref<SearchResult[]>([])
  const largestCityResults = ref<SearchResult[]>([])
  const cityCoordinates = ref<Record<string, Coordinates>>({})
  const isLoading = ref(true)
  const errorMessage = ref('')

  const fetchResults = async () => {
    try {
      isLoading.value = true
      errorMessage.value = ''

      const [events, attractions, cities] = await Promise.all([
        fetchEvents(),
        fetchAttractions(),
        fetchCities(),
      ])

      cityCoordinates.value = getCityCoordinates(cities)

      const sortedCities = [...cities].sort(
        (first, second) => (second.population ?? 0) - (first.population ?? 0),
      )

      largestCityResults.value = sortedCities.slice(0, 6).map((city) => mapCityToSearchResult(city))

      results.value = [
        ...sortedCities.map((city) => mapCityToSearchResult(city)),
        ...events.map((event) => mapEventToSearchResult(event, cities)),
        ...attractions
          .map((attraction) => mapAttractionToSearchResult(attraction, cities))
          .sort(byNewestDate),
      ]
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error.'
      errorMessage.value = message
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    fetchResults()

    if (!geolocationStore.coords && !geolocationStore.loading && !geolocationStore.error) {
      geolocationStore.getLocation()
    }
  })

  const hasActiveFilters = computed(() => {
    return (
      filters.value.location.trim().length > 0 ||
      filters.value.types.length > 0 ||
      filters.value.date.length > 0 ||
      filters.value.categories.length > 0
    )
  })

  const userCoordinates = computed<Coordinates | null>(() => {
    if (!geolocationStore.coords) {
      return null
    }

    return {
      lat: geolocationStore.coords.latitude,
      lng: geolocationStore.coords.longitude,
    }
  })

  const locationSortedExperienceResults = computed(() => {
    const coords = userCoordinates.value

    if (!coords) {
      return []
    }

    return results.value
      .filter((item) => item.type !== 'city' && item.coordinates)
      .map((item) => ({
        item,
        distance: distanceBetweenSearchCoordinates(coords, item.coordinates!),
      }))
      .sort((first, second) => first.distance - second.distance)
      .map(({ item }) => item)
  })

  const nearestExperienceResults = computed(() => locationSortedExperienceResults.value.slice(0, 6))

  const visibleResults = computed(() => {
    if (userCoordinates.value) {
      if (filters.value.location.trim().length === 0 && hasActiveFilters.value) {
        return locationSortedExperienceResults.value
      }

      if (hasActiveFilters.value) {
        return results.value
      }

      return nearestExperienceResults.value
    }

    if (hasActiveFilters.value) {
      return results.value
    }

    return largestCityResults.value
  })

  const isUsingLocationResults = computed(
    () => !hasActiveFilters.value && Boolean(userCoordinates.value),
  )
  const isShowingLargestCities = computed(() => !hasActiveFilters.value && !userCoordinates.value)

  watch(
    () => geolocationStore.error,
    (error) => {
      if (error) {
        console.info('Search page falls back to largest cities because location was unavailable.')
      }
    },
  )

  const filteredResults = computed(() => {
    const query = filters.value.location.trim().toLowerCase()
    const hasQuery = query.length > 0

    return visibleResults.value.filter((item) => {
      const matchesLocation = hasQuery ? item.location.toLowerCase().includes(query) : true
      const matchesType =
        filters.value.types.length === 0 ||
        filters.value.types.includes(item.type as SearchFilters['types'][number])
      const matchesDate = filters.value.date ? item.date === filters.value.date : true
      const matchesCategories = filters.value.categories.length
        ? filters.value.categories.some((category) => item.categories.includes(category))
        : true

      return matchesLocation && matchesType && matchesDate && matchesCategories
    })
  })

  const locationOptions = computed(() => {
    const unique = new Set(
      results.value
        .map((item) => item.location)
        .filter((location) => location && location !== 'Ukendt'),
    )
    return Array.from(unique).sort()
  })

  const categoryOptions = computed(() => {
    const unique = new Set(results.value.flatMap((item) => item.categories))
    return Array.from(unique).sort()
  })

  return {
    results,
    filteredResults,
    cityCoordinates,
    locationOptions,
    categoryOptions,
    isUsingLocationResults,
    isShowingLargestCities,
    isLoading,
    errorMessage,
    fetchResults,
  }
}
