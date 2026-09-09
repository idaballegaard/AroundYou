import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { useSearchResults } from '@/composables/search/useSearchResults'
import type { SearchFilters } from '@/types/search'
import {
  clampPage,
  getInitialSearchTypes,
  getPageNumbers,
  getSearchResultCardClass,
  getSearchResultDescription,
  getSelectedCityCenter,
  getTotalPages,
  getVisibleSearchItems,
  paginateSearchItems,
  toSearchMapMarkers,
  toSearchResultCard,
  type SelectedSearchMapMarker,
} from './searchView.helpers'

export const useSearchView = () => {
  // Coordinates search result filtering, pagination, and map selection for the
  // SearchView without putting routing/map details in the component.
  const route = useRoute()
  const filters = ref<SearchFilters>({
    location: '',
    types: getInitialSearchTypes(route.query.type),
    date: '',
    categories: [],
  })

  const {
    filteredResults,
    cityCoordinates,
    locationOptions,
    categoryOptions,
    changeLocation,
    isUsingLocationResults,
    isShowingLargestCities,
    isLoading,
    errorMessage,
    userLocationName,
  } = useSearchResults(filters)

  const currentPage = ref(1)
  const selectedResultId = ref<string | null>(null)
  const citySelectedFromMap = ref('')
  const resultsGrid = ref<HTMLElement | null>(null)

  const resultItems = computed(() =>
    getVisibleSearchItems(filteredResults.value, citySelectedFromMap.value),
  )

  const totalPages = computed(() => getTotalPages(resultItems.value.length))
  const pageNumbers = computed(() => getPageNumbers(totalPages.value))
  const paginatedResults = computed(() => paginateSearchItems(resultItems.value, currentPage.value))
  const resultDescription = computed(() =>
    getSearchResultDescription(
      filters.value,
      isUsingLocationResults.value,
      isShowingLargestCities.value,
    ),
  )
  const selectedCityCenter = computed(() =>
    getSelectedCityCenter(filters.value.location, cityCoordinates.value),
  )
  const visibleResults = computed(() => resultItems.value)
  const mapMarkers = computed(() => toSearchMapMarkers(visibleResults.value))

  const goToPage = (page: number) => {
    currentPage.value = clampPage(page, totalPages.value)
  }

  const resultCardClass = (id: string) => {
    return getSearchResultCardClass(id, selectedResultId.value)
  }

  const scrollToResult = async (id: string) => {
    // Map selection happens before Vue has necessarily rendered the filtered
    // card, so wait for the DOM and then scroll with the sticky header offset.
    await nextTick()

    requestAnimationFrame(() => {
      const selectedCard = resultsGrid.value?.querySelector<HTMLElement>(
        `[data-result-id="${CSS.escape(id)}"]`,
      )

      if (!selectedCard || !document.body.contains(selectedCard)) {
        return
      }

      const stickyHeaderOffset = 120
      const targetTop =
        selectedCard.getBoundingClientRect().top + window.scrollY - stickyHeaderOffset

      window.scrollTo({
        top: Math.max(targetTop, 0),
        behavior: 'smooth',
      })
    })
  }

  const handleMapMarkerSelected = (marker: SelectedSearchMapMarker) => {
    // Only city markers drive the location filter. Attraction/event markers are
    // still shown on the map but do not collapse the result set.
    if (marker.type !== 'city') {
      return
    }

    citySelectedFromMap.value = marker.title
    filters.value.location = marker.title
    selectedResultId.value = null
  }

  watch(
    filters,
    () => {
      currentPage.value = 1

      if (filters.value.location !== citySelectedFromMap.value) {
        citySelectedFromMap.value = ''
      }
    },
    { deep: true },
  )

  watch(totalPages, (pages) => {
    if (pages > 0 && currentPage.value > pages) {
      currentPage.value = pages
    }
  })

  watch(selectedResultId, async (id) => {
    if (!id) {
      return
    }

    await scrollToResult(id)
  })

  return {
    categoryOptions,
    changeLocation,
    currentPage,
    errorMessage,
    filters,
    goToPage,
    handleMapMarkerSelected,
    isLoading,
    locationOptions,
    mapMarkers,
    pageNumbers,
    paginatedResults,
    visibleResults,
    resultCardClass,
    resultDescription,
    resultsGrid,
    selectedCityCenter,
    selectedResultId,
    toSearchResultCard,
    totalPages,
    userLocationName,
  }
}
