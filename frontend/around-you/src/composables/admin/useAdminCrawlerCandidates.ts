import { onMounted, ref } from 'vue'

import {
  crawlOplevEsbjergEvents,
  fetchNewOplevEsbjergEventCandidates,
  type CrawledEventCandidate,
} from '@/api/crawledEventCandidates.api'

export function useAdminCrawlerCandidates() {
  const candidates = ref<CrawledEventCandidate[]>([])
  const errorMessage = ref('')
  const isCrawling = ref(false)
  const isLoading = ref(false)
  const successMessage = ref('')

  async function loadCandidates(): Promise<void> {
    isLoading.value = true
    errorMessage.value = ''

    try {
      candidates.value = await fetchNewOplevEsbjergEventCandidates()
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
      const result = await crawlOplevEsbjergEvents()
      successMessage.value = `Importen er færdig: ${result.persistence.inserted} nye og ${result.persistence.updated} opdaterede kandidater.`
      await loadCandidates()
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Eventkalenderen kunne ikke hentes.'
    } finally {
      isCrawling.value = false
    }
  }

  onMounted(() => {
    void loadCandidates()
  })

  return {
    candidates,
    errorMessage,
    isCrawling,
    isLoading,
    loadCandidates,
    runCrawler,
    successMessage,
  }
}
