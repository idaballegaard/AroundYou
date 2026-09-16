import { getAuthToken } from '@/api/authSession'
import { apiRequest } from '@/api/http'

export type CrawledEventCandidate = {
  _id: string
  sourceUrl: string
  title: string
  description: string
  dateText: string
  locationText: string
  category: string
  imageUrl: string
  crawledAt: string
}

export type CrawlOplevEsbjergEventsResponse = {
  source: string
  crawledAt: string
  events: unknown[]
  persistence: {
    inserted: number
    updated: number
  }
}

export function fetchNewOplevEsbjergEventCandidates(): Promise<CrawledEventCandidate[]> {
  return apiRequest<CrawledEventCandidate[]>('/admin/crawler/oplev-esbjerg/events', {
    token: getAuthToken(),
  })
}

export function crawlOplevEsbjergEvents(): Promise<CrawlOplevEsbjergEventsResponse> {
  return apiRequest<CrawlOplevEsbjergEventsResponse>('/admin/crawler/oplev-esbjerg/events', {
    method: 'POST',
    token: getAuthToken(),
  })
}
