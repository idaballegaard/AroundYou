<template>
  <div class="space-y-3">
    <button
      v-if="showLocationButton"
      class="rounded bg-indigo-600 px-4 py-2 text-white"
      @click="geo.getLocation()"
    >
      Enable Location
    </button>

    <div ref="mapEl" :class="mapClass"></div>
  </div>
</template>

<script setup lang="ts">
import '@/components/map/location-map.css'
import { type LocationMapMarker } from '@/components/map/locationMap.helpers'
import { useLocationMap } from '@/components/map/useLocationMap'
import type { Coordinates } from '@/types/coordinates'

const props = withDefaults(
  defineProps<{
    showLocationButton?: boolean
    showUserMarker?: boolean
    mapClass?: string
    center?: Coordinates | null
    centerZoom?: number
    selectedZoom?: number
    selectedMarkerId?: string | null
    markers?: LocationMapMarker[]
  }>(),
  {
    showLocationButton: true,
    showUserMarker: true,
    mapClass: 'h-[500px] w-full rounded',
    center: null,
    centerZoom: 11,
    selectedZoom: 16,
    selectedMarkerId: null,
    markers: () => [],
  },
)

const emit = defineEmits<{
  'update:selectedMarkerId': [id: string | null]
  'marker-selected': [marker: LocationMapMarker]
}>()

const { geo, mapEl } = useLocationMap(props, emit)
</script>
