import { toDateOnly } from '@/utils/date'
import { distanceKm, parseGpsPosition } from '@/utils/geo'
import type { ApiAttraction, ApiEvent, City, Coordinates, SearchResult } from '@/types/search'

function getNearestCityName(gpsPosition: string | undefined, cities: City[]): string {
  // Events and attractions only store coordinates. Use the city dataset to show
  // a human-readable location in search cards.
  const coords = parseGpsPosition(gpsPosition)

  if (!coords || !cities.length) {
    return 'Ukendt'
  }

  let nearest = cities[0]
  let nearestDistance = Number.POSITIVE_INFINITY

  for (const city of cities) {
    const cityCoords = parseGpsPosition(city.gpsPosition)

    if (!cityCoords) {
      continue
    }

    const km = distanceKm(coords, cityCoords)

    if (km < nearestDistance) {
      nearestDistance = km
      nearest = city
    }
  }

  return nearest?.name || 'Ukendt'
}

function toSearchCoordinates(gpsPosition: string | undefined): Coordinates | null {
  const coordinates = parseGpsPosition(gpsPosition)

  if (!coordinates) {
    return null
  }

  // Map/search state still uses lat/lng while the shared geocoding utilities use latitude/longitude.
  return {
    lat: coordinates.latitude,
    lng: coordinates.longitude,
  }
}

export function mapEventToSearchResult(event: ApiEvent, cities: City[]): SearchResult {
  return {
    id: event._id,
    title: event.name,
    description: event.description ?? '',
    location: getNearestCityName(event.gpsPosition, cities),
    coordinates: toSearchCoordinates(event.gpsPosition),
    type: 'event',
    date: toDateOnly(event.startDate),
    rating: event.rating ?? 0,
    reviews: 0,
    image: event.heroImage,
    categories: event.slugArray ?? [],
  }
}

export function mapAttractionToSearchResult(
  attraction: ApiAttraction,
  cities: City[],
): SearchResult {
  return {
    id: attraction._id,
    title: attraction.name,
    description: attraction.description ?? '',
    location: getNearestCityName(attraction.gpsPosition, cities),
    coordinates: toSearchCoordinates(attraction.gpsPosition),
    type: 'attraction',
    date: toDateOnly(attraction.updateAt),
    rating: attraction.rating ?? 0,
    reviews: 0,
    image: attraction.heroImage,
    categories: attraction.slugArray ?? [],
  }
}

export function mapCityToSearchResult(city: City): SearchResult {
  return {
    id: city._id,
    title: city.name || 'Ukendt',
    description: city.description || '',
    location: city.name || 'Ukendt',
    coordinates: toSearchCoordinates(city.gpsPosition),
    type: 'city',
    date: '',
    rating: city.rating ?? 0,
    reviews: 0,
    image: city.heroImage || '',
    categories: [],
  }
}

export function getCityCoordinates(cities: City[]): Record<string, Coordinates> {
  // Key by lower-case city name for quick lookups when a user selects a city in
  // the search location field.
  return cities.reduce<Record<string, Coordinates>>((accumulator, city) => {
    if (!city.name) {
      return accumulator
    }

    const coordinates = toSearchCoordinates(city.gpsPosition)
    if (!coordinates) {
      return accumulator
    }

    accumulator[city.name.toLowerCase()] = coordinates
    return accumulator
  }, {})
}

export function distanceBetweenSearchCoordinates(from: Coordinates, to: Coordinates): number {
  return distanceKm(
    { latitude: from.lat, longitude: from.lng },
    { latitude: to.lat, longitude: to.lng },
  )
}

export const byNewestDate = (first: SearchResult, second: SearchResult) => {
  // Dates are normalized to yyyy-mm-dd, so lexical sorting matches chronology.
  return second.date.localeCompare(first.date)
}
