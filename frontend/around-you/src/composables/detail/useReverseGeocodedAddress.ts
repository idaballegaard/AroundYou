import { ref, watch, type Ref } from 'vue'

import { getReverseGeocodedAddress } from './detailView.helpers'

/**
 * Resolves a readable address from a GPS position.
 */
export function useReverseGeocodedAddress(gpsPosition: Readonly<Ref<string | null | undefined>>) {
  const address = ref<string | null>(null)

  // Prevents stale async responses from overwriting newer address requests.
  let requestId = 0

  // Refetches the address whenever the GPS position changes.
  watch(
    gpsPosition,
    async (nextGpsPosition) => {
      const currentRequestId = ++requestId
      address.value = null

      const nextAddress = await getReverseGeocodedAddress(nextGpsPosition)

      // Only applies the result if it belongs to the latest request.
      if (currentRequestId === requestId) {
        address.value = nextAddress
      }
    },
    { immediate: true },
  )

  return {
    address,
  }
}
