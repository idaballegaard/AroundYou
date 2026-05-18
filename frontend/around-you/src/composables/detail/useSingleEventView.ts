import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { getEventByIdentifier } from '@/api/attractions.api'
import { useAsyncData } from '@/composables/useAsyncData'
import type { EventApiItem } from '@/types/event-api-item'
import {
  DEFAULT_EVENT_HERO_IMAGE,
  formatDate,
  formatOpeningHours,
  formatPrice,
  type DetailFact,
} from './detailView.helpers'
import { useReverseGeocodedAddress } from './useReverseGeocodedAddress'

/**
 * Collects and manages all state used by the single event detail view.
 */
export function useSingleEventView() {
  const route = useRoute()
  const reviewRating = ref<number | null>(null)

  // Resolves the event identifier from the available route params.
  const eventParam = computed(() => {
    const routeEvent = route.params.eventId ?? route.params.eventName ?? route.params.id
    return typeof routeEvent === 'string' ? routeEvent.trim() : ''
  })

  // Loads the selected event from the API.
  const eventSection = useAsyncData<EventApiItem | null>(
    () => getEventByIdentifier(eventParam.value),
    {
      defaultValue: null,
      getErrorMessage: () => 'Vi kunne ikke hente eventet fra databasen.',
    },
  )

  // Refetches event data when the route identifier changes.
  watch(
    eventParam,
    () => {
      void eventSection.execute().catch((error) => {
        console.error('Fejl ved hentning af eventdata:', error)
      })
    },
    { immediate: true },
  )

  // Maps async state into detail-view friendly values.
  const eventItem = computed(() => eventSection.data.value)
  const eventLoading = computed(() => eventSection.loading.value)
  const eventError = computed(() => eventSection.error.value)
  const displayEventName = computed(() => eventItem.value?.name ?? '')
  const heroImage = computed(() => eventItem.value?.heroImage ?? DEFAULT_EVENT_HERO_IMAGE)
  const gpsPosition = computed(() => eventItem.value?.gpsPosition)

  // Converts the event GPS position into a readable address.
  const { address: eventAddress } = useReverseGeocodedAddress(gpsPosition)

  // Builds the fact list shown in the event detail sidebar.
  const eventFacts = computed<DetailFact[]>(() => {
    if (!eventItem.value) return []

    return [
      { label: 'Startdato', value: formatDate(eventItem.value.startDate) },
      { label: 'Slutdato', value: formatDate(eventItem.value.endDate) },
      { label: 'Pris', value: formatPrice(eventItem.value.price) },
      { label: 'Årlig begivenhed', value: eventItem.value.isAnnual ? 'Ja' : 'Nej' },
      {
        label: 'Åbningstider',
        value: formatOpeningHours(eventItem.value.openingHours),
      },
      eventAddress.value ? { label: 'Adresse', value: eventAddress.value } : null,
      eventItem.value.link
        ? {
            label: 'Website',
            value: eventItem.value.link,
            href: eventItem.value.link,
          }
        : null,
    ].filter((fact): fact is DetailFact => fact !== null)
  })

  // Stores the latest average review rating emitted by the review section.
  const handleAverageRating = (rating: number | null) => {
    reviewRating.value = rating
  }

  return {
    displayEventName,
    eventError,
    eventFacts,
    eventItem,
    eventLoading,
    handleAverageRating,
    heroImage,
    reviewRating,
  }
}
