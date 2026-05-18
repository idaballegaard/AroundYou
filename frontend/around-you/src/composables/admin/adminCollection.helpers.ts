import { getGeocodedCoordinates } from '@/api/geocoding.api'
import type {
  AdminCollectionKey,
  AdminEditableRecord,
  AdminFieldConfig,
  AdminFieldValue,
} from '@/types/admin'

export function cloneAdminRecord(record: AdminEditableRecord): AdminEditableRecord {
  // Admin forms mutate array fields such as categories/images, so clone arrays
  // when seeding a new form from the shared empty record.
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, Array.isArray(value) ? [...value] : value]),
  ) as AdminEditableRecord
}

export function toEditableAdminRecord(
  record: AdminEditableRecord,
  fields: AdminFieldConfig[],
): AdminEditableRecord {
  // Only include configured fields in the edit form. Backend-only metadata such
  // as _id, visibility flags, and timestamps stay out of mutation payloads.
  return Object.fromEntries(
    fields.map((field) => [field.key, normalizeAdminValue(record[field.key])]),
  )
}

export function normalizeAdminValue(value: AdminFieldValue | undefined): AdminFieldValue {
  if (value === undefined) {
    return ''
  }

  return value
}

export function getAdminStringValue(record: AdminEditableRecord, key: string): string {
  const value = record[key]
  return typeof value === 'string' ? value.trim() : ''
}

export function isAddressGeocodedCollection(collection: AdminCollectionKey): boolean {
  return collection === 'attractions' || collection === 'events'
}

export async function withResolvedGpsPosition(
  collection: AdminCollectionKey,
  record: AdminEditableRecord,
): Promise<AdminEditableRecord> {
  const payload: AdminEditableRecord = { ...record }

  if (isAddressGeocodedCollection(collection)) {
    // Attractions and events are stored with gpsPosition, but admins edit the
    // human-friendly address/city fields.
    const address = getAdminStringValue(payload, 'address')
    const city = getAdminStringValue(payload, 'city')

    if (!address || !city) {
      throw new Error('Indtast både adresse og by.')
    }

    const location = await getGeocodedCoordinates(address, city)
    payload.gpsPosition = `${location.latitude},${location.longitude}`

    delete payload.address
    delete payload.city

    return payload
  }

  if (collection === 'city') {
    // Cities do not have street addresses; geocoding by name keeps the admin
    // form consistent with public city creation.
    const name = getAdminStringValue(payload, 'name')

    if (!name) {
      throw new Error('Indtast bynavn.')
    }

    const location = await getGeocodedCoordinates(null, name)
    payload.gpsPosition = `${location.latitude},${location.longitude}`
  }

  return payload
}
