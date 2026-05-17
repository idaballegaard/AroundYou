import type { ContentSuggestion, ContentSuggestionType } from '@/types/content-suggestion'
import type { ReviewItem } from '@/api/reviews.api'

export type AdminFieldValue = string | number | boolean | string[]
export type AdminEditableRecord = Record<string, AdminFieldValue>
export type AdminCollectionKey = 'city' | 'attractions' | 'events'
export type AdminFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'checkbox'
  | 'tags'
  | 'slug-picker'
  | 'date'
  | 'image'
  | 'image-list'
export type AdminVisibility = 'active' | 'hidden' | 'all'

export type AdminRecord = AdminEditableRecord & {
  _id: string
  isHidden?: boolean
  hiddenAt?: string
  hiddenBy?: string
}

export type AdminFieldConfig = {
  key: string
  label: string
  type: AdminFieldType
  required?: boolean
}

export type AdminCollectionConfig = {
  key: AdminCollectionKey
  label: string
  pendingType: ContentSuggestionType
  description: string
  fields: AdminFieldConfig[]
  emptyRecord: AdminEditableRecord
}

export type AdminMutationResponse<TRecord> =
  | TRecord
  | {
      message: string
      data: TRecord
    }

export type ReportedReview = ReviewItem & {
  isHidden?: boolean
  hiddenAt?: string
  hiddenBy?: string
  reportCount: number
  reports: {
    reportedBy: string
    reason: string
    createdAt: string
  }[]
  reportResolved: boolean
  reportResolvedAt?: string
  reportResolvedBy?: string
}

export type PendingSuggestionGroup = {
  type: ContentSuggestionType
  items: ContentSuggestion[]
}
