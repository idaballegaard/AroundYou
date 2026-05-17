import { onMounted, reactive, ref } from 'vue'
import { fetchAttractions, fetchEvents } from '@/api/searchApi'
import type { ContentType } from '@/types/content'
import type {
  CreateAttractionForm,
  CreateCityForm,
  CreateEventForm,
} from '@/types/content/useCreateContent'

export const useCreateContentForm = () => {
  const selectedType = ref<ContentType>('event')
  const message = ref('')
  const messageType = ref<'success' | 'error' | 'info'>('info')
  const categoryOptions = ref<string[]>([])

  const eventForm = reactive<CreateEventForm>({
    name: '',
    description: '',
    price: '',
    link: '',
    address: '',
    city: '',
    slugArray: [] as string[],
    isAnnual: false,
    startDate: '',
    endDate: '',
    openingHoursText: '',
  })

  const attractionForm = reactive<CreateAttractionForm>({
    name: '',
    description: '',
    price: '',
    link: '',
    address: '',
    city: '',
    slugArray: [] as string[],
    openingHoursText: '',
  })

  const cityForm = reactive<CreateCityForm>({
    name: '',
    tagLine: '',
    description: '',
    commune: '',
    region: '',
    country: '',
    population: '',
    visitorCenter: '',
  })

  const typeButtonClass = (value: ContentType) => {
    const isActive = selectedType.value === value
    return isActive
      ? 'bg-[#094b7b] text-white'
      : 'bg-white text-[#094b7b] border border-[#094b7b]/20'
  }

  const fetchCategoryOptions = async () => {
    try {
      const [events, attractions] = await Promise.all([fetchEvents(), fetchAttractions()])
      const unique = new Set(
        [...events, ...attractions]
          .flatMap((item) => item.slugArray ?? [])
          .map((slug) => slug.trim().toLowerCase())
          .filter(Boolean),
      )
      categoryOptions.value = Array.from(unique).sort()
    } catch (error) {
      console.error('Could not fetch category options:', error)
    }
  }

  onMounted(() => {
    void fetchCategoryOptions()
  })

  return {
    selectedType,
    message,
    messageType,
    categoryOptions,
    eventForm,
    attractionForm,
    cityForm,
    typeButtonClass,
  }
}
