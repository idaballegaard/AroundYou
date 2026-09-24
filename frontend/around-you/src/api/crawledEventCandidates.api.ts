import { getAuthToken } from '@/api/authSession'
import { apiRequest } from '@/api/http'

const OPLEV_ESBJERG_SOURCE_ID = 'oplev-esbjerg'

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
  possibleDuplicates: Array<{
    _id: string
    title: string
    source: string
    sourceUrl: string
    dateText: string
    status: 'new' | 'approved'
    matchScore: number
    matchConfidence: 'Høj' | 'Middel' | 'Lav'
    matchReasons: string[]
  }>
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

export type CrawlerImportRun = {
  trigger: 'manual' | 'scheduled'
  status: 'running' | 'succeeded' | 'failed'
  startedAt: string
  finishedAt?: string
  eventCount: number
  inserted: number
  updated: number
  errorMessage?: string
}

export type OplevEsbjergCrawlerStatus = {
  source: {
    id: string
    label: string
    supportsScheduledImport: boolean
  }
  dailyImportEnabled: boolean
  dailyImportHour: number | null
  nextImportAt: string | null
  lastRun: CrawlerImportRun | null
}

export type CrawlerEventSource = {
  id: string
  label: string
  sourceUrl: string
  status: 'active' | 'planned'
  supportsScheduledImport: boolean
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
  sourceId = OPLEV_ESBJERG_SOURCE_ID,
): Promise<CrawledEventCandidate[]> {
  return apiRequest<CrawledEventCandidate[]>(`/admin/crawler/events?source=${encodeURIComponent(sourceId)}&status=${status}`, {
    token: getAuthToken(),
  })
}

export function crawlOplevEsbjergEvents(sourceId = OPLEV_ESBJERG_SOURCE_ID): Promise<CrawlOplevEsbjergEventsResponse> {
  return apiRequest<CrawlOplevEsbjergEventsResponse>(`/admin/crawler/events?source=${encodeURIComponent(sourceId)}`, {
    method: 'POST',
    token: getAuthToken(),
  })
}

export function fetchOplevEsbjergCrawlerStatus(sourceId = OPLEV_ESBJERG_SOURCE_ID): Promise<OplevEsbjergCrawlerStatus> {
  return apiRequest<OplevEsbjergCrawlerStatus>(`/admin/crawler/status?source=${encodeURIComponent(sourceId)}`, {
    token: getAuthToken(),
  })
}

export function approveOplevEsbjergEventCandidate(
  id: string,
  payload: CrawledEventApprovalPayload,
  sourceId = OPLEV_ESBJERG_SOURCE_ID,
): Promise<unknown> {
  return apiRequest(`/admin/crawler/events/${encodeURIComponent(id)}/approve?source=${encodeURIComponent(sourceId)}`, {
    method: 'POST',
    token: getAuthToken(),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function rejectOplevEsbjergEventCandidate(id: string, reason: string, sourceId = OPLEV_ESBJERG_SOURCE_ID): Promise<unknown> {
  return apiRequest(`/admin/crawler/events/${encodeURIComponent(id)}/reject?source=${encodeURIComponent(sourceId)}`, {
    method: 'POST',
    token: getAuthToken(),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })
}

export function fetchCrawlerEventSources(): Promise<CrawlerEventSource[]> {
  return apiRequest<CrawlerEventSource[]>('/admin/crawler/sources', { token: getAuthToken() })
}
