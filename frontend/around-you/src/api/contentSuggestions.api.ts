import { apiRequest, jsonHeaders } from '@/api/http'
import { getAuthToken } from '@/api/authSession'
import type {
  ContentSuggestion,
  ContentSuggestionPayload,
  ContentSuggestionType,
} from '@/types/content-suggestion'

export function createContentSuggestion(
  type: ContentSuggestionType,
  payload: ContentSuggestionPayload,
): Promise<ContentSuggestion> {
  return apiRequest<ContentSuggestion>('/suggestions', {
    method: 'POST',
    token: getAuthToken(),
    headers: jsonHeaders(),
    body: JSON.stringify({ type, payload }),
  })
}

export function fetchPendingContentSuggestions(): Promise<ContentSuggestion[]> {
  return apiRequest<ContentSuggestion[]>('/admin/suggestions?status=pending', {
    token: getAuthToken(),
  })
}

export function approveContentSuggestion(id: string): Promise<unknown> {
  return apiRequest(`/admin/suggestions/${id}/approve`, {
    method: 'POST',
    token: getAuthToken(),
  })
}

export function rejectContentSuggestion(id: string, reason: string): Promise<ContentSuggestion> {
  return apiRequest<ContentSuggestion>(`/admin/suggestions/${id}/reject`, {
    method: 'POST',
    token: getAuthToken(),
    headers: jsonHeaders(),
    body: JSON.stringify({ reason }),
  })
}
