import { resolveApiAssetUrl } from '@/constants/config'
import type { CardComponentItem } from '@/components/cardComponent.helpers'
import type { Coordinates as MapCoordinates } from '@/types/coordinates'
import type { Coordinates, SearchFilters, SearchResult } from '@/types/search'

export type SearchMapMarker = {
  id: string
  title: string
  type: SearchResult['type']
  latitude: number
  longitude: number
}

export type SelectedSearchMapMarker = Pick<SearchMapMarker, 'id' | 'title' | 'type'>

export const RESULTS_PER_PAGE = 8

export const getInitialSearchTypes = (routeType: unknown): SearchFilters['types'] => {
  // The home page can deep-link into search with ?type=event/attraction; ignore
  // unknown query values instead of letting them leak into filters.
  const type = Array.isArray(routeType) ? routeType[0] : routeType

  if (type === 'event') return ['event']
  if (type === 'attraction') return ['activity']

  return []
}

export const hasActiveSearchFilters = (filters: SearchFilters) => {
  return Boolean(
    filters.location.trim() ||
      filters.types.length ||
      filters.date ||
      filters.time ||
      filters.customTime ||
      filters.categories.length,
  )
}

export const getSearchResultDescription = (
  filters: SearchFilters,
  isUsingLocationResults: boolean,
  isShowingLargestCities: boolean,
) => {
  if (hasActiveSearchFilters(filters)) {
    return 'Søg blandt byer, events og attraktioner i hele Danmark.'
  }

  if (isUsingLocationResults) {
    return 'Vi viser de nærmeste events og attraktioner ud fra din lokation.'
  }

  if (isShowingLargestCities) {
    return 'Del din lokation for at se oplevelser tæt på dig, eller udforsk Danmarks seks største byer her.'
  }

  return 'Der er over 1.000 ting at se og opleve omkring dig.'
}

export const getVisibleSearchItems = (results: SearchResult[], citySelectedFromMap: string) => {
  // Selecting a city marker uses that city as a location filter, so remove the
  // city card itself and show the matching experiences.
  if (!citySelectedFromMap) {
    return results
  }

  return results.filter((item) => item.type !== 'city')
}

export const getTotalPages = (itemsCount: number, perPage = RESULTS_PER_PAGE) => {
  return Math.ceil(itemsCount / perPage)
}

export const getPageNumbers = (totalPages: number) => {
  return Array.from({ length: totalPages }, (_, index) => index + 1)
}

export const clampPage = (page: number, totalPages: number) => {
  return Math.min(Math.max(page, 1), totalPages)
}

export const paginateSearchItems = (
  items: SearchResult[],
  currentPage: number,
  perPage = RESULTS_PER_PAGE,
) => {
  const start = (currentPage - 1) * perPage

  return items.slice(start, start + perPage)
}

export const getSearchResultCardClass = (id: string, selectedResultId: string | null) => {
  const baseClass = 'rounded-xl [&>*]:h-full'

  return selectedResultId === id
    ? `${baseClass} shadow-[0_0_0_2px_rgba(222,88,38,0.16),0_14px_28px_rgba(222,88,38,0.14)]`
    : `${baseClass} ring-0`
}

export const toSearchResultCard = (item: SearchResult): CardComponentItem => {
  // SearchResult is map/filter oriented; CardComponentItem is presentation
  // oriented. Keep that conversion centralized here.
  return {
    id: item.id,
    name: item.title,
    description: item.description,
    image: resolveApiAssetUrl(item.image),
    rating: item.rating,
    reviews: item.reviews,
    tags: [item.type, item.location, ...item.categories].filter(Boolean),
    metaText: item.date || item.location,
    href:
      item.type === 'city'
        ? `/city/${item.id}`
        : item.type === 'event'
          ? `/event/${item.id}`
          : `/attraction/${item.id}`,
  }
}

export const getSelectedCityCenter = (
  location: string,
  cityCoordinates: Record<string, Coordinates>,
): MapCoordinates | null => {
  // Location text is user-editable, so only recenter the map when it exactly
  // matches a known city option.
  const selectedLocation = location.trim().toLowerCase()

  if (!selectedLocation) {
    return null
  }

  const city = cityCoordinates[selectedLocation]

  if (!city) {
    return null
  }

  return {
    latitude: city.lat,
    longitude: city.lng,
  }
}

export const toSearchMapMarker = (item: SearchResult): SearchMapMarker | null => {
  if (!item.coordinates) {
    return null
  }

  return {
    id: item.id,
    title: item.title,
    type: item.type,
    latitude: item.coordinates.lat,
    longitude: item.coordinates.lng,
  }
}

export const toSearchMapMarkers = (items: SearchResult[]) => {
  return items
    .map((item) => toSearchMapMarker(item))
    .filter((marker): marker is SearchMapMarker => Boolean(marker))
}
