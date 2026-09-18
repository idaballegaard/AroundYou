import { computed, onMounted, watch } from 'vue'
import {
  DEFAULT_NEARBY_LOCATION_DESCRIPTION,
  getFamilyExperiences,
  getEventsStartingBetween,
  getNatureExperiences,
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

  const natureSection = useAsyncData<ExperienceCard[]>(() => getNatureExperiences(4), {
    defaultValue: [],
    getErrorMessage: () => 'Vi kunne ikke hente naturoplevelser',
  })

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

    void natureSection.execute().catch((error) => {
      console.error('Fejl ved hentning af naturoplevelser:', error)
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
    natureCards: natureSection.data,
    natureLoading: natureSection.loading,
    natureError: natureSection.error,
    familyCards: familySection.data,
    familyLoading: familySection.loading,
    familyError: familySection.error,
    nowCards: eventsStartingNowSection.data,
    nowLoading: eventsStartingNowSection.loading,
    nowError: eventsStartingNowSection.error,
    soonCards: eventsStartingSoonSection.data,
    soonLoading: eventsStartingSoonSection.loading,
    soonError: eventsStartingSoonSection.error,
  }
}
