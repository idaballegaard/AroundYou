import { computed, onMounted, watch } from 'vue'
import {
  DEFAULT_NEARBY_LOCATION_DESCRIPTION,
  getFamilyExperiences,
  getLargestCities,
  getNatureExperiences,
  getNearbyLocationContent,
} from '@/api/attractions.api'
import { useGeolocationStore } from '@/stores/geolocation'
import type { ExperienceCard } from '@/types/experience-card'
import type { NearbyLocationContent } from '@/types/nearby-location-content'
import { useAsyncData } from '@/composables/useAsyncData'

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

  const citiesSection = useAsyncData<ExperienceCard[]>(() => getLargestCities(4), {
    defaultValue: [],
    getErrorMessage: () => 'Vi kunne ikke hente de største byer',
  })

  const natureSection = useAsyncData<ExperienceCard[]>(() => getNatureExperiences(4), {
    defaultValue: [],
    getErrorMessage: () => 'Vi kunne ikke hente naturoplevelser',
  })

  const familySection = useAsyncData<ExperienceCard[]>(() => getFamilyExperiences(4), {
    defaultValue: [],
    getErrorMessage: () => 'Vi kunne ikke hente familieoplevelser.',
  })

  const userLocation = computed(() => nearbySection.data.value.locationName)
  const userLocationDescription = computed(() => nearbySection.data.value.locationDescription)
  const nearbyCards = computed(() => nearbySection.data.value.attractions)
  const showNearbySection = computed(() => Boolean(geolocationStore.coords))

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
    void citiesSection.execute().catch((error) => {
      console.error('Fejl ved hentning af byer:', error)
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
    userLocation,
    userLocationDescription,
    nearbyCards,
    nearbyLoading: nearbySection.loading,
    nearbyError: nearbySection.error,
    cityCards: citiesSection.data,
    citiesLoading: citiesSection.loading,
    citiesError: citiesSection.error,
    natureCards: natureSection.data,
    natureLoading: natureSection.loading,
    natureError: natureSection.error,
    familyCards: familySection.data,
    familyLoading: familySection.loading,
    familyError: familySection.error,
  }
}
