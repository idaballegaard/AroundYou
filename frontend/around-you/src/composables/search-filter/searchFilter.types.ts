import type { SearchFilters } from '@/types/search'

export type SearchFilterProps = {
  modelValue: SearchFilters
  locationOptions?: string[]
  categoryOptions?: string[]
}

export type SearchFilterEmit = (event: 'update:modelValue', value: SearchFilters) => void
