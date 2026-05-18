import type { AttractionApiItem } from '@/types/attraction-api-item'
import type { CityApiItem } from '@/types/city-api-item'
import type { Coordinates } from '@/types/coordinates'
import type { EventApiItem } from '@/types/event-api-item'
import type { FamilyExperienceCard } from '@/types/family-experience-card'
import type { LargestCityCard } from '@/types/largest-city-card'
import type { NatureExperienceCard } from '@/types/nature-experience-card'
import type { NatureExperienceSource } from '@/types/nature-experience-source'
import type { NearbyLocationContent } from '@/types/nearby-location-content'
import { apiGetCached } from '@/api/http'
import { getReviewsByTarget } from '@/api/reviews.api'
import { resolveApiAssetUrl } from '@/constants/config'
import { distanceKm, parseGpsPosition } from '@/utils/geo'

export const DEFAULT_NEARBY_LOCATION_DESCRIPTION =
  'Gå på opdagelse i spændende oplevelser tæt på din egen lokation, hvor natur, kultur, attraktioner og restauranter er lige inden for rækkevidde. Oplev alt fra populære seværdigheder og hyggelige udflugtsmål til lokale favoritter og skjulte perler lige i nærheden.'

async function fetchJson<T>(path: string): Promise<T> {
  return apiGetCached<T>(path)
}

type ExperienceReviewSummary = {
  rating: number
  reviews: number
}

const experienceReviewSummaryCache = new Map<string, ExperienceReviewSummary>()
const pendingExperienceReviewSummaryCache = new Map<string, Promise<ExperienceReviewSummary>>()

/**
 * Loads live review counts for cards whose base content records do not carry
 * enough review metadata. The in-flight cache prevents home sections from
 * issuing duplicate review requests for the same attraction or event.
 */
async function getExperienceReviewSummary(
  targetId: string,
  fallbackRating: number,
): Promise<ExperienceReviewSummary> {
  const cachedSummary = experienceReviewSummaryCache.get(targetId)

  if (cachedSummary) {
    return cachedSummary
  }

  const pendingSummary = pendingExperienceReviewSummaryCache.get(targetId)

  if (pendingSummary) {
    return pendingSummary
  }

  const summaryPromise = getReviewsByTarget(targetId)
    .then((reviews) => {
      const summary: ExperienceReviewSummary = {
        rating: reviews.length
          ? reviews.reduce((accumulator, review) => accumulator + review.rating, 0) / reviews.length
          : fallbackRating,
        reviews: reviews.length,
      }

      experienceReviewSummaryCache.set(targetId, summary)

      return summary
    })
    .catch(() => {
      const fallbackSummary: ExperienceReviewSummary = {
        rating: fallbackRating,
        reviews: 0,
      }

      experienceReviewSummaryCache.set(targetId, fallbackSummary)

      return fallbackSummary
    })
    .finally(() => {
      pendingExperienceReviewSummaryCache.delete(targetId)
    })

  pendingExperienceReviewSummaryCache.set(targetId, summaryPromise)

  return summaryPromise
}

function isMongoObjectId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value)
}

/**
 * Resolves either a current ObjectId route or an older slug/name route.
 */
export async function getEventByIdentifier(eventIdentifier: string): Promise<EventApiItem | null> {
  if (!eventIdentifier.trim()) {
    return null
  }

  if (isMongoObjectId(eventIdentifier)) {
    try {
      return await fetchJson<EventApiItem>(`/events/${encodeURIComponent(eventIdentifier)}`)
    } catch {
      // Fall back to collection lookup for old routes or deleted records.
    }
  }

  const events = await fetchJson<EventApiItem[]>('/events')
  const normalizedIdentifier = normalizeEntitySlug(decodeURIComponent(eventIdentifier))

  return (
    events.find(
      (event) =>
        event._id === eventIdentifier || normalizeEntitySlug(event.name) === normalizedIdentifier,
    ) ?? null
  )
}

export async function getAttractionByIdentifier(
  attractionIdentifier: string,
): Promise<AttractionApiItem | null> {
  // Detail routes migrated from names/slugs to ids; support both so existing
  // shared links and browser history keep working.
  if (!attractionIdentifier.trim()) {
    return null
  }

  if (isMongoObjectId(attractionIdentifier)) {
    try {
      return await fetchJson<AttractionApiItem>(
        `/attractions/${encodeURIComponent(attractionIdentifier)}`,
      )
    } catch {
      // Fall back to collection lookup for old routes or deleted records.
    }
  }

  const attractions = await fetchJson<AttractionApiItem[]>('/attractions')
  const normalizedIdentifier = normalizeEntitySlug(decodeURIComponent(attractionIdentifier))

  return (
    attractions.find(
      (attraction) =>
        attraction._id === attractionIdentifier ||
        normalizeEntitySlug(attraction.name) === normalizedIdentifier,
    ) ?? null
  )
}

export async function getCityByName(cityName: string): Promise<CityApiItem | null> {
  // The route parameter can be a city id or a display name depending on where
  // the user navigated from.
  if (!cityName.trim()) {
    return null
  }

  if (isMongoObjectId(cityName)) {
    try {
      return await fetchJson<CityApiItem>(`/city/${encodeURIComponent(cityName)}`)
    } catch {
      // Fall back to name lookup for old routes or deleted records.
    }
  }

  try {
    return await fetchJson<CityApiItem>(`/city/name/${encodeURIComponent(cityName)}`)
  } catch {
    // Fall back to collection lookup to preserve existing slug matching behavior.
  }

  const cities = await fetchJson<CityApiItem[]>('/city')
  const normalizedInput = normalizeEntitySlug(decodeURIComponent(cityName))

  return (
    cities.find(
      (city) => city._id === cityName || normalizeEntitySlug(city.name) === normalizedInput,
    ) ?? null
  )
}

function normalizeEntitySlug(value: string): string {
  // Fold Danish characters and punctuation into stable route-like comparison
  // keys without changing the source names shown in the UI.
  return value
    .trim()
    .toLowerCase()
    .replace(/æ/g, 'a')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function getNearbyLocationContent(
  coords: Coordinates,
  limit = 4,
): Promise<NearbyLocationContent> {
  // Nearby content is computed client-side from cached public datasets so the
  // home page can react immediately to browser geolocation.
  const [attractions, cities] = await Promise.all([
    fetchJson<AttractionApiItem[]>('/attractions'),
    fetchJson<CityApiItem[]>('/city'),
  ])

  const nearestCity = cities
    .map((city) => {
      const cityCoords = parseGpsPosition(city.gpsPosition)

      if (!cityCoords) {
        return null
      }

      return {
        city,
        distanceKm: distanceKm(coords, cityCoords),
      }
    })
    .filter((entry): entry is { city: CityApiItem; distanceKm: number } => entry !== null)
    .sort((first, second) => first.distanceKm - second.distanceKm)[0]

  const nearbyAttractions = attractions
    .map((attraction) => {
      const attractionCoords = parseGpsPosition(attraction.gpsPosition)

      if (!attractionCoords) {
        return null
      }

      return {
        attraction,
        distanceKm: distanceKm(coords, attractionCoords),
      }
    })
    .filter(
      (entry): entry is { attraction: AttractionApiItem; distanceKm: number } => entry !== null,
    )
    .sort((first, second) => first.distanceKm - second.distanceKm)
    .slice(0, limit)
    .map(({ attraction, distanceKm }) => ({
      id: attraction._id,
      name: attraction.name,
      description: attraction.description,
      image: resolveApiAssetUrl(attraction.heroImage),
      rating: attraction.rating ?? 0,
      reviews: 0,
      tags: attraction.slugArray.slice(0, 3),
      metaText: `${distanceKm.toFixed(1)} km væk`,
      href: `/attraction/${attraction._id}`,
    }))

  return {
    locationName: nearestCity?.city.name ?? 'din lokation',
    locationDescription:
      nearestCity?.city.tagLine ??
      nearestCity?.city.description ??
      DEFAULT_NEARBY_LOCATION_DESCRIPTION,
    attractions: nearbyAttractions,
  }
}

export async function getLargestCities(limit = 4): Promise<LargestCityCard[]> {
  const cities = await fetchJson<CityApiItem[]>('/city')

  return cities
    .sort((first, second) => second.population - first.population)
    .slice(0, limit)
    .map((city) => ({
      id: city._id,
      name: city.name,
      description: city.description,
      image: resolveApiAssetUrl(city.heroImage),
      rating: city.rating ?? 0,
      reviews: 0,
      tags: [city.region, city.commune, 'Storby'].filter(Boolean).slice(0, 3),
      metaText: `${city.population.toLocaleString('da-DK')} indbyggere`,
      href: `/city/${city._id}`,
    }))
}

async function getExperiencesBySlug(slug: string, limit = 4): Promise<NatureExperienceCard[]> {
  // Category sections combine attractions and events, then sort by live review
  // quality so the cards match what users currently rate highly.
  const [attractions, events] = await Promise.all([
    fetchJson<AttractionApiItem[]>('/attractions'),
    fetchJson<EventApiItem[]>('/events'),
  ])

  const entries: NatureExperienceSource[] = [
    ...attractions.map((attraction) => ({ ...attraction, type: 'Seværdighed' as const })),
    ...events.map((event) => ({ ...event, type: 'Event' as const })),
  ]

  const filteredEntries = entries.filter((entry) =>
    entry.slugArray.some((entrySlug: string) => entrySlug.toLowerCase() === slug.toLowerCase()),
  )

  const entriesWithReviewSummary = await Promise.all(
    filteredEntries.map(async (entry) => ({
      entry,
      summary: await getExperienceReviewSummary(entry._id, entry.rating ?? 0),
    })),
  )

  return entriesWithReviewSummary
    .sort((first, second) => {
      if (second.summary.rating !== first.summary.rating) {
        return second.summary.rating - first.summary.rating
      }

      return second.summary.reviews - first.summary.reviews
    })
    .slice(0, limit)
    .map(({ entry, summary }) => ({
      id: entry._id,
      name: entry.name,
      description: entry.description,
      image: entry.heroImage,
      rating: summary.rating,
      reviews: summary.reviews,
      tags: entry.slugArray,
      metaText: entry.type,
      href: entry.type === 'Event' ? `/event/${entry._id}` : `/attraction/${entry._id}`,
    }))
}

export async function getNatureExperiences(limit = 4): Promise<NatureExperienceCard[]> {
  return getExperiencesBySlug('natur', limit)
}

export async function getFamilyExperiences(limit = 4): Promise<FamilyExperienceCard[]> {
  return getExperiencesBySlug('familie', limit)
}
