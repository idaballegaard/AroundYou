import { reactive, watch } from 'vue'
import type { SearchFilters } from '@/types/search'
import { areFiltersEqual } from '@/composables/search-filter/searchFilter.helpers'
import type { SearchFilterEmit, SearchFilterProps } from '@/composables/search-filter/searchFilter.types'

export function useSearchFilterDraft(props: SearchFilterProps, emit: SearchFilterEmit) {
  const draft = reactive<SearchFilters>({
    location: props.modelValue.location,
    types: [...props.modelValue.types],
    date: props.modelValue.date,
    categories: [...props.modelValue.categories],
  })

  let isSyncingFromParent = false

  watch(
    () => props.modelValue,
    (value) => {
      if (areFiltersEqual(draft, value)) return

      isSyncingFromParent = true
      draft.location = value.location
      draft.types = [...value.types]
      draft.date = value.date
      draft.categories = [...value.categories]
      isSyncingFromParent = false
    },
    { deep: true, flush: 'sync' },
  )

  watch(
    draft,
    () => {
      if (isSyncingFromParent) return

      const nextValue = {
        location: draft.location,
        types: [...draft.types],
        date: draft.date,
        categories: [...draft.categories],
      }

      if (!areFiltersEqual(nextValue, props.modelValue)) {
        emit('update:modelValue', nextValue)
      }
    },
    { deep: true },
  )

  return draft
}
