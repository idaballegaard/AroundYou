<template>
  <section class="px-3 py-6 sm:px-8 sm:py-12">
    <h2 :class="titleClassName">{{ title }}</h2>
    <p :class="descriptionClassName">{{ description }}</p>

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
  }>(),
  {
    titleClass: 'text-lg leading-tight sm:text-3xl font-extrabold text-[#094b7b] text-center mb-2',
    descriptionClass: 'text-sm leading-6 text-gray-500 text-center max-w-3xl mx-auto mb-6 sm:mb-8',
  },
)

const showCards = computed(() => !props.loading && !props.error && props.cards.length > 0)
const titleClassName = computed(() => props.titleClass)
const descriptionClassName = computed(() => props.descriptionClass)
</script>
