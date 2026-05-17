import { onBeforeUnmount, onMounted, ref } from 'vue'

export function useSearchFilterDropdowns() {
  const isLocationOpen = ref(false)
  const isTypeOpen = ref(false)
  const isDateOpen = ref(false)
  const isCategoriesOpen = ref(false)
  const filterRef = ref<HTMLElement | null>(null)

  const closeAll = () => {
    isLocationOpen.value = false
    isTypeOpen.value = false
    isDateOpen.value = false
    isCategoriesOpen.value = false
  }

  const toggleOpenState = (openState: typeof isLocationOpen) => {
    const next = !openState.value
    closeAll()
    openState.value = next
  }

  const handleOutsideClick = (event: MouseEvent) => {
    const target = event.target as Node | null

    if (filterRef.value && target && !filterRef.value.contains(target)) {
      closeAll()
    }
  }

  onMounted(() => {
    document.addEventListener('mousedown', handleOutsideClick)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('mousedown', handleOutsideClick)
  })

  return {
    closeAll,
    filterRef,
    isCategoriesOpen,
    isDateOpen,
    isLocationOpen,
    isTypeOpen,
    openCategories: () => {
      closeAll()
      isCategoriesOpen.value = true
    },
    openLocation: () => {
      closeAll()
      isLocationOpen.value = true
    },
    toggleCategories: () => toggleOpenState(isCategoriesOpen),
    toggleDate: () => toggleOpenState(isDateOpen),
    toggleLocation: () => toggleOpenState(isLocationOpen),
    toggleType: () => toggleOpenState(isTypeOpen),
  }
}
