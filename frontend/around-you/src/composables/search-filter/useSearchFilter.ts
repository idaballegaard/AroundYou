import { computed, ref } from 'vue'
import type { SearchTimeFilter } from '@/types/search'
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
  const todayDateValue = toDateInputValue(today.getFullYear(), today.getMonth(), today.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowDateValue = toDateInputValue(
    tomorrow.getFullYear(),
    tomorrow.getMonth(),
    tomorrow.getDate(),
  )
  const isDateCalendarOpen = ref(false)
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

  const selectTime = (time: SearchTimeFilter) => {
    draft.time = time
    if (time !== 'custom') {
      draft.customTime = ''
      dropdowns.isTimeOpen.value = false
    }
  }

  const monthLabel = computed(() => {
    const date = new Date(currentYear.value, currentMonth.value, 1)

    return date.toLocaleDateString('da-DK', {
      month: 'long',
      year: 'numeric',
    })
  })

  const calendarDays = computed(() => getCalendarDays(currentYear.value, currentMonth.value))
  const displayDate = computed(() => {
    if (draft.date === todayDateValue) return 'I dag'
    if (draft.date === tomorrowDateValue) return 'I morgen'

    return formatDisplayDate(draft.date)
  })
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
    isDateCalendarOpen.value = false
    dropdowns.isDateOpen.value = false
  }

  const selectRelativeDate = (daysFromToday: number) => {
    const selectedDate = new Date()
    selectedDate.setDate(selectedDate.getDate() + daysFromToday)
    draft.date = toDateInputValue(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
    )
    isDateCalendarOpen.value = false
    dropdowns.isDateOpen.value = false
  }

  const openDateCalendar = () => {
    isDateCalendarOpen.value = true
  }

  const toggleDate = () => {
    dropdowns.toggleDate()
    isDateCalendarOpen.value = false
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
    draft.date = todayDateValue
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
    dayButtonClass,
    displayDate,
    draft,
    filteredCategoryOptions,
    filteredLocationOptions,
    goToNextMonth,
    goToPreviousMonth,
    isDateCalendarOpen,
    monthLabel,
    openDateCalendar,
    removeCategory,
    resetFilters,
    selectDate,
    selectLocation,
    selectRelativeDate,
    selectTime,
    toggleCategory,
    toggleDate,
    weekdayLabels,
  }
}
