import L from 'leaflet'
import { getReverseGeocodedAddress } from '@/api/geocoding.api'

export type LocationMapMarker = {
  id: string
  latitude: number
  longitude: number
  title: string
  type: 'event' | 'attraction' | 'city'
}

const markerTypeLabels: Record<LocationMapMarker['type'], string> = {
  event: 'Event',
  attraction: 'Attraktion',
  city: 'By',
}

export function getMarkerIcon(isSelected: boolean): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div class="location-map-pin${isSelected ? ' location-map-pin--selected' : ''}"></div>`,
    iconSize: isSelected ? [34, 44] : [24, 32],
    iconAnchor: isSelected ? [17, 44] : [12, 32],
    popupAnchor: [0, isSelected ? -42 : -30],
  })
}

export async function getMarkerAddress(latitude: number, longitude: number): Promise<string> {
  try {
    return await getReverseGeocodedAddress(latitude, longitude)
  } catch (error) {
    console.error('Reverse geocoding failed:', error)
    return 'Unknown location'
  }
}

export function createPopupContent(item: LocationMapMarker, address?: string): HTMLElement {
  // Build popup DOM nodes directly instead of interpolating untrusted names into
  // HTML strings. Leaflet accepts either HTML strings or HTMLElement content.
  const container = document.createElement('div')
  container.className = 'location-map-popup'

  const meta = document.createElement('p')
  meta.className = 'location-map-popup__meta'
  meta.textContent = markerTypeLabels[item.type]

  const title = document.createElement('strong')
  title.className = 'location-map-popup__title'
  title.textContent = item.title

  container.append(meta, title)

  if (item.type === 'event' || item.type === 'attraction') {
    const addressElement = document.createElement('p')
    addressElement.className = 'location-map-popup__address'
    addressElement.textContent = address ? `Address: ${address}` : 'Finding address...'
    container.append(addressElement)
  }

  return container
}
