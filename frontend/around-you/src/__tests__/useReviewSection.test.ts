import { defineComponent, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useReviewSection } from '@/composables/reviews/useReviewSection'
import type { ReviewItem } from '@/api/reviews.api'

const mocks = vi.hoisted(() => ({
  createReview: vi.fn(),
  deleteReview: vi.fn(),
  getReviewsByTarget: vi.fn(),
  likeReview: vi.fn(),
  reportReview: vi.fn(),
  updateReview: vi.fn(),
}))

vi.mock('@/api/reviews.api', async () => {
  const actual = await vi.importActual<typeof import('@/api/reviews.api')>('@/api/reviews.api')

  return {
    ...actual,
    createReview: mocks.createReview,
    deleteReview: mocks.deleteReview,
    getReviewsByTarget: mocks.getReviewsByTarget,
    likeReview: mocks.likeReview,
    reportReview: mocks.reportReview,
    updateReview: mocks.updateReview,
  }
})

const review: ReviewItem = {
  _id: 'review-1',
  targetId: 'target-1',
  targetType: 'city',
  author: 'another-user',
  title: 'Fin oplevelse',
  description: 'En anmeldelse med problematisk indhold.',
  rating: 4,
  likes: 0,
  likedBy: [],
  edited: false,
  image: '',
  createdAt: '2026-05-08T08:00:00.000Z',
}

const mountReviewHarness = () => {
  let exposed: ReturnType<typeof useReviewSection> | undefined

  const Harness = defineComponent({
    setup() {
      exposed = useReviewSection({
        targetId: ref('target-1'),
        targetType: ref('city'),
      })

      return exposed
    },
    template: '<div />',
  })

  const wrapper = mount(Harness)

  return {
    wrapper,
    get state() {
      if (!exposed) throw new Error('Review harness did not initialize')
      return exposed
    },
  }
}

describe('useReviewSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getReviewsByTarget.mockResolvedValue([{ ...review }])
  })

  it('submits review reports to the backend and marks the review as reported locally', async () => {
    const updatedReview = { ...review, reportCount: 1 }
    mocks.reportReview.mockResolvedValue(updatedReview)

    const { state, wrapper } = mountReviewHarness()
    await nextTick()
    await nextTick()

    state.openReportModal(review)
    state.reportForm.value = {
      reason: 'spam',
      details: 'Reklameindhold',
    }

    await state.submitReport()

    expect(mocks.reportReview).toHaveBeenCalledWith('review-1', 'spam: Reklameindhold')
    expect(state.isReviewReported('review-1')).toBe(true)
    expect(state.reportModalOpen.value).toBe(false)
    expect(state.reviews.value[0]).toEqual(updatedReview)

    wrapper.unmount()
  })

  it('self-deletes a review by hiding it and removing it locally', async () => {
    mocks.deleteReview.mockResolvedValue({ ...review, isHidden: true })

    const { state, wrapper } = mountReviewHarness()
    await nextTick()
    await nextTick()

    await state.deleteOwnReview(review)

    expect(mocks.deleteReview).toHaveBeenCalledWith('review-1')
    expect(state.reviews.value).toEqual([])

    wrapper.unmount()
  })
})
