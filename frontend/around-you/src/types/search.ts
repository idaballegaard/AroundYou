export type SearchFilterType = 'event' | 'activity' | 'community'
export type SearchTimeFilter = 'now' | 'next-hours' | 'later-today' | 'custom'

export type SearchFilters = {
  location: string
  types: SearchFilterType[]
  date: string
  time: SearchTimeFilter | ''
  customTime: string
  categories: string[]
}

export type SearchResult = {
  id: string
  title: string
  description: string
  location: string
  coordinates: Coordinates | null
  type: 'event' | 'attraction' | 'city'
  date: string
  startDateTime: string
  endDateTime: string
  rating: number
  reviews: number
  image: string
  categories: string[]
}

export type ApiEvent = {
  _id: string
  name: string
  description?: string
  heroImage: string
  rating?: number
  startDate: string
  endDate?: string
  gpsPosition?: string
  slugArray?: string[]
}

export type ApiAttraction = {
  _id: string
  name: string
  description?: string
  heroImage: string
  rating?: number
  updateAt?: string
  gpsPosition?: string
  slugArray?: string[]
}

export type City = {
  _id: string
  name?: string
  description?: string
  heroImage?: string
  gpsPosition: string
  population?: number
  rating?: number
}

export type Coordinates = {
  lat: number
  lng: number
}
