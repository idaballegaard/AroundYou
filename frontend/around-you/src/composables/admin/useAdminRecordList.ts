import { computed, ref, watch } from 'vue'

import type { AdminRecord } from '@/types/admin'

export type AdminRecordTabKey = 'active' | 'hidden'

export const adminRecordTabs: { key: AdminRecordTabKey; label: string }[] = [
  { key: 'active', label: 'Aktive' },
  { key: 'hidden', label: 'Skjulte' },
]

export function useAdminRecordList(
  props: {
    activeRecords: AdminRecord[]
    hiddenRecords: AdminRecord[]
  },
  loadHiddenRecords: () => void,
) {
  const pageSize = 10
  const activeTab = ref<AdminRecordTabKey>('active')
  const displayedRecords = computed(() =>
    activeTab.value === 'hidden' ? props.hiddenRecords : props.activeRecords,
  )
  const currentPage = ref(1)
  const totalPages = computed(() => Math.max(1, Math.ceil(displayedRecords.value.length / pageSize)))
  const paginatedRecords = computed(() => {
    const startIndex = (currentPage.value - 1) * pageSize
    const endIndex = startIndex + pageSize
    return displayedRecords.value.slice(startIndex, endIndex)
  })

  watch(activeTab, (tab) => {
    currentPage.value = 1
    if (tab === 'hidden') {
      loadHiddenRecords()
    }
  })

  watch(
    () => displayedRecords.value.length,
    () => {
      if (currentPage.value > totalPages.value) {
        currentPage.value = totalPages.value
      }
    },
  )

  const pageStart = computed(() => (displayedRecords.value.length ? (currentPage.value - 1) * pageSize + 1 : 0))
  const pageEnd = computed(() => Math.min(currentPage.value * pageSize, displayedRecords.value.length))

  const goToNextPage = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value += 1
    }
  }

  const goToPreviousPage = () => {
    if (currentPage.value > 1) {
      currentPage.value -= 1
    }
  }

  return {
    activeTab,
    displayedRecords,
    currentPage,
    goToNextPage,
    goToPreviousPage,
    pageEnd,
    pageStart,
    paginatedRecords,
    recordTabs: adminRecordTabs,
    totalPages,
  }
}
