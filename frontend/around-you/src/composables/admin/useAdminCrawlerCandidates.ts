import { computed, onMounted, ref } from 'vue'

import { getGeocodedCoordinates } from '@/api/geocoding.api'
import {
  approveOplevEsbjergEventCandidate,
  crawlOplevEsbjergEvents,
  fetchCrawlerEventSources,
  fetchOplevEsbjergCrawlerStatus,
  fetchOplevEsbjergEventCandidates,
  rejectOplevEsbjergEventCandidate,
  type CrawledEventApprovalPayload,
  type CrawledEventCandidate,
  type CrawledEventCandidateStatus,
  type CrawlerEventSource,
  type OplevEsbjergCrawlerStatus,
} from '@/api/crawledEventCandidates.api'

const danishMonths: Record<string, string> = {
  januar: '01',
  februar: '02',
  marts: '03',
  april: '04',
  maj: '05',
  juni: '06',
  juli: '07',
  august: '08',
  september: '09',
  oktober: '10',
  november: '11',
  december: '12',
}

// Older candidates were imported before date fields were stored. Read the
// original source text as a fallback so their review form remains useful.
function getStartDateFromSourceText(dateText: string): string {
  const dateMatch = dateText.match(
    /(?:d\.\s*)?(\d{1,2})\.\s*(januar|februar|marts|april|maj|juni|juli|august|september|oktober|november|december)\s+(\d{4})/i,
  )
  const timeMatch = dateText.match(/kl\.\s*(\d{1,2})(?:[.:](\d{2}))?/i)

  if (!dateMatch || !timeMatch) return ''

  const day = dateMatch[1]
  const monthName = dateMatch[2]
  const year = dateMatch[3]
  const hour = timeMatch[1]
  const minute = timeMatch[2] ?? '00'

  if (!day || !monthName || !year || !hour) return ''

  const month = danishMonths[monthName.toLowerCase()]
  if (!month) return ''

  return `${year}-${month}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute}`
}

async function geocodeCandidateAddress(address: string): Promise<{
  latitude: number
  longitude: number
  displayName: string
}> {
  try {
    return await getGeocodedCoordinates(null, address)
  } catch {
    // Source addresses may begin with the venue name. Retry the street/city
    // portion so the GPS field can still be filled automatically.
    const addressWithoutVenue = address.split(',').slice(1).join(',').trim()

    if (!addressWithoutVenue) throw new Error('Address could not be geocoded')

    return getGeocodedCoordinates(null, addressWithoutVenue)
  }
}

function createApprovalForm(candidate: CrawledEventCandidate): CrawledEventApprovalPayload {
  return {
    name: candidate.title,
    description: candidate.description,
    heroImage: candidate.imageUrl,
    price: 0,
    link: candidate.sourceUrl,
    address: candidate.addressText,
    city: candidate.locationText,
    gpsPosition: '',
    slugArray: candidate.category ? [candidate.category.toLowerCase()] : [],
    isAnnual: false,
    startDate: candidate.startDate || getStartDateFromSourceText(candidate.dateText),
    endDate: candidate.endDate,
    openingHours: [],
  }
}

export function useAdminCrawlerCandidates() {
  const candidates = ref<CrawledEventCandidate[]>([])
  const crawlerSources = ref<CrawlerEventSource[]>([])
  const selectedSourceId = ref('oplev-esbjerg')
  const selectedSourceLabel = computed(
    () => crawlerSources.value.find((source) => source.id === selectedSourceId.value)?.label ?? 'eventkilden',
  )
  const crawlerStatus = ref<OplevEsbjergCrawlerStatus | null>(null)
  const activeStatus = ref<CrawledEventCandidateStatus>('new')
  const approvalCandidate = ref<CrawledEventCandidate | null>(null)
  const approvalForm = ref<CrawledEventApprovalPayload | null>(null)
  const activeCandidateId = ref('')
  const errorMessage = ref('')
  const isCrawling = ref(false)
  const isGeocoding = ref(false)
  const isLoading = ref(false)
  const successMessage = ref('')
  const statusError = ref('')

  async function loadCrawlerStatus(): Promise<void> {
    statusError.value = ''

    try {
      crawlerStatus.value = await fetchOplevEsbjergCrawlerStatus(selectedSourceId.value)
    } catch (error) {
      statusError.value = error instanceof Error ? error.message : 'Importstatus kunne ikke hentes.'
    }
  }

  async function loadCrawlerSources(): Promise<void> {
    try {
      crawlerSources.value = await fetchCrawlerEventSources()

      if (!crawlerSources.value.some((source) => source.id === selectedSourceId.value)) {
        selectedSourceId.value = crawlerSources.value[0]?.id ?? ''
      }
    } catch {
      // The current default source remains usable if source metadata is
      // temporarily unavailable.
    }
  }

  async function loadCandidates(): Promise<void> {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const [loadedCandidates] = await Promise.all([
        fetchOplevEsbjergEventCandidates(activeStatus.value, selectedSourceId.value),
        loadCrawlerStatus(),
      ])
      candidates.value = loadedCandidates
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Eventkandidaterne kunne ikke hentes.'
    } finally {
      isLoading.value = false
    }
  }

  async function runCrawler(): Promise<void> {
    isCrawling.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      const result = await crawlOplevEsbjergEvents(selectedSourceId.value)
      successMessage.value = `Importen er færdig: ${result.persistence.inserted} nye og ${result.persistence.updated} opdaterede kandidater.`
      await loadCandidates()
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Eventkalenderen kunne ikke hentes.'
    } finally {
      isCrawling.value = false
    }
  }

  async function setActiveStatus(status: CrawledEventCandidateStatus): Promise<void> {
    if (activeStatus.value === status) return

    activeStatus.value = status
    await loadCandidates()
  }

  async function setSelectedSource(sourceId: string): Promise<void> {
    if (!sourceId || sourceId === selectedSourceId.value) return

    selectedSourceId.value = sourceId
    closeApproval()
    await loadCandidates()
  }

  async function openApproval(candidate: CrawledEventCandidate): Promise<void> {
    approvalCandidate.value = candidate
    approvalForm.value = createApprovalForm(candidate)
    errorMessage.value = ''
    successMessage.value = ''

    if (!candidate.locationText.trim()) return

    isGeocoding.value = true
    try {
      // A venue name is often all Kultunaut provides. The existing geocoding
      // endpoint supports this kind of place lookup without a street address.
      const address = candidate.addressText || candidate.locationText
      const location = await geocodeCandidateAddress(address)

      if (approvalCandidate.value?._id === candidate._id && approvalForm.value) {
        approvalForm.value.gpsPosition = `${location.latitude},${location.longitude}`
        approvalForm.value.address = location.displayName
      }
    } catch {
      // A venue can be ambiguous or missing in OpenStreetMap. Keep the form
      // usable and let the admin correct only those exceptions.
    } finally {
      isGeocoding.value = false
    }
  }

  function closeApproval(): void {
    approvalCandidate.value = null
    approvalForm.value = null
  }

  async function approveCandidate(): Promise<void> {
    if (!approvalCandidate.value || !approvalForm.value) return

    activeCandidateId.value = approvalCandidate.value._id
    errorMessage.value = ''

    try {
      await approveOplevEsbjergEventCandidate(
        approvalCandidate.value._id,
        approvalForm.value,
        selectedSourceId.value,
      )
      candidates.value = candidates.value.filter(
        (candidate) => candidate._id !== approvalCandidate.value?._id,
      )
      successMessage.value = 'Eventet er godkendt og er nu synligt for brugerne.'
      closeApproval()
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Eventet kunne ikke godkendes.'
    } finally {
      activeCandidateId.value = ''
    }
  }

  async function rejectCandidate(id: string): Promise<void> {
    const reason = window.prompt('Hvorfor afvises denne eventkandidat?') ?? ''
    activeCandidateId.value = id
    errorMessage.value = ''
    successMessage.value = ''

    try {
      await rejectOplevEsbjergEventCandidate(id, reason, selectedSourceId.value)
      candidates.value = candidates.value.filter((candidate) => candidate._id !== id)
      successMessage.value = 'Eventkandidaten er afvist.'
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Eventkandidaten kunne ikke afvises.'
    } finally {
      activeCandidateId.value = ''
    }
  }

  onMounted(async () => {
    await loadCrawlerSources()
    await loadCandidates()
  })

  return {
    candidates,
    crawlerSources,
    crawlerStatus,
    activeStatus,
    approvalCandidate,
    approvalForm,
    activeCandidateId,
    approveCandidate,
    closeApproval,
    errorMessage,
    isCrawling,
    isGeocoding,
    isLoading,
    loadCandidates,
    openApproval,
    rejectCandidate,
    runCrawler,
    selectedSourceId,
    selectedSourceLabel,
    setSelectedSource,
    statusError,
    setActiveStatus,
    successMessage,
  }
}
