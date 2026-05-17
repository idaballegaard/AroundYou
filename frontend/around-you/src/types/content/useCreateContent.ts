import type { ContentType } from './content'

export type CreateEventForm = {
  name: string
  description: string
  price: string
  link: string
  address: string
  city: string
  slugArray: string[]
  isAnnual: boolean
  startDate: string
  endDate: string
  openingHoursText: string
}

export type CreateAttractionForm = {
  name: string
  description: string
  price: string
  link: string
  address: string
  city: string
  slugArray: string[]
  openingHoursText: string
}

export type CreateCityForm = {
  name: string
  tagLine: string
  description: string
  commune: string
  region: string
  country: string
  population: string
  visitorCenter: string
}

export type CreateContentFormType = {
  value: ContentType
}

export type CreateContentMessageSetter = (msg: string) => void
export type CreateContentMessageType = 'success' | 'error' | 'info'
export type CreateContentMessageStateSetter = (
  msg: string,
  type?: CreateContentMessageType,
) => void

export type CreateContentFileRef = {
  value: File | null
}

export type CreateContentFileArrayRef = {
  value: File[]
}
