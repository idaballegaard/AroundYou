import { nextTick, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import {
  createPopupContent,
  getMarkerAddress,
  getMarkerIcon,
  type LocationMapMarker,
} from '@/components/map/locationMap.helpers'
import { useGeolocationStore } from '@/stores/geolocation'
import type { Coordinates } from '@/types/coordinates'

export type LocationMapProps = {
  showLocationButton: boolean
  showUserMarker: boolean
  mapClass: string
  center: Coordinates | null
  centerZoom: number
  selectedZoom: number
  selectedMarkerId: string | null
  markers: LocationMapMarker[]
}

export type LocationMapEmit = {
  (event: 'update:selectedMarkerId', id: string | null): void
  (event: 'marker-selected', marker: LocationMapMarker): void
}

export function useLocationMap(props: LocationMapProps, emit: LocationMapEmit) {
  const geo = useGeolocationStore()
  const mapEl = ref<HTMLElement | null>(null)
  let map: ReturnType<typeof L.map> | null = null
  let userMarker: ReturnType<typeof L.marker> | null = null
  let resultMarkersLayer: L.LayerGroup | null = null
  const activeMarkerId = ref<string | null>(props.selectedMarkerId)
  const markerAddressCache = new Map<string, string>()
  const resultMarkerInstances = new Map<string, L.Marker>()

  async function focusResultMarker(item: LocationMapMarker, shouldEmit = false): Promise<void> {
    if (!map) return

    activeMarkerId.value = item.id

    if (shouldEmit) {
      emit('update:selectedMarkerId', item.id)
      emit('marker-selected', item)
    }

    // Re-render markers so the selected marker gets the larger icon before the
    // map flies to it.
    renderResultMarkers()
    const selectedMarker = resultMarkerInstances.get(item.id)

    map.flyTo([item.latitude, item.longitude], props.selectedZoom, {
      animate: true,
      duration: 0.45,
    })

    selectedMarker?.openPopup()

    if (item.type !== 'event' && item.type !== 'attraction') return

    const cachedAddress = markerAddressCache.get(item.id)
    if (cachedAddress) {
      selectedMarker?.setPopupContent(createPopupContent(item, cachedAddress)).openPopup()
      return
    }

    const address = await getMarkerAddress(item.latitude, item.longitude)
    markerAddressCache.set(item.id, address)

    if (activeMarkerId.value === item.id) {
      resultMarkerInstances
        .get(item.id)
        ?.setPopupContent(createPopupContent(item, address))
        .openPopup()
    }
  }

  async function updateUserMarker(coords: Coordinates): Promise<void> {
    if (!map) return

    const { latitude, longitude } = coords
    map.setView([latitude, longitude], 13)

    const address = await getMarkerAddress(latitude, longitude)

    if (userMarker) {
      userMarker.setLatLng([latitude, longitude]).setPopupContent(address)
      return
    }

    userMarker = L.marker([latitude, longitude]).addTo(map).bindPopup(address).openPopup()
  }

  function renderResultMarkers(): void {
    if (!map) return

    if (!resultMarkersLayer) {
      resultMarkersLayer = L.layerGroup().addTo(map)
    }

    // Leaflet marker styling is not easily updated in place, so rebuild this
    // layer whenever selection or marker data changes.
    resultMarkersLayer.clearLayers()
    resultMarkerInstances.clear()

    for (const item of props.markers) {
      const isSelected = activeMarkerId.value === item.id
      const markerInstance = L.marker([item.latitude, item.longitude], {
        icon: getMarkerIcon(isSelected),
        zIndexOffset: isSelected ? 1000 : 0,
      })
        .bindPopup(createPopupContent(item, markerAddressCache.get(item.id)))
        .on('click', () => {
          void focusResultMarker(item, true)
        })

      markerInstance.addTo(resultMarkersLayer)
      resultMarkerInstances.set(item.id, markerInstance)

      if (isSelected) {
        markerInstance.openPopup()
      }
    }
  }

  function updateMapViewFromProps(): void {
    if (!map) return

    renderResultMarkers()

    if (props.center) {
      map.setView([props.center.latitude, props.center.longitude], props.centerZoom)
      return
    }

    if (props.markers.length) {
      const bounds = L.latLngBounds(
        props.markers.map((item) => [item.latitude, item.longitude] as [number, number]),
      )
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }

  onMounted(async () => {
    await nextTick()

    if (!mapEl.value) return

    map = L.map(mapEl.value).setView([56.1629, 10.2039], 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    if (props.showUserMarker && !props.center && geo.coords) {
      await updateUserMarker(geo.coords)
    }

    updateMapViewFromProps()
  })

  watch(
    () => geo.coords,
    async (coords) => {
      if (props.center || !props.showUserMarker || !coords || !map) return

      await updateUserMarker(coords)
    },
  )

  watch(
    () => [props.center, props.centerZoom, props.markers] as const,
    () => {
      // Search results can change while a marker is selected. Clear stale
      // selection so parent list and map do not drift apart.
      if (activeMarkerId.value && !props.markers.some((item) => item.id === activeMarkerId.value)) {
        activeMarkerId.value = null
        emit('update:selectedMarkerId', null)
      }

      updateMapViewFromProps()
    },
    { deep: true },
  )

  watch(
    () => props.selectedMarkerId,
    (selectedId) => {
      if (selectedId === activeMarkerId.value) return

      activeMarkerId.value = selectedId

      if (!selectedId) {
        renderResultMarkers()
        return
      }

      const selectedMarker = props.markers.find((item) => item.id === selectedId)

      if (selectedMarker) {
        void focusResultMarker(selectedMarker)
        return
      }

      renderResultMarkers()
    },
  )

  return {
    geo,
    mapEl,
  }
}
