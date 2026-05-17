<template>
  <aside class="rounded-lg border border-slate-200 bg-white p-5">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h6 class="text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-[#de5826]">
          {{ config.label }}
        </h6>
        <h2 class="mt-2 text-xl font-black text-[#094b7b]">
          {{ isEditing ? 'Rediger post' : 'Opret post' }}
        </h2>
      </div>
      <button
        class="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold"
        @click="$emit('reset')"
      >
        Ny
      </button>
    </div>

    <form class="mt-5 grid gap-4" @submit.prevent="$emit('save')">
      <label
        v-for="field in config.fields"
        :key="field.key"
        class="grid gap-1.5 text-sm font-bold text-slate-700"
      >
        {{ field.label }}
        <div v-if="field.type === 'image'" class="grid gap-2">
          <input
            class="block w-full text-sm text-slate-700 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#094b7b] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            :required="field.required && !stringField(field.key)"
            :disabled="isFieldUploading(field.key)"
            @change="uploadSingleImage(field.key, $event)"
          />
          <img
            v-if="stringField(field.key)"
            :src="resolveApiAssetUrl(stringField(field.key))"
            :alt="field.label"
            class="h-28 w-full rounded-md border border-slate-200 object-cover"
          />
          <button
            v-if="stringField(field.key)"
            type="button"
            class="justify-self-start text-xs font-bold text-rose-700"
            @click="setStringField(field.key, '')"
          >
            Fjern billede
          </button>
        </div>
        <div v-else-if="field.type === 'image-list'" class="grid gap-2">
          <input
            class="block w-full text-sm text-slate-700 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#094b7b] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            type="file"
            multiple
            accept="image/png,image/jpeg,image/jpg,image/webp"
            :disabled="isFieldUploading(field.key)"
            @change="uploadImageList(field.key, $event)"
          />
          <div v-if="arrayField(field.key).length" class="grid grid-cols-2 gap-2">
            <div
              v-for="(image, index) in arrayField(field.key)"
              :key="`${image}-${index}`"
              class="grid gap-1"
            >
              <img
                :src="resolveApiAssetUrl(image)"
                :alt="`${field.label} ${index + 1}`"
                class="h-20 w-full rounded-md border border-slate-200 object-cover"
              />
              <button
                type="button"
                class="justify-self-start text-xs font-bold text-rose-700"
                @click="removeImageFromList(field.key, index)"
              >
                Fjern
              </button>
            </div>
          </div>
        </div>
        <div v-else-if="field.type === 'slug-picker'">
          <CategorySlugPicker
            :model-value="arrayField(field.key)"
            :options="categoryOptions"
            :label="field.label"
            placeholder="Søg eller opret kategori"
            @update:model-value="setArrayField(field.key, $event)"
          />
        </div>
        <textarea
          v-else-if="field.type === 'textarea'"
          class="min-h-28 rounded-md border border-slate-300 px-3 py-2 font-normal"
          :required="field.required"
          :value="stringField(field.key)"
          @input="setStringField(field.key, ($event.target as HTMLTextAreaElement).value)"
        />
        <input
          v-else-if="field.type === 'number'"
          class="rounded-md border border-slate-300 px-3 py-2 font-normal"
          type="number"
          :required="field.required"
          :value="numberField(field.key)"
          @input="setNumberField(field.key, ($event.target as HTMLInputElement).value)"
        />
        <input
          v-else-if="field.type === 'checkbox'"
          class="h-5 w-5 rounded border-slate-300"
          type="checkbox"
          :checked="booleanField(field.key)"
          @change="setBooleanField(field.key, ($event.target as HTMLInputElement).checked)"
        />
        <input
          v-else-if="field.type === 'date'"
          class="rounded-md border border-slate-300 px-3 py-2 font-normal"
          type="datetime-local"
          :required="field.required"
          :value="dateField(field.key)"
          @input="setStringField(field.key, ($event.target as HTMLInputElement).value)"
        />
        <input
          v-else
          class="rounded-md border border-slate-300 px-3 py-2 font-normal"
          :required="field.required"
          :value="field.type === 'tags' ? tagsField(field.key) : stringField(field.key)"
          @input="
            setTextLikeField(field.key, field.type, ($event.target as HTMLInputElement).value)
          "
        />
        <span v-if="isFieldUploading(field.key)" class="text-xs font-bold text-[#094b7b]">
          Uploader billede...
        </span>
      </label>

      <p
        v-if="displayErrorMessage"
        class="rounded-md bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700"
      >
        {{ displayErrorMessage }}
      </p>

      <button
        class="rounded-md bg-[#094b7b] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
        :disabled="isSaving || isUploading"
      >
        {{ isSaving || isUploading ? 'Gemmer...' : isEditing ? 'Opdater' : 'Opret' }}
      </button>
    </form>
  </aside>
</template>

<script setup lang="ts">
import { toRefs } from 'vue'
import CategorySlugPicker from '@/components/CategorySlugPicker.vue'
import { useAdminRecordForm } from '@/composables/admin/useAdminRecordForm'
import { resolveApiAssetUrl } from '@/constants/config'
import type { AdminCollectionConfig, AdminEditableRecord } from '@/types/admin'

const props = defineProps<{
  config: AdminCollectionConfig
  errorMessage: string
  isEditing: boolean
  isSaving: boolean
}>()

defineEmits<{
  reset: []
  save: []
}>()

const form = defineModel<AdminEditableRecord>({ required: true })
const { errorMessage } = toRefs(props)

const {
  arrayField,
  booleanField,
  categoryOptions,
  dateField,
  displayErrorMessage,
  isFieldUploading,
  isUploading,
  numberField,
  removeImageFromList,
  setArrayField,
  setBooleanField,
  setNumberField,
  setStringField,
  setTextLikeField,
  stringField,
  tagsField,
  uploadImageList,
  uploadSingleImage,
} = useAdminRecordForm(form, errorMessage)
</script>
