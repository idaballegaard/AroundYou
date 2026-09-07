<template>
  <section ref="filterRef" class="w-full">
    <button
      type="button"
      class="flex w-full items-center justify-between rounded-full bg-[#C1D2DE] px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm lg:hidden"
      @click="isMobileFilterOpen = !isMobileFilterOpen"
    >
      <span>Filtre</span>
      <span class="text-xs">{{ isMobileFilterOpen ? '▲' : '▼' }}</span>
    </button>

    <div
      :class="[
        'mt-2 rounded-[28px] bg-[#C1D2DE] px-4 py-2 shadow-sm lg:mt-0',
        isMobileFilterOpen ? 'block' : 'hidden lg:block',
      ]"
    >
      <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:gap-3">
        <SearchFilterLocationField
          v-model:location="draft.location"
          :is-open="isLocationOpen"
          :options="filteredLocationOptions"
          @open="openLocation"
          @select="selectLocation"
          @toggle="toggleLocation"
        />

        <div class="hidden h-6 w-px bg-slate-300/70 lg:block" />

        <SearchFilterTypeField
          :is-open="isTypeOpen"
          :type-dot-class="typeDotClass"
          @clear="clearTypeFilters"
          @toggle="toggleType"
          @toggle-type="toggleTypeFilter"
        />

        <div class="hidden h-6 w-px bg-slate-300/70 lg:block" />

        <SearchFilterDateField
          :calendar-days="calendarDays"
          :day-button-class="dayButtonClass"
          :display-date="displayDate"
          :is-open="isDateOpen"
          :month-label="monthLabel"
          :weekday-labels="weekdayLabels"
          @next-month="goToNextMonth"
          @previous-month="goToPreviousMonth"
          @select-date="selectDate"
          @toggle="toggleDate"
        />

        <div class="hidden h-6 w-px bg-slate-300/70 lg:block" />

        <SearchFilterCategoryField
          v-model:query="categoryQuery"
          :is-open="isCategoriesOpen"
          :options="filteredCategoryOptions"
          :selected-categories="draft.categories"
          @add-query="addCategoryFromQuery"
          @open="openCategories"
          @remove-category="removeCategory"
          @toggle="toggleCategories"
          @toggle-category="toggleCategory"
        />

        <button
          type="button"
          class="rounded-full border border-[#094b7b]/25 bg-white px-4 py-1.5 text-sm font-semibold text-[#094b7b] transition hover:border-[#094b7b] hover:bg-[#094b7b] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#094b7b]"
          @click="resetFilters"
        >
          Nulstil filtre
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SearchFilterCategoryField from '@/components/search-filter/SearchFilterCategoryField.vue'
import SearchFilterDateField from '@/components/search-filter/SearchFilterDateField.vue'
import SearchFilterLocationField from '@/components/search-filter/SearchFilterLocationField.vue'
import SearchFilterTypeField from '@/components/search-filter/SearchFilterTypeField.vue'
import { useSearchFilter } from '@/composables/search-filter/useSearchFilter'
import type { SearchFilters } from '@/types/search'

const props = withDefaults(
  defineProps<{
    modelValue: SearchFilters
    locationOptions?: string[]
    categoryOptions?: string[]
  }>(),
  {
    locationOptions: () => [],
    categoryOptions: () => [],
  },
)
const emit = defineEmits<{ (event: 'update:modelValue', value: SearchFilters): void }>()

const {
  addCategoryFromQuery,
  calendarDays,
  categoryQuery,
  clearTypeFilters,
  dayButtonClass,
  displayDate,
  draft,
  filterRef,
  filteredCategoryOptions,
  filteredLocationOptions,
  goToNextMonth,
  goToPreviousMonth,
  isCategoriesOpen,
  isDateOpen,
  isLocationOpen,
  isTypeOpen,
  monthLabel,
  openCategories,
  openLocation,
  removeCategory,
  resetFilters,
  selectDate,
  selectLocation,
  toggleCategories,
  toggleCategory,
  toggleDate,
  toggleLocation,
  toggleType,
  toggleTypeFilter,
  typeDotClass,
  weekdayLabels,
} = useSearchFilter(props, emit)

const isMobileFilterOpen = ref(false)
</script>

<style scoped>
:global(.filter-scroll) {
  scrollbar-color: #074b7b transparent;
  scrollbar-width: thin;
}

:global(.filter-scroll::-webkit-scrollbar) {
  width: 10px;
}

:global(.filter-scroll::-webkit-scrollbar-track) {
  background: transparent;
}

:global(.filter-scroll::-webkit-scrollbar-thumb) {
  background-color: #074b7b;
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: content-box;
}

:global(.filter-scroll::-webkit-scrollbar-button) {
  background-color: #074b7b;
  border-radius: 999px;
  height: 12px;
}
</style>
