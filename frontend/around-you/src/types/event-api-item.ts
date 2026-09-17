export type EventApiItem = {
  _id: string
  name: string
  description: string
  heroImage: string
  imageArray: string[]
  price: number
  link: string
  gpsPosition: string
  address?: string
  city?: string
  isAnnual: boolean
  startDate: string
  endDate: string
  openingHours: string[]
  rating: number
  slugArray: string[]
}
