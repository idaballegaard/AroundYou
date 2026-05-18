import { parseGpsPosition } from '@/utils/geo'

// Fallback image used when an attraction has no hero image.
export const DEFAULT_ATTRACTION_HERO_IMAGE =
  'https://images.unsplash.com/photo-1524230572899-a752b3835840?auto=format&fit=crop&w=2200&q=80'

// Fallback image used when an event has no hero image.
export const DEFAULT_EVENT_HERO_IMAGE =
  'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=2200&q=80'

export type DetailFact = {
  label: string
  value: string
  href?: string
}

export type ReverseGeocodeResponse = {
  display_name?: string
}

// Validates whether latitude and longitude are within valid GPS ranges.
function isValidCoordinates(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  )
}

// Attempts to parse GPS coordinates from a stored position string.
export function parseReverseGeocodePosition(
  gpsPosition: string | null | undefined,
): { latitude: number; longitude: number } | null {
  if (!gpsPosition?.trim()) return null

  const [latRaw, lngRaw] = gpsPosition.split(',')
  const commaLatitude = Number.parseFloat(latRaw ?? '')
  const commaLongitude = Number.parseFloat(lngRaw ?? '')

  // Supports simple comma-separated coordinate formats.
  if (isValidCoordinates(commaLatitude, commaLongitude)) {
    return {
      latitude: commaLatitude,
      longitude: commaLongitude,
    }
  }

  // Falls back to the shared GPS parsing utility.
  return parseGpsPosition(gpsPosition)
}

// Formats ISO date strings into Danish-readable dates.
export function formatDate(dateValue: string): string {
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return 'Ikke angivet'

  return parsed.toLocaleDateString('da-DK', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// Formats opening hours into a display-friendly string.
export function formatOpeningHours(hours: string[] | null | undefined): string {
  if (!hours || hours.length === 0) return 'Ikke angivet'
  return hours.join(', ')
}

// Formats population values using Danish number formatting.
export function formatPopulation(population: number): string {
  return `${population.toLocaleString('da-DK')} indbyggere`
}

// Formats attraction or event prices into readable Danish currency text.
export function formatPrice(price: number): string {
  return price === 0
    ? 'Gratis'
    : `${price.toLocaleString('da-DK', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })} kr.`
}

// Resolves a readable address from GPS coordinates using reverse geocoding.
export async function getReverseGeocodedAddress(
  gpsPosition: string | null | undefined,
  fetcher: typeof fetch = fetch,
): Promise<string | null> {
  if (!gpsPosition?.trim()) return null

  const coordinates = parseReverseGeocodePosition(gpsPosition)
  if (!coordinates) return null

  try {
    const response = await fetcher(
      `https://nominatim.openstreetmap.org/reverse?lat=${coordinates.latitude}&lon=${coordinates.longitude}&format=json`,
      { headers: { 'Accept-Language': 'da' } },
    )

    if (!response.ok) return null

    const data = (await response.json()) as ReverseGeocodeResponse
    return data.display_name ?? null
  } catch {
    return null
  }
}
