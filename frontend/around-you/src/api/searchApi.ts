import { apiGetCached } from '@/api/http'
import type { ApiAttraction } from '@/types/search-api-attraction'
import type { ApiEvent } from '@/types/search-api-event'
import type { City } from '@/types/search-city'

// Lightweight public collection readers. They intentionally use the shared
// short TTL cache because search, home sections, and admin category pickers
// often ask for the same datasets in quick succession.
export const fetchEvents = () => apiGetCached<ApiEvent[]>('/events')

export const fetchAttractions = () => apiGetCached<ApiAttraction[]>('/attractions')

export const fetchCities = () => apiGetCached<City[]>('/city')
