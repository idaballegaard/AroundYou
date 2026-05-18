<template>
  <li class="rounded-2xl border border-[#C1D2DE]/70 bg-white p-6 shadow-sm">
    <div class="mb-3 flex items-start justify-between gap-4">
      <div class="flex items-start gap-3">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#094b7b] to-[#de5826] text-xs font-black text-white"
        >
          <img
            v-if="displayAuthorAvatar"
            :src="displayAuthorAvatar"
            :alt="`${review.author} avatar`"
            class="h-full w-full object-cover"
          />
          <span v-else>{{ authorInitials }}</span>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <p class="text-sm font-semibold text-[#de5826]">{{ review.author }}</p>
            <span
              v-if="review.edited"
              class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400"
            >Redigeret</span>
          </div>
          <p class="text-xs text-slate-400">{{ formatDate(review.createdAt) }}</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex shrink-0 text-[#de5826]">
          <span v-for="star in 5" :key="star" class="text-sm">
            {{ star <= review.rating ? '★' : '☆' }}
          </span>
        </div>
        <button
          v-if="isAuthenticated && review.author !== userName"
          type="button"
          class="text-xs text-slate-400 underline underline-offset-2"
          :class="isReported ? 'cursor-not-allowed text-slate-300' : 'hover:text-[#094b7b]'"
          :disabled="isReported"
          @click="emit('open-report')"
        >
          {{ isReported ? 'Anmeldt' : 'Anmeld' }}
        </button>
        <button
          v-if="review.author === userName"
          type="button"
          class="text-xs text-slate-400 underline underline-offset-2 hover:text-[#094b7b]"
          @click="emit('start-edit')"
        >Rediger</button>
      </div>
    </div>

    <form
      v-if="isEditing"
      class="mb-4 space-y-3 rounded-xl border border-[#C1D2DE]/60 bg-[#f5f7f9] p-4"
      @submit.prevent="emit('save-edit')"
    >
      <div>
        <label :for="`edit-title-${review._id}`" class="mb-1 block text-xs font-medium text-slate-600">Titel</label>
        <input
          :id="`edit-title-${review._id}`"
          :value="editForm.title"
          type="text"
          required
          class="w-full rounded-lg border border-[#C1D2DE] px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#094b7b] focus:ring-2 focus:ring-[#094b7b]/20"
          @input="updateField('title', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div>
        <label :for="`edit-desc-${review._id}`" class="mb-1 block text-xs font-medium text-slate-600">Beskrivelse</label>
        <textarea
          :id="`edit-desc-${review._id}`"
          :value="editForm.description"
          required
          rows="3"
          class="w-full rounded-lg border border-[#C1D2DE] px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#094b7b] focus:ring-2 focus:ring-[#094b7b]/20"
          @input="updateField('description', ($event.target as HTMLTextAreaElement).value)"
        ></textarea>
      </div>
      <div>
        <label class="mb-1 block text-xs font-medium text-slate-600">Bedømmelse</label>
        <div class="flex gap-1">
          <button
            v-for="star in 5"
            :key="star"
            type="button"
            :aria-label="`${star} stjerner`"
            class="text-xl transition-transform hover:scale-110 focus:outline-none"
            :class="star <= editForm.rating ? 'text-[#de5826]' : 'text-slate-300'"
            @click="updateField('rating', star)"
          >★</button>
        </div>
      </div>
      <div>
        <label :for="`edit-image-${review._id}`" class="mb-1 block text-xs font-medium text-slate-600">
          Billede-URL <span class="font-normal text-slate-400">(valgfrit)</span>
        </label>
        <input
          :id="`edit-image-${review._id}`"
          :value="editForm.image"
          type="url"
          placeholder="https://..."
          class="w-full rounded-lg border border-[#C1D2DE] px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#094b7b] focus:ring-2 focus:ring-[#094b7b]/20"
          @input="updateField('image', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <p v-if="editError" class="text-xs text-[#de5826]">{{ editError }}</p>
      <div class="flex gap-2">
        <button
          type="submit"
          :disabled="editSaving"
          class="rounded-full bg-[#094b7b] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#094b7b]/85 disabled:opacity-50"
        >{{ editSaving ? 'Gemmer...' : 'Gem' }}</button>
        <button
          type="button"
          class="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-500 transition hover:border-slate-300"
          @click="emit('cancel-edit')"
        >Annuller</button>
      </div>
    </form>

    <template v-else>
      <h4 class="mb-1 text-base font-semibold text-[#094b7b]">{{ review.title }}</h4>
      <p class="mb-4 text-sm leading-relaxed text-slate-600">{{ review.description }}</p>

      <img
        v-if="review.image"
        :src="resolvedReviewImage"
        :alt="review.title"
        class="mb-4 max-h-64 w-full rounded-xl object-cover"
      />
    </template>

    <button
      type="button"
      :disabled="!isAuthenticated || likeLoading"
      :aria-label="hasLiked ? 'Fjern like' : 'Sæt like'"
      class="flex items-center gap-1.5 text-sm transition focus:outline-none disabled:cursor-not-allowed"
      :class="hasLiked ? 'text-[#de5826]' : 'text-slate-400 hover:text-[#de5826]'"
      @click="emit('toggle-like')"
    >
      <span class="text-base">♥</span>
      <span>{{ review.likes }}</span>
    </button>
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ReviewItem } from '@/api/reviews.api'
import { resolveApiAssetUrl } from '@/constants/config'
import { getUserInitials } from '@/utils/auth'

export type EditReviewFormModel = {
  title: string
  description: string
  rating: number
  image: string
}

const props = defineProps<{
  review: ReviewItem
  isAuthenticated: boolean
  currentUserAvatar: string
  userName: string
  isEditing: boolean
  editForm: EditReviewFormModel
  editSaving: boolean
  editError: string | null
  isReported: boolean
  hasLiked: boolean
  likeLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'start-edit'): void
  (e: 'cancel-edit'): void
  (e: 'save-edit'): void
  (e: 'open-report'): void
  (e: 'toggle-like'): void
  (e: 'update:editForm', value: EditReviewFormModel): void
}>()

const resolvedReviewImage = computed(() => resolveApiAssetUrl(props.review.image))
const displayAuthorAvatar = computed(() => {
  const authorAvatar = props.review.authorAvatar?.trim()

  if (authorAvatar) {
    return resolveApiAssetUrl(authorAvatar)
  }

  return props.review.author === props.userName ? props.currentUserAvatar : ''
})
const authorInitials = computed(() => getUserInitials(props.review.author))

function updateField<K extends keyof EditReviewFormModel>(key: K, value: EditReviewFormModel[K]) {
  emit('update:editForm', {
    ...props.editForm,
    [key]: value,
  })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
</script>
