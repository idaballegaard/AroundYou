<template>
  <component :is="card.href ? RouterLink : 'div'" :to="card.href" :class="cardClass">
    <div class="h-28 w-full shrink-0 bg-[#C1D2DE]/35 sm:h-40">
      <img
        v-if="resolvedImage && !imageFailed"
        :src="resolvedImage"
        :alt="card.name"
        :class="imageClass"
        @error="imageFailed = true"
      />
      <div v-else :class="fallbackClass">
        <span class="text-sm font-semibold text-[#094b7b]/70">{{ card.name }}</span>
      </div>
    </div>

    <div class="min-w-0 p-2.5 sm:p-3">
      <h6 class="line-clamp-2 break-words text-sm leading-snug text-[#094b7b]">{{ card.name }}</h6>
      <p :class="descriptionClass">{{ card.description }}</p>

      <div class="mt-1 flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5">
        <span class="text-xs font-bold text-gray-800">{{ displayRating.toFixed(1) }}</span>
        <div class="flex text-[#de5826]">
          <span v-for="starIndex in 5" :key="starIndex" class="text-xs">
            {{
              starIndex <= Math.floor(displayRating)
                ? '★'
                : starIndex - displayRating < 1
                  ? '★'
                  : '☆'
            }}
          </span>
        </div>
        <span v-if="card.metaText" :class="metaClass">{{ card.metaText }}</span>
        <span v-else :class="metaClass">({{ displayReviewsCount.toLocaleString() }})</span>
      </div>

      <div class="mt-2 flex min-w-0 flex-wrap gap-1">
        <span v-for="tag in card.tags" :key="tag" :class="tagClass">
          {{ tag }}
        </span>
      </div>
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { getReviewsByTarget } from '@/api/reviews.api'
import {
  getCardComponentClass,
  getCardComponentDescriptionClass,
  getCardComponentFallbackClass,
  getCardComponentImageClass,
  getCardComponentMetaClass,
  getCardComponentTagClass,
  type CardComponentItem,
  type CardComponentSurface,
  type CardComponentVariant,
} from '@/components/cardComponent.helpers'
import { resolveApiAssetUrl } from '@/constants/config'

const props = withDefaults(
  defineProps<{
    card: CardComponentItem
    variant?: CardComponentVariant
    surface?: CardComponentSurface
  }>(),
  {
    variant: 'default',
    surface: 'white',
  },
)

type ReviewSummary = {
  rating: number
  reviews: number
}

const reviewSummaryCache = new Map<string, ReviewSummary>()
const pendingReviewSummaryCache = new Map<string, Promise<ReviewSummary>>()

const isReviewBackedCard = (href?: string) => {
  if (!href) {
    return false
  }

  return href.startsWith('/city/') || href.startsWith('/event/') || href.startsWith('/attraction/')
}

const getReviewSummary = async (targetId: string): Promise<ReviewSummary> => {
  const cachedSummary = reviewSummaryCache.get(targetId)

  if (cachedSummary) {
    return cachedSummary
  }

  const pendingSummary = pendingReviewSummaryCache.get(targetId)

  if (pendingSummary) {
    return pendingSummary
  }

  const summaryPromise = getReviewsByTarget(targetId)
    .then((reviews) => {
      const summary: ReviewSummary = {
        rating: reviews.length
          ? reviews.reduce((accumulator, review) => accumulator + review.rating, 0) / reviews.length
          : Number.NaN,
        reviews: reviews.length,
      }

      reviewSummaryCache.set(targetId, summary)
      return summary
    })
    .finally(() => {
      pendingReviewSummaryCache.delete(targetId)
    })

  pendingReviewSummaryCache.set(targetId, summaryPromise)

  return summaryPromise
}

const imageFailed = ref(false)
const displayRating = ref(0)
const displayReviewsCount = ref(0)

const cardClass = computed(() => getCardComponentClass(props.variant, props.surface))
const imageClass = computed(() => getCardComponentImageClass())
const fallbackClass = computed(() => getCardComponentFallbackClass())
const descriptionClass = computed(() => getCardComponentDescriptionClass(props.surface))
const metaClass = computed(() => getCardComponentMetaClass(props.surface))
const tagClass = computed(() => getCardComponentTagClass(props.surface))
const resolvedImage = computed(() => resolveApiAssetUrl(props.card.image))

watch(
  () => props.card.image,
  () => {
    imageFailed.value = false
  },
)

watch(
  () => ({
    id: props.card.id,
    href: props.card.href,
    rating: props.card.rating,
    reviews: props.card.reviews,
  }),
  async (card) => {
    displayRating.value = card.rating
    displayReviewsCount.value = card.reviews

    if (!isReviewBackedCard(card.href)) {
      return
    }

    try {
      const summary = await getReviewSummary(card.id)
      if (summary.reviews > 0 && Number.isFinite(summary.rating)) {
        displayRating.value = summary.rating
        displayReviewsCount.value = summary.reviews
      }
    } catch {
      // keep fallback values from card payload
    }
  },
  { immediate: true },
)
</script>
