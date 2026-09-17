import { getAuthToken } from '@/api/authSession'
import { apiRequest } from '@/api/http'

export type CrawledEventCandidate = {
  _id: string
  sourceUrl: string
  title: string
  description: string
  dateText: string
  locationText: string
  addressText: string
  category: string
  imageUrl: string
  startDate: string
  endDate: string
  status: 'new' | 'approved' | 'rejected'
  publishedEventId?: string
  reviewedAt?: string
  rejectionReason?: string
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

export type CrawledEventApprovalPayload = {
  name: string
  description: string
  heroImage: string
  price: number
  link: string
  address: string
  city: string
  gpsPosition: string
  slugArray: string[]
  isAnnual: boolean
  startDate: string
  endDate: string
  openingHours: string[]
}

export type CrawledEventCandidateStatus = CrawledEventCandidate['status']

export function fetchOplevEsbjergEventCandidates(
  status: CrawledEventCandidateStatus = 'new',
): Promise<CrawledEventCandidate[]> {
  return apiRequest<CrawledEventCandidate[]>(`/admin/crawler/oplev-esbjerg/events?status=${status}`, {
    token: getAuthToken(),
  })
}

export function crawlOplevEsbjergEvents(): Promise<CrawlOplevEsbjergEventsResponse> {
  return apiRequest<CrawlOplevEsbjergEventsResponse>('/admin/crawler/oplev-esbjerg/events', {
    method: 'POST',
    token: getAuthToken(),
  })
}

export function approveOplevEsbjergEventCandidate(
  id: string,
  payload: CrawledEventApprovalPayload,
): Promise<unknown> {
  return apiRequest(`/admin/crawler/oplev-esbjerg/events/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    token: getAuthToken(),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function rejectOplevEsbjergEventCandidate(id: string, reason: string): Promise<unknown> {
  return apiRequest(`/admin/crawler/oplev-esbjerg/events/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    token: getAuthToken(),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })
}
