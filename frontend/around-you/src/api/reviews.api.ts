import { getAuthToken } from '@/api/authSession'
import { apiRequest, clearApiCache, jsonHeaders } from '@/api/http'

export type ReviewTargetType = 'city' | 'event' | 'attraction'

export interface ReviewItem {
  _id: string
  targetId: string
  targetType: ReviewTargetType
  author: string
  // Added by the backend response layer from the author's user profile. It is
  // optional for compatibility with older responses.
  authorAvatar?: string
  title: string
  description: string
  rating: number
  likes: number
  likedBy: string[]
  edited: boolean
  image: string
  createdAt: string
}

export interface CreateReviewPayload {
  targetId: string
  targetType: ReviewTargetType
  title: string
  description: string
  rating: number
  image?: string
}

export async function getReviewsByTarget(targetId: string): Promise<ReviewItem[]> {
  // Target ids are content document ids for cities, events, and attractions.
  return apiRequest<ReviewItem[]>(`/reviews/target/${encodeURIComponent(targetId)}`)
}

export async function createReview(payload: CreateReviewPayload): Promise<ReviewItem> {
  return apiRequest<ReviewItem>('/reviews', {
    method: 'POST',
    token: getAuthToken(),
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  })
}

export async function likeReview(reviewId: string): Promise<ReviewItem> {
  return apiRequest<ReviewItem>(`/reviews/${encodeURIComponent(reviewId)}/like`, {
    method: 'POST',
    token: getAuthToken(),
    headers: jsonHeaders(),
  })
}

export async function reportReview(reviewId: string, reason: string): Promise<ReviewItem> {
  return apiRequest<ReviewItem>(`/reviews/${encodeURIComponent(reviewId)}/report`, {
    method: 'POST',
    token: getAuthToken(),
    headers: jsonHeaders(),
    body: JSON.stringify({ reason }),
  })
}

export interface UpdateReviewPayload {
  title?: string
  description?: string
  rating?: number
  image?: string
}

export async function updateReview(
  reviewId: string,
  payload: UpdateReviewPayload,
): Promise<ReviewItem> {
  return apiRequest<ReviewItem>(`/reviews/${encodeURIComponent(reviewId)}`, {
    method: 'PATCH',
    token: getAuthToken(),
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  })
}

type DeleteReviewResponse = {
  message: string
  data: ReviewItem
}

export async function deleteReview(reviewId: string): Promise<ReviewItem> {
  const response = await apiRequest<DeleteReviewResponse>(`/reviews/${encodeURIComponent(reviewId)}`, {
    method: 'DELETE',
    token: getAuthToken(),
  })

  // Detail pages and cards derive rating/count data from visible reviews, so a
  // self-delete needs to invalidate short-lived public reads.
  clearApiCache()

  return response.data
}
