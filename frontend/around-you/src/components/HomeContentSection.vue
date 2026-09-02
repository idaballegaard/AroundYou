<template>
  <section :class="sectionClassName">
    <div v-if="layout === 'timeline'" class="mb-4 flex items-start justify-between gap-3 sm:mb-5">
      <div class="flex min-w-0 items-start gap-3">
        <span
          v-if="icon"
          :class="iconClassName"
          aria-hidden="true"
        ></span>
        <div class="min-w-0">
          <h2 :class="titleClassName">{{ title }}</h2>
          <p :class="descriptionClassName">{{ description }}</p>
        </div>
      </div>

      <RouterLink
        v-if="showAllTo"
        :to="showAllTo"
        class="mt-1 shrink-0 text-xs font-bold text-[#094b7b] transition hover:text-[#de5826] sm:text-sm"
      >
        Se alle <span aria-hidden="true">›</span>
      </RouterLink>
    </div>

    <template v-else>
      <h2 :class="titleClassName">{{ title }}</h2>
      <p :class="descriptionClassName">{{ description }}</p>
    </template>

    <p v-if="loading" class="mb-6 text-center text-sm text-gray-500 sm:mb-8">
      {{ loadingText }}
    </p>

    <p v-else-if="error" class="mb-6 text-center text-sm text-red-600 sm:mb-8">
      {{ error }}
    </p>

    <p v-else-if="!cards.length" class="mb-6 text-center text-sm text-gray-500 sm:mb-8">
      {{ emptyText }}
    </p>

    <div v-if="showCards" class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      <CardComponent v-for="card in cards" :key="card.id" :card="card" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import CardComponent from '@/components/CardComponent.vue'
import type { ExperienceCard as ExperienceCardData } from '@/types/experience-card'

const props = withDefaults(
  defineProps<{
    title: string
    description: string
    loadingText: string
    emptyText: string
    cards: ExperienceCardData[]
    loading: boolean
    error: string | null
    titleClass?: string
    descriptionClass?: string
    layout?: 'default' | 'timeline'
    icon?: string
    iconClass?: string
    showAllTo?: string
  }>(),
  {
    titleClass: 'text-lg leading-tight sm:text-3xl font-extrabold text-[#094b7b] text-center mb-2',
    descriptionClass: 'text-sm leading-6 text-gray-500 text-center max-w-3xl mx-auto mb-6 sm:mb-8',
    layout: 'default',
    icon: '',
    iconClass: '',
    showAllTo: '',
  },
)

const showCards = computed(() => !props.loading && !props.error && props.cards.length > 0)
const titleClassName = computed(() => props.titleClass)
const descriptionClassName = computed(() => props.descriptionClass)
const sectionClassName = computed(() =>
  props.layout === 'timeline'
    ? 'rounded-2xl bg-[#f7f9fb] p-4 sm:p-5'
    : 'px-3 py-6 sm:px-8 sm:py-12',
)
const iconClassName = computed(() => [
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-white shadow-sm sm:h-10 sm:w-10',
  props.iconClass || 'bg-[#094b7b]',
])
</script>
