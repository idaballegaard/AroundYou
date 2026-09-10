import { computed, ref } from 'vue'
import type { SearchFilterType, SearchTimeFilter } from '@/types/search'
import {
  formatDisplayDate,
  getCalendarDays,
  isSelectedCalendarDay,
  toDateInputValue,
  weekdayLabels,
} from '@/composables/search-filter/searchFilter.helpers'
import { useSearchFilterDraft } from '@/composables/search-filter/useSearchFilterDraft'
import { useSearchFilterDropdowns } from '@/composables/search-filter/useSearchFilterDropdowns'
import type {
  SearchFilterEmit,
  SearchFilterProps,
} from '@/composables/search-filter/searchFilter.types'

export function useSearchFilter(props: SearchFilterProps, emit: SearchFilterEmit) {
  // SearchFilter is split into draft state, dropdown state, and presentation
  // helpers so the template can stay focused on controls.
  const categoryQuery = ref('')
  const today = new Date()
  const currentMonth = ref(today.getMonth())
  const currentYear = ref(today.getFullYear())
  const locationOptionValues = computed(() => props.locationOptions ?? [])
  const categoryOptionValues = computed(() => props.categoryOptions ?? [])
  const draft = useSearchFilterDraft(props, emit)
  const dropdowns = useSearchFilterDropdowns()

  const selectLocation = (location: string) => {
    draft.location = location
    dropdowns.isLocationOpen.value = false
  }

  const filteredLocationOptions = computed(() => {
    const query = draft.location.trim().toLowerCase()
    const options = locationOptionValues.value

    return query.length ? options.filter((location) => location.toLowerCase().includes(query)) : options
  })

  const filteredCategoryOptions = computed(() => {
    const query = categoryQuery.value.trim().toLowerCase()
    const options = categoryOptionValues.value

    return query.length ? options.filter((category) => category.toLowerCase().includes(query)) : options
  })

  const toggleCategory = (category: string) => {
    draft.categories = draft.categories.includes(category)
      ? draft.categories.filter((item) => item !== category)
      : [...draft.categories, category]
  }

  const removeCategory = (category: string) => {
    draft.categories = draft.categories.filter((item) => item !== category)
  }

  const addCategoryFromQuery = () => {
    // Users can create ad-hoc category filters even when the category is not in
    // the suggested list.
    const query = categoryQuery.value.trim()
    if (!query.length) return

    if (!draft.categories.includes(query)) {
      draft.categories = [...draft.categories, query]
    }

    categoryQuery.value = ''
    dropdowns.isCategoriesOpen.value = false
  }

  const toggleTypeFilter = (type: SearchFilterType) => {
    draft.types = draft.types.includes(type)
      ? draft.types.filter((item) => item !== type)
      : [...draft.types, type]
  }

  const selectTime = (time: SearchTimeFilter) => {
    draft.time = time
    if (time !== 'custom') {
      draft.customTime = ''
    }
    dropdowns.isTimeOpen.value = false
  }

  const typeDotClass = (value: SearchFilterType) => {
    const isActive = draft.types.includes(value)

    return [
      'h-3 w-3 rounded-sm border border-slate-400',
      isActive ? 'bg-slate-700' : 'bg-white',
    ].join(' ')
  }

  const monthLabel = computed(() => {
    const date = new Date(currentYear.value, currentMonth.value, 1)

    return date.toLocaleDateString('da-DK', {
      month: 'long',
      year: 'numeric',
    })
  })

  const calendarDays = computed(() => getCalendarDays(currentYear.value, currentMonth.value))
  const displayDate = computed(() => formatDisplayDate(draft.date))
  const isSelectedDay = (day: number) =>
    isSelectedCalendarDay(draft.date, currentYear.value, currentMonth.value, day)

  const dayButtonClass = (day: number | null) => {
    if (!day) return 'text-transparent'

    return [
      'text-[#1E5A88] hover:bg-[#C1D2DE]',
      isSelectedDay(day) ? 'bg-[#C1D2DE]' : 'bg-transparent',
    ].join(' ')
  }

  const selectDate = (day: number | null) => {
    if (!day) return

    // Store dates in input-compatible yyyy-mm-dd form; display formatting is a
    // separate computed value.
    draft.date = toDateInputValue(currentYear.value, currentMonth.value, day)
    dropdowns.isDateOpen.value = false
  }

  const goToPreviousMonth = () => {
    if (currentMonth.value === 0) {
      currentMonth.value = 11
      currentYear.value -= 1
      return
    }

    currentMonth.value -= 1
  }

  const goToNextMonth = () => {
    if (currentMonth.value === 11) {
      currentMonth.value = 0
      currentYear.value += 1
      return
    }

    currentMonth.value += 1
  }

  const resetFilters = () => {
    draft.location = ''
    draft.types = []
    draft.date = ''
    draft.time = ''
    draft.customTime = ''
    draft.categories = []
    categoryQuery.value = ''
    dropdowns.closeAll()
  }

  return {
    ...dropdowns,
    addCategoryFromQuery,
    calendarDays,
    categoryQuery,
    clearTypeFilters: () => {
      draft.types = []
    },
    dayButtonClass,
    displayDate,
    draft,
    filteredCategoryOptions,
    filteredLocationOptions,
    goToNextMonth,
    goToPreviousMonth,
    monthLabel,
    removeCategory,
    resetFilters,
    selectDate,
    selectLocation,
    selectTime,
    toggleCategory,
    toggleTypeFilter,
    typeDotClass,
    weekdayLabels,
  }
}
