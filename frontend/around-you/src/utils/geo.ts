import type { Coordinates } from '@/types/coordinates'

type AxisDirection = 'N' | 'S' | 'E' | 'W'

function toSignedCoordinate(value: number, direction?: AxisDirection): number {
  if (!direction) {
    return value
  }

  return direction === 'S' || direction === 'W' ? -Math.abs(value) : Math.abs(value)
}

function convertDmsToDecimal(
  degrees: number,
  minutes = 0,
  seconds = 0,
  direction?: AxisDirection,
): number {
  const decimal = Math.abs(degrees) + minutes / 60 + seconds / 3600

  if (degrees < 0 && !direction) {
    return -decimal
  }

  return toSignedCoordinate(decimal, direction)
}

function isValidCoordinates(latitude: number, longitude: number): boolean {
  return (
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  )
}

function parseDecimalCoordinates(normalizedGpsPosition: string): Coordinates | null {
  const matches = normalizedGpsPosition.match(/-?\d+(?:\.\d+)?/g)

  if (!matches || matches.length < 2) {
    return null
  }

  const latitude = Number(matches[0])
  const longitude = Number(matches[1])

  if (!isValidCoordinates(latitude, longitude)) {
    return null
  }

  return { latitude, longitude }
}

function parseDirectionalCoordinates(normalizedGpsPosition: string): Coordinates | null {
  const matches = [...normalizedGpsPosition.matchAll(/(\d+(?:\.\d+)?)\s*([NSEW])/gi)]

  if (matches.length < 2) {
    return null
  }

  let latitude: number | null = null
  let longitude: number | null = null

  for (const match of matches) {
    const value = Number(match[1])
    const directionValue = match[2]

    if (!directionValue) {
      continue
    }

    const direction = directionValue.toUpperCase() as AxisDirection

    if (direction === 'N' || direction === 'S') {
      latitude = toSignedCoordinate(value, direction)
    }

    if (direction === 'E' || direction === 'W') {
      longitude = toSignedCoordinate(value, direction)
    }
  }

  if (latitude === null || longitude === null || !isValidCoordinates(latitude, longitude)) {
    return null
  }

  return { latitude, longitude }
}

function parseDmsCoordinates(normalizedGpsPosition: string): Coordinates | null {
  const matches = [
    ...normalizedGpsPosition.matchAll(
      /(\d{1,3})[^\dA-Z]+(\d{1,2})(?:[^\dA-Z]+(\d{1,2}(?:\.\d+)?))?[^A-Z\d]*([NSEW])/gi,
    ),
  ]

  if (matches.length < 2) {
    return null
  }

  let latitude: number | null = null
  let longitude: number | null = null

  for (const match of matches) {
    const degrees = Number(match[1])
    const minutes = Number(match[2])
    const seconds = match[3] ? Number(match[3]) : 0
    const directionValue = match[4]

    if (!directionValue) {
      continue
    }

    const direction = directionValue.toUpperCase() as AxisDirection
    const decimal = convertDmsToDecimal(degrees, minutes, seconds, direction)

    if (direction === 'N' || direction === 'S') {
      latitude = decimal
    }

    if (direction === 'E' || direction === 'W') {
      longitude = decimal
    }
  }

  if (latitude === null || longitude === null || !isValidCoordinates(latitude, longitude)) {
    return null
  }

  return { latitude, longitude }
}

export function parseGpsPosition(gpsPosition?: string): Coordinates | null {
  if (!gpsPosition) {
    return null
  }

  const normalizedGpsPosition = gpsPosition
    .trim()
    .replace(/,/g, '.')
    .replace(/[º°]/g, ' ')
    .replace(/[′']/g, ' ')
    .replace(/[″"]/g, ' ')
    .replace(/\s+/g, ' ')

  // Backend records are not fully normalized, so accept DMS, directional, and
  // plain decimal coordinate formats in that order.
  return (
    parseDmsCoordinates(normalizedGpsPosition) ??
    parseDirectionalCoordinates(normalizedGpsPosition) ??
    parseDecimalCoordinates(normalizedGpsPosition)
  )
}

export function distanceKm(from: Coordinates, to: Coordinates): number {
  const earthRadiusKm = 6371
  const latitudeDelta = ((to.latitude - from.latitude) * Math.PI) / 180
  const longitudeDelta = ((to.longitude - from.longitude) * Math.PI) / 180
  const fromLatitudeRadians = (from.latitude * Math.PI) / 180
  const toLatitudeRadians = (to.latitude * Math.PI) / 180

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(fromLatitudeRadians) *
      Math.cos(toLatitudeRadians) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadiusKm * c
}
