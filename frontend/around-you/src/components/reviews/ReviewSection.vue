<template>
  <section aria-label="Anmeldelser">
    <h2 class="mb-6 text-lg font-bold text-[#de5826]">Anmeldelser</h2>

    <ReviewForm
      v-if="isAuthenticated"
      :model-value="form"
      :submitting="submitting"
      :submit-error="submitError"
      @update:model-value="form = $event"
      @submit="submitReview"
    />

    <p v-else class="mb-8 rounded-xl bg-[#C1D2DE]/25 px-5 py-4 text-sm text-slate-500">
      <RouterLink
        to="/auth/login"
        class="font-semibold text-[#094b7b] underline underline-offset-2"
      >
        Log ind
      </RouterLink>
      for at skrive en anmeldelse.
    </p>

    <div v-if="loading" class="text-sm text-slate-400">Henter anmeldelser...</div>

    <p v-else-if="fetchError" class="text-sm text-[#de5826]">
      {{ fetchError }}
    </p>

    <p v-else-if="reviews.length === 0" class="text-sm text-slate-400">
      Ingen anmeldelser endnu. Vær den første!
    </p>

    <ul v-else class="space-y-5">
      <ReviewItem
        v-for="review in reviews"
        :key="review._id"
        :review="review"
        :is-authenticated="isAuthenticated"
        :user-name="userName"
        :is-editing="editingId === review._id"
        :edit-form="editForm"
        :edit-saving="editSaving"
        :edit-error="editError"
        :is-reported="isReviewReported(review._id)"
        :has-liked="hasLiked(review)"
        :like-loading="likeLoading === review._id"
        @start-edit="startEdit(review)"
        @cancel-edit="cancelEdit"
        @save-edit="saveEdit(review._id)"
        @open-report="openReportModal(review)"
        @toggle-like="toggleLike(review)"
        @update:edit-form="editForm = $event"
      />
    </ul>

    <ReportReviewModal
      :open="reportModalOpen"
      :review="reportTargetReview"
      :model-value="reportForm"
      :error="reportError"
      :submitting="reportSubmitting"
      @close="closeReportModal"
      @submit="submitReport"
      @update:model-value="reportForm = $event"
    />
  </section>
</template>

<script setup lang="ts">
import { toRef, watch } from 'vue'
import { RouterLink } from 'vue-router'
import ReportReviewModal from '@/components/reviews/ReportReviewModal.vue'
import ReviewForm from '@/components/reviews/ReviewForm.vue'
import ReviewItem from '@/components/reviews/ReviewItem.vue'
import { useReviewSection } from '@/composables/reviews/useReviewSection'
import { useAuth } from '@/composables/useAuth'
import { type ReviewTargetType } from '@/api/reviews.api'

const props = defineProps<{
  targetId: string
  targetType: ReviewTargetType
}>()

const emit = defineEmits<{
  (e: 'averageRating', value: number | null): void
}>()

const { isAuthenticated, userName } = useAuth()

const {
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
} = useReviewSection({
  targetId: toRef(props, 'targetId'),
  targetType: toRef(props, 'targetType'),
})

watch(averageRating, (val) => emit('averageRating', val), { immediate: true })
</script>
