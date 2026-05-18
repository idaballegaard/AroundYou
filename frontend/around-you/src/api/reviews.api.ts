import { getAuthToken } from '@/api/authSession'
import { apiRequest, jsonHeaders } from '@/api/http'

export type ReviewTargetType = 'city' | 'event' | 'attraction'

export interface ReviewItem {
  _id: string
  targetId: string
  targetType: ReviewTargetType
  author: string
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
