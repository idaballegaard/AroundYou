import { computed, ref, watch, type Ref } from 'vue'
import { getStoredUserId } from '@/utils/auth'
import {
  createReview,
  getReviewsByTarget,
  likeReview,
  reportReview,
  updateReview,
  type ReviewItem,
  type ReviewTargetType,
} from '@/api/reviews.api'
import { normalizeRating, normalizeText } from '@/utils/validators'

export type ReviewFormState = {
  title: string
  description: string
  rating: number
  image: string
}

export type EditReviewFormState = {
  title: string
  description: string
  rating: number
  image: string
}

export type ReportFormState = {
  reason: string
  details: string
}

export function useReviewSection(options: {
  targetId: Ref<string>
  targetType: Ref<ReviewTargetType>
}) {
  const { targetId, targetType } = options

  const reviews = ref<ReviewItem[]>([])
  const loading = ref(false)
  const fetchError = ref<string | null>(null)

  const form = ref<ReviewFormState>({ title: '', description: '', rating: 0, image: '' })
  const submitting = ref(false)
  const submitError = ref<string | null>(null)

  const likeLoading = ref<string | null>(null)

  const editingId = ref<string | null>(null)
  const editForm = ref<EditReviewFormState>({ title: '', description: '', rating: 0, image: '' })
  const editSaving = ref(false)
  const editError = ref<string | null>(null)

  const reportModalOpen = ref(false)
  const reportTargetReview = ref<ReviewItem | null>(null)
  const reportForm = ref<ReportFormState>({ reason: '', details: '' })
  const reportError = ref<string | null>(null)
  const reportSubmitting = ref(false)
  const reportedReviewIds = ref<string[]>([])

  const averageRating = computed(() => {
    if (reviews.value.length === 0) return null
    const sum = reviews.value.reduce((acc, review) => acc + review.rating, 0)
    return sum / reviews.value.length
  })

  function startEdit(review: ReviewItem) {
    editingId.value = review._id
    editForm.value = {
      title: review.title,
      description: review.description,
      rating: review.rating,
      image: review.image ?? '',
    }
    editError.value = null
  }

  function cancelEdit() {
    editingId.value = null
    editError.value = null
  }

  function isReviewReported(reviewId: string): boolean {
    return reportedReviewIds.value.includes(reviewId)
  }

  function openReportModal(review: ReviewItem) {
    if (isReviewReported(review._id)) return
    reportTargetReview.value = review
    reportForm.value = { reason: '', details: '' }
    reportError.value = null
    reportModalOpen.value = true
  }

  function closeReportModal() {
    reportModalOpen.value = false
    reportTargetReview.value = null
    reportError.value = null
  }

  async function submitReport() {
    if (!reportTargetReview.value || reportSubmitting.value) return
    if (!reportForm.value.reason) {
      reportError.value = 'Vælg en årsag for anmeldelsen.'
      return
    }
    const review = reportTargetReview.value
    const reason = [reportForm.value.reason, reportForm.value.details]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(': ')

    try {
      reportSubmitting.value = true
      const updated = await reportReview(
        review._id,
        normalizeText(reason, { field: 'Årsag', required: true, max: 500 }),
      )
      const index = reviews.value.findIndex((entry) => entry._id === review._id)
      if (index !== -1) reviews.value[index] = updated
    } catch (err) {
      reportError.value = err instanceof Error ? err.message : 'Kunne ikke anmelde review.'
      return
    } finally {
      reportSubmitting.value = false
    }

    if (!reportedReviewIds.value.includes(reportTargetReview.value._id)) {
      reportedReviewIds.value.push(reportTargetReview.value._id)
    }
    closeReportModal()
  }

  async function saveEdit(reviewId: string) {
    editSaving.value = true
    editError.value = null
    try {
      const updated = await updateReview(reviewId, {
        title: normalizeText(editForm.value.title, {
          field: 'Titel',
          required: true,
          min: 3,
          max: 255,
        }),
        description: normalizeText(editForm.value.description, {
          field: 'Beskrivelse',
          required: true,
          min: 6,
          max: 1024,
        }),
        rating: normalizeRating(editForm.value.rating),
        image: normalizeText(editForm.value.image, { field: 'Billede', max: 2048 }) || undefined,
      })
      const index = reviews.value.findIndex((review) => review._id === reviewId)
      if (index !== -1) reviews.value[index] = updated
      editingId.value = null
    } catch (err) {
      editError.value = err instanceof Error ? err.message : 'Noget gik galt.'
    } finally {
      editSaving.value = false
    }
  }

  async function loadReviews() {
    loading.value = true
    fetchError.value = null
    try {
      reviews.value = await getReviewsByTarget(targetId.value)
    } catch {
      fetchError.value = 'Kunne ikke hente anmeldelser.'
    } finally {
      loading.value = false
    }
  }

  async function submitReview() {
    if (form.value.rating === 0) return
    submitting.value = true
    submitError.value = null
    try {
      const created = await createReview({
        targetId: targetId.value,
        targetType: targetType.value,
        title: normalizeText(form.value.title, {
          field: 'Titel',
          required: true,
          min: 3,
          max: 255,
        }),
        description: normalizeText(form.value.description, {
          field: 'Beskrivelse',
          required: true,
          min: 6,
          max: 1024,
        }),
        rating: normalizeRating(form.value.rating),
        image: normalizeText(form.value.image, { field: 'Billede', max: 2048 }) || undefined,
      })
      reviews.value.unshift(created)
      form.value = { title: '', description: '', rating: 0, image: '' }
    } catch (err) {
      submitError.value = err instanceof Error ? err.message : 'Noget gik galt.'
    } finally {
      submitting.value = false
    }
  }

  function hasLiked(review: ReviewItem): boolean {
    const userId = getStoredUserId()
    return !!userId && review.likedBy.includes(userId)
  }

  async function toggleLike(review: ReviewItem) {
    const userId = getStoredUserId()
    if (!userId || likeLoading.value) return
    likeLoading.value = review._id
    try {
      const updated = await likeReview(review._id)
      const index = reviews.value.findIndex((entry) => entry._id === review._id)
      if (index !== -1) reviews.value[index] = updated
    } finally {
      likeLoading.value = null
    }
  }

  watch(targetId, () => {
    void loadReviews()
  }, { immediate: true })

  return {
    reviews,
    loading,
    fetchError,
    averageRating,
    form,
    submitting,
    submitError,
    likeLoading,
    editingId,
    editForm,
    editSaving,
    editError,
    reportModalOpen,
    reportTargetReview,
    reportForm,
    reportError,
    reportSubmitting,
    startEdit,
    cancelEdit,
    isReviewReported,
    openReportModal,
    closeReportModal,
    submitReport,
    saveEdit,
    submitReview,
    hasLiked,
    toggleLike,
  }
}
