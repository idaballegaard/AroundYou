<template>
  <input
    v-model="form.name"
    class="rounded-xl border border-slate-200 px-4 py-3"
    placeholder="Navn"
  />
  <CreateContentImageField
    :selected-file="heroImageFile"
    @selected="emit('hero-image-selected', $event)"
  />
  <input
    v-model="form.price"
    type="number"
    class="rounded-xl border border-slate-200 px-4 py-3"
    placeholder="Pris"
  />
  <input
    v-model="form.link"
    class="rounded-xl border border-slate-200 px-4 py-3"
    placeholder="Link"
  />
  <input
    v-model="form.address"
    class="rounded-xl border border-slate-200 px-4 py-3"
    placeholder="Adresse"
  />
  <input
    v-model="form.city"
    class="rounded-xl border border-slate-200 px-4 py-3"
    placeholder="By"
  />
  <input
    v-model="form.startDate"
    type="date"
    class="rounded-xl border border-slate-200 px-4 py-3"
  />
  <input v-model="form.endDate" type="date" class="rounded-xl border border-slate-200 px-4 py-3" />
  <CreateContentImageListField
    input-id="event-additional-images"
    :files="imageArrayFiles"
    @selected="emit('image-array-selected', $event)"
    @remove="emit('remove-image-array-file', $event)"
  />
  <CategorySlugPicker
    v-model="form.slugArray"
    :options="categoryOptions"
    label="Kategorier"
    placeholder="Søg eller opret kategori"
  />
  <input
    v-model="form.openingHoursText"
    class="rounded-xl border border-slate-200 px-4 py-3"
    placeholder="Åbningstider (adskilt med komma)"
  />
  <label
    class="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600"
  >
    <input v-model="form.isAnnual" type="checkbox" class="h-4 w-4" />
    Årligt event
  </label>
  <textarea
    v-model="form.description"
    rows="4"
    class="rounded-xl border border-slate-200 px-4 py-3 sm:col-span-2"
    placeholder="Beskrivelse"
  ></textarea>
</template>

<script setup lang="ts">
import CategorySlugPicker from '@/components/CategorySlugPicker.vue'
import CreateContentImageField from './CreateContentImageField.vue'
import CreateContentImageListField from './CreateContentImageListField.vue'
import type { CreateEventForm } from '@/types/content/useCreateContent'

defineProps<{
  categoryOptions: string[]
  heroImageFile: File | null
  imageArrayFiles: File[]
}>()

const emit = defineEmits<{
  'hero-image-selected': [event: Event]
  'image-array-selected': [event: Event]
  'remove-image-array-file': [index: number]
}>()

const form = defineModel<CreateEventForm>({ required: true })
</script>
