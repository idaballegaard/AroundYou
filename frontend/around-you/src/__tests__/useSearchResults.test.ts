import { defineComponent, nextTick, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSearchResults } from '@/composables/search/useSearchResults'
import type { SearchFilters } from '@/types/search'

const fetchEventsMock = vi.fn()
const fetchAttractionsMock = vi.fn()
const fetchCitiesMock = vi.fn()
const getLocationMock = vi.fn()

let geolocationState: {
  coords: { latitude: number; longitude: number } | null
  loading: boolean
  error: string | null
}

vi.mock('@/api/searchApi', () => ({
  fetchEvents: () => fetchEventsMock(),
  fetchAttractions: () => fetchAttractionsMock(),
  fetchCities: () => fetchCitiesMock(),
}))

vi.mock('@/stores/geolocation', () => ({
  useGeolocationStore: () => ({
    get coords() {
      return geolocationState.coords
    },
    get loading() {
      return geolocationState.loading
    },
    get error() {
      return geolocationState.error
    },
    getLocation: getLocationMock,
  }),
}))

const cities = [
  {
    _id: 'city-aarhus',
    name: 'Aarhus',
    description: 'Stor by',
    heroImage: 'aarhus.jpg',
    gpsPosition: '56.1629, 10.2039',
    population: 280000,
    rating: 4.8,
  },
  {
    _id: 'city-ribe',
    name: 'Ribe',
    description: 'Historisk by',
    heroImage: 'ribe.jpg',
    gpsPosition: '55.328, 8.762',
    population: 8000,
    rating: 4.4,
  },
]

const events = [
  {
    _id: 'event-food',
    name: 'Food Festival',
    description: 'Madoplevelse',
    heroImage: 'food.jpg',
    rating: 4.5,
    startDate: '2026-06-10T12:00:00.000Z',
    gpsPosition: '56.16, 10.2',
    slugArray: ['food', 'family'],
  },
]

const attractions = [
  {
    _id: 'attraction-museum',
    name: 'Museum',
    description: 'Kultur',
    heroImage: 'museum.jpg',
    rating: 4.1,
    updateAt: '2026-05-01T10:00:00.000Z',
    gpsPosition: '55.33, 8.76',
    slugArray: ['culture'],
  },
]

const mountSearchHarness = (initialFilters: SearchFilters) => {
  let exposed: ReturnType<typeof useSearchResults> | undefined

  const Harness = defineComponent({
    setup() {
      const filters = ref(initialFilters)
      exposed = useSearchResults(filters)
      return { filters }
    },
    template: '<div />',
  })

  const wrapper = mount(Harness)

  return {
    wrapper,
    get state() {
      if (!exposed) {
        throw new Error('Search harness did not initialize')
      }
      return exposed
    },
  }
}

describe('useSearchResults', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    geolocationState = {
      coords: null,
      loading: false,
      error: null,
    }

    fetchEventsMock.mockResolvedValue(events)
    fetchAttractionsMock.mockResolvedValue(attractions)
    fetchCitiesMock.mockResolvedValue(cities)
  })

  it('loads search data, exposes filter options, and falls back to largest cities without location', async () => {
    const { state } = mountSearchHarness({ location: '', types: [], date: '', categories: [] })

    await flushPromises()

    expect(fetchEventsMock).toHaveBeenCalledOnce()
    expect(fetchAttractionsMock).toHaveBeenCalledOnce()
    expect(fetchCitiesMock).toHaveBeenCalledOnce()
    expect(getLocationMock).toHaveBeenCalledOnce()
    expect(state.isLoading.value).toBe(false)
    expect(state.errorMessage.value).toBe('')
    expect(state.isShowingLargestCities.value).toBe(true)
    expect(state.filteredResults.value.map((item) => item.title)).toEqual(['Aarhus', 'Ribe'])
    expect(state.locationOptions.value).toEqual(['Aarhus', 'Ribe'])
    expect(state.categoryOptions.value).toEqual(['culture', 'family', 'food'])
  })

  it('filters by location, type, date, and category when filters are active', async () => {
    const { state } = mountSearchHarness({
      location: 'aar',
      types: ['event'],
      date: '2026-06-10',
      categories: ['food'],
    })

    await flushPromises()

    expect(state.filteredResults.value).toHaveLength(1)
    expect(state.filteredResults.value[0]).toMatchObject({
      id: 'event-food',
      title: 'Food Festival',
      location: 'Aarhus',
      type: 'event',
      date: '2026-06-10',
      categories: ['food', 'family'],
    })
  })

  it('returns nearest experiences when user coordinates are available and no filters are active', async () => {
    geolocationState.coords = { latitude: 56.162, longitude: 10.2 }

    const { state } = mountSearchHarness({ location: '', types: [], date: '', categories: [] })

    await flushPromises()

    expect(state.isUsingLocationResults.value).toBe(true)
    expect(state.isShowingLargestCities.value).toBe(false)
    expect(state.filteredResults.value.map((item) => item.id)).toEqual([
      'event-food',
      'attraction-museum',
    ])
  })

  it('surfaces API errors and stops loading', async () => {
    fetchEventsMock.mockRejectedValueOnce(new Error('Search API unavailable'))

    const { state } = mountSearchHarness({ location: '', types: [], date: '', categories: [] })

    await flushPromises()
    await nextTick()

    expect(state.filteredResults.value).toEqual([])
    expect(state.isLoading.value).toBe(false)
    expect(state.errorMessage.value).toBe('Search API unavailable')
  })
})
