import { computed, ref } from 'vue'
import {
  approveAdminSuggestion,
  createAdminRecord,
  deleteAdminRecord,
  fetchAdminCollection,
  fetchAdminSuggestions,
  rejectAdminSuggestion,
  restoreAdminRecord,
  updateAdminRecord,
} from '@/api/admin.api'
import type { AdminCollectionConfig, AdminEditableRecord, AdminRecord } from '@/types/admin'
import type { ContentSuggestion } from '@/types/content-suggestion'
import {
  cloneAdminRecord,
  toEditableAdminRecord,
  withResolvedGpsPosition,
} from './adminCollection.helpers'

export function useAdminCollection(config: AdminCollectionConfig) {
  // Owns one admin tab's data lifecycle: active records, hidden records,
  // pending suggestions, and the create/edit form for the configured collection.
  const activeRecords = ref<AdminRecord[]>([])
  const hiddenRecords = ref<AdminRecord[]>([])
  const suggestions = ref<ContentSuggestion[]>([])
  const form = ref<AdminEditableRecord>(cloneAdminRecord(config.emptyRecord))
  const editingId = ref<string | null>(null)
  const isLoading = ref(false)
  const isHiddenLoading = ref(false)
  const isSaving = ref(false)
  const activeSuggestionId = ref('')
  const errorMessage = ref('')

  const selectedRecord = computed(() =>
    editingId.value
      ? [...activeRecords.value, ...hiddenRecords.value].find(
          (record) => record._id === editingId.value,
        )
      : null,
  )

  async function load(): Promise<void> {
    // Initial tab load combines canonical records and pending suggestions so
    // moderators can act without switching screens.
    isLoading.value = true
    errorMessage.value = ''

    try {
      const [collectionRecords, pendingSuggestions] = await Promise.all([
        fetchAdminCollection(config.key, 'active'),
        fetchAdminSuggestions('pending'),
      ])
      activeRecords.value = collectionRecords
      suggestions.value = pendingSuggestions.filter(
        (suggestion) => suggestion.type === config.pendingType,
      )
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Kunne ikke hente admindata.'
    } finally {
      isLoading.value = false
    }
  }

  async function loadHiddenRecords(): Promise<void> {
    isHiddenLoading.value = true
    errorMessage.value = ''

    try {
      hiddenRecords.value = await fetchAdminCollection(config.key, 'hidden')
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Kunne ikke hente skjulte poster.'
    } finally {
      isHiddenLoading.value = false
    }
  }

  function resetForm(): void {
    editingId.value = null
    form.value = cloneAdminRecord(config.emptyRecord)
  }

  function editRecord(record: AdminRecord): void {
    editingId.value = record._id
    form.value = toEditableAdminRecord(record, config.fields)
  }

  async function saveRecord(): Promise<void> {
    isSaving.value = true
    errorMessage.value = ''

    try {
      // Geocoding happens immediately before mutation because both admin create
      // and edit paths need the same backend payload shape.
      if (editingId.value) {
        const payload = await withResolvedGpsPosition(config.key, form.value)
        const updated = await updateAdminRecord(config.key, editingId.value, payload)
        if (updated.isHidden) {
          hiddenRecords.value = hiddenRecords.value.map((record) =>
            record._id === updated._id ? updated : record,
          )
        } else {
          activeRecords.value = activeRecords.value.map((record) =>
            record._id === updated._id ? updated : record,
          )
        }
      } else {
        const payload = await withResolvedGpsPosition(config.key, form.value)
        const created = await createAdminRecord(config.key, payload)
        activeRecords.value = [created, ...activeRecords.value]
      }

      resetForm()
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Kunne ikke gemme posten.'
    } finally {
      isSaving.value = false
    }
  }

  async function removeRecord(id: string): Promise<void> {
    const confirmed = window.confirm('Vil du skjule denne post? Handlingen afgøres af backend.')
    if (!confirmed) return

    errorMessage.value = ''

    try {
      const hidden = await deleteAdminRecord(config.key, id)
      activeRecords.value = activeRecords.value.filter((record) => record._id !== hidden._id)
      hiddenRecords.value = [
        hidden,
        ...hiddenRecords.value.filter((record) => record._id !== hidden._id),
      ]
      if (editingId.value === id) {
        resetForm()
      }
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Kunne ikke skjule posten.'
    }
  }

  async function restoreRecord(id: string): Promise<void> {
    errorMessage.value = ''

    try {
      const restored = await restoreAdminRecord(config.key, id)
      hiddenRecords.value = hiddenRecords.value.filter((record) => record._id !== restored._id)
      activeRecords.value = [
        restored,
        ...activeRecords.value.filter((record) => record._id !== restored._id),
      ]
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Kunne ikke gendanne posten.'
    }
  }

  async function approveSuggestion(id: string): Promise<void> {
    activeSuggestionId.value = id
    errorMessage.value = ''

    try {
      await approveAdminSuggestion(id)
      suggestions.value = suggestions.value.filter((suggestion) => suggestion._id !== id)
      // Approval creates canonical content on the backend; reload active records
      // to pick up server-side defaults and generated fields.
      activeRecords.value = await fetchAdminCollection(config.key, 'active')
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Kunne ikke godkende forslaget.'
    } finally {
      activeSuggestionId.value = ''
    }
  }

  async function rejectSuggestion(id: string): Promise<void> {
    const reason = window.prompt('Hvorfor afvises dette forslag?') ?? ''
    activeSuggestionId.value = id
    errorMessage.value = ''

    try {
      await rejectAdminSuggestion(id, reason)
      suggestions.value = suggestions.value.filter((suggestion) => suggestion._id !== id)
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Kunne ikke afvise forslaget.'
    } finally {
      activeSuggestionId.value = ''
    }
  }

  return {
    activeRecords,
    hiddenRecords,
    suggestions,
    form,
    editingId,
    selectedRecord,
    isLoading,
    isHiddenLoading,
    isSaving,
    activeSuggestionId,
    errorMessage,
    load,
    loadHiddenRecords,
    resetForm,
    editRecord,
    saveRecord,
    removeRecord,
    restoreRecord,
    approveSuggestion,
    rejectSuggestion,
  }
}
