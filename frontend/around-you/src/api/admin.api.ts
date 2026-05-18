import { apiRequest, clearApiCache, jsonHeaders } from '@/api/http'
import { getAuthToken } from '@/api/authSession'
import type { ContentSuggestion, ContentSuggestionStatus } from '@/types/content-suggestion'
import type {
  AdminCollectionKey,
  AdminEditableRecord,
  AdminMutationResponse,
  AdminRecord,
  AdminVisibility,
  ReportedReview,
} from '@/types/admin'

function unwrapMutation<TRecord>(response: AdminMutationResponse<TRecord>): TRecord {
  // Some admin endpoints return the updated document directly while older
  // endpoints wrap it in { data }. Keep the frontend API stable across both.
  if (
    typeof response === 'object' &&
    response !== null &&
    'data' in response &&
    typeof response.data === 'object'
  ) {
    return response.data
  }

  return response as TRecord
}

async function clearCacheAfterMutation<T>(request: Promise<T>): Promise<T> {
  // Admin changes affect public pages as well, so invalidate the shared API
  // cache only after the mutation succeeds.
  const result = await request
  clearApiCache()
  return result
}

export function fetchAdminCollection(
  collection: AdminCollectionKey,
  visibility: AdminVisibility = 'active',
): Promise<AdminRecord[]> {
  // Visibility is server-side because hidden documents should never be mixed
  // into the active admin list accidentally.
  return apiRequest<AdminRecord[]>(`/admin/${collection}?visibility=${visibility}`, {
    token: getAuthToken(),
  })
}

export async function createAdminRecord(
  collection: AdminCollectionKey,
  payload: AdminEditableRecord,
): Promise<AdminRecord> {
  const response = await clearCacheAfterMutation(
    apiRequest<AdminMutationResponse<AdminRecord>>(`/admin/${collection}`, {
      method: 'POST',
      token: getAuthToken(),
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    }),
  )

  return unwrapMutation(response)
}

export async function updateAdminRecord(
  collection: AdminCollectionKey,
  id: string,
  payload: AdminEditableRecord,
): Promise<AdminRecord> {
  const response = await clearCacheAfterMutation(
    apiRequest<AdminMutationResponse<AdminRecord>>(
      `/admin/${collection}/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        token: getAuthToken(),
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
      },
    ),
  )

  return unwrapMutation(response)
}

export async function deleteAdminRecord(
  collection: AdminCollectionKey,
  id: string,
): Promise<AdminRecord> {
  const response = await clearCacheAfterMutation(
    apiRequest<AdminMutationResponse<AdminRecord>>(
      `/admin/${collection}/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        token: getAuthToken(),
      },
    ),
  )

  return unwrapMutation(response)
}

export async function restoreAdminRecord(
  collection: AdminCollectionKey,
  id: string,
): Promise<AdminRecord> {
  const response = await clearCacheAfterMutation(
    apiRequest<AdminMutationResponse<AdminRecord>>(
      `/admin/${collection}/${encodeURIComponent(id)}/restore`,
      {
        method: 'PATCH',
        token: getAuthToken(),
      },
    ),
  )

  return unwrapMutation(response)
}

export function deleteReportedReview(id: string, ruleBroken: string): Promise<unknown> {
  return clearCacheAfterMutation(
    apiRequest(`/admin/reviews/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      token: getAuthToken(),
      headers: jsonHeaders(),
      body: JSON.stringify({ ruleBroken }),
    }),
  )
}

export function fetchAdminSuggestions(
  status: ContentSuggestionStatus = 'pending',
): Promise<ContentSuggestion[]> {
  return apiRequest<ContentSuggestion[]>(`/admin/suggestions?status=${status}`, {
    token: getAuthToken(),
  })
}

export function approveAdminSuggestion(id: string): Promise<unknown> {
  return clearCacheAfterMutation(
    apiRequest(`/admin/suggestions/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      token: getAuthToken(),
    }),
  )
}

export function rejectAdminSuggestion(id: string, reason: string): Promise<ContentSuggestion> {
  return apiRequest<ContentSuggestion>(`/admin/suggestions/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    token: getAuthToken(),
    headers: jsonHeaders(),
    body: JSON.stringify({ reason }),
  })
}

export function fetchReportedReviews(
  visibility: AdminVisibility = 'active',
): Promise<ReportedReview[]> {
  // Reported reviews share the ReviewItem shape, including authorAvatar when
  // the backend enriches review responses for the admin moderation queue.
  return apiRequest<ReportedReview[]>(`/admin/reviews/reports?visibility=${visibility}`, {
    token: getAuthToken(),
  })
}

export function resolveReviewReport(id: string): Promise<ReportedReview> {
  return clearCacheAfterMutation(
    apiRequest<ReportedReview>(`/admin/reviews/${encodeURIComponent(id)}/resolve-report`, {
      method: 'PATCH',
      token: getAuthToken(),
    }),
  )
}

export function restoreReportedReview(id: string): Promise<ReportedReview> {
  return clearCacheAfterMutation(
    apiRequest<ReportedReview>(`/admin/reviews/${encodeURIComponent(id)}/restore`, {
      method: 'PATCH',
      token: getAuthToken(),
    }),
  )
}
