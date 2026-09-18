import { computed, onMounted, watch } from 'vue'
import {
  DEFAULT_NEARBY_LOCATION_DESCRIPTION,
  getFamilyExperiences,
  getEventsStartingBetween,
  getNearbyLocationContent,
} from '@/api/attractions.api'
import { useGeolocationStore } from '@/stores/geolocation'
import type { ExperienceCard } from '@/types/experience-card'
import type { NearbyLocationContent } from '@/types/nearby-location-content'
import { useAsyncData } from '@/composables/useAsyncData'
import { resolveApiAssetUrl } from '@/constants/config'

const emptyNearbyContent: NearbyLocationContent = {
  locationName: 'din lokation',
  locationDescription: DEFAULT_NEARBY_LOCATION_DESCRIPTION,
  attractions: [],
}

export const useHomeViewData = () => {
  const geolocationStore = useGeolocationStore()

  const nearbySection = useAsyncData<NearbyLocationContent>(
    async () => {
      if (!geolocationStore.coords) {
        return emptyNearbyContent
      }

      return getNearbyLocationContent(geolocationStore.coords, 4)
    },
    {
      defaultValue: emptyNearbyContent,
      getErrorMessage: () => 'Vi kunne ikke hente seværdigheder tæt på din lokation.',
    },
  )

  const familySection = useAsyncData<ExperienceCard[]>(() => getFamilyExperiences(4), {
    defaultValue: [],
    getErrorMessage: () => 'Vi kunne ikke hente familieoplevelser.',
  })

  function toEventCards(events: Awaited<ReturnType<typeof getEventsStartingBetween>>) {
    return events.map((event) => ({
      id: event._id,
      name: event.name,
      description: event.description,
      image: resolveApiAssetUrl(event.heroImage),
      rating: event.rating ?? 0,
      reviews: 0,
      tags: event.slugArray?.slice(0, 3) ?? [],
      metaText: `Starter kl. ${new Date(event.startDate).toLocaleTimeString('da-DK', {
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      href: `/event/${event._id}`,
    }))
  }

  function getMinutesUntilEndOfToday(now: Date): number {
    const endOfToday = new Date(now)
    endOfToday.setHours(23, 59, 59, 999)

    return Math.ceil((endOfToday.getTime() - now.getTime()) / (60 * 1000))
  }

  const eventsStartingNowSection = useAsyncData<ExperienceCard[]>(
    async () => {
      return toEventCards(await getEventsStartingBetween(new Date(), 0, 60))
    },
    {
      defaultValue: [],
      getErrorMessage: () => 'Vi kunne ikke hente events, der starter snart.',
    },
  )

  const eventsStartingSoonSection = useAsyncData<ExperienceCard[]>(
    async () => {
      return toEventCards(await getEventsStartingBetween(new Date(), 60, 120))
    },
    {
      defaultValue: [],
      getErrorMessage: () => 'Vi kunne ikke hente events, der starter snart.',
    },
  )

  const eventsLaterTodaySection = useAsyncData<ExperienceCard[]>(
    async () => {
      const now = new Date()
      const endOfDayMinutes = getMinutesUntilEndOfToday(now)

      if (endOfDayMinutes <= 120) {
        return []
      }

      return toEventCards(await getEventsStartingBetween(now, 120, endOfDayMinutes))
    },
    {
      defaultValue: [],
      getErrorMessage: () => 'Vi kunne ikke hente events senere i dag.',
    },
  )

  const userLocation = computed(() => nearbySection.data.value.locationName)
  const userLocationDescription = computed(() => nearbySection.data.value.locationDescription)
  const nearbyCards = computed(() => nearbySection.data.value.attractions)
  const showNearbySection = computed(() => Boolean(geolocationStore.coords))
  const changeLocation = () => geolocationStore.getLocation()

  watch(
    () => geolocationStore.coords,
    (coords) => {
      if (!coords) {
        nearbySection.setData(emptyNearbyContent)

        if (!geolocationStore.loading) {
          geolocationStore.getLocation()
        }

        return
      }

      void nearbySection.execute().catch((error) => {
        console.error('Fejl ved hentning af nærliggende seværdigheder:', error)
      })
    },
    { immediate: true },
  )

  watch(
    () => geolocationStore.error,
    (error) => {
      if (!error) {
        return
      }

      nearbySection.setData(emptyNearbyContent)
      nearbySection.setError('Vi kunne ikke få adgang til din lokation.')
    },
  )

  onMounted(() => {
    void eventsStartingNowSection.execute().catch((error) => {
      console.error('Fejl ved hentning af events, der starter snart:', error)
    })

    void eventsStartingSoonSection.execute().catch((error) => {
      console.error('Fejl ved hentning af events om 1-2 timer:', error)
    })

    void eventsLaterTodaySection.execute().catch((error) => {
      console.error('Fejl ved hentning af events senere i dag:', error)
    })

    void familySection.execute().catch((error) => {
      console.error('Fejl ved hentning af familieoplevelser:', error)
    })
  })

  return {
    showNearbySection,
    changeLocation,
    userLocation,
    userLocationDescription,
    nearbyCards,
    nearbyLoading: nearbySection.loading,
    nearbyError: nearbySection.error,
    familyCards: familySection.data,
    familyLoading: familySection.loading,
    familyError: familySection.error,
    nowCards: eventsStartingNowSection.data,
    nowLoading: eventsStartingNowSection.loading,
    nowError: eventsStartingNowSection.error,
    soonCards: eventsStartingSoonSection.data,
    soonLoading: eventsStartingSoonSection.loading,
    soonError: eventsStartingSoonSection.error,
    laterTodayCards: eventsLaterTodaySection.data,
    laterTodayLoading: eventsLaterTodaySection.loading,
    laterTodayError: eventsLaterTodaySection.error,
  }
}
