<template>
  <section class="grid min-w-0 gap-4 sm:gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
    <div ref="formPanel" class="min-w-0">
      <AdminRecordForm
        v-model="form"
        :config="config"
        :error-message="errorMessage"
        :is-editing="editingId !== null"
        :is-saving="isSaving"
        @reset="resetForm"
        @save="saveRecord"
      />
    </div>

    <div class="grid min-w-0 gap-4 sm:gap-6">
      <AdminSuggestionQueue
        :config="config"
        :suggestions="suggestions"
        :is-loading="isLoading"
        :active-suggestion-id="activeSuggestionId"
        @refresh="load"
        @approve="approveSuggestion"
        @reject="rejectSuggestion"
      />

      <AdminRecordList
        :active-records="activeRecords"
        :hidden-records="hiddenRecords"
        :is-hidden-loading="isHiddenLoading"
        @edit="handleEditRecord"
        @hide="removeRecord"
        @restore="restoreRecord"
        @load-hidden="loadHiddenRecords"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import AdminRecordForm from '@/components/admin/AdminRecordForm.vue'
import AdminRecordList from '@/components/admin/AdminRecordList.vue'
import AdminSuggestionQueue from '@/components/admin/AdminSuggestionQueue.vue'
import { useAdminCollection } from '@/composables/admin/useAdminCollection'
import type { AdminCollectionConfig, AdminRecord } from '@/types/admin'

const props = defineProps<{
  config: AdminCollectionConfig
}>()

const {
  activeRecords,
  hiddenRecords,
  suggestions,
  form,
  editingId,
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
} = useAdminCollection(props.config)

const formPanel = ref<HTMLElement | null>(null)

async function handleEditRecord(record: AdminRecord): Promise<void> {
  editRecord(record)
  await nextTick()
  formPanel.value?.scrollIntoView({ block: 'start', behavior: 'smooth' })
}

onMounted(() => {
  void load()
})
</script>
