<template>
  <input
    v-model="form.name"
    class="rounded-xl border border-slate-200 px-4 py-3"
    placeholder="By"
  />
  <input
    v-model="form.tagLine"
    class="rounded-xl border border-slate-200 px-4 py-3"
    minlength="20"
    maxlength="100"
    placeholder="Slogan (20-100 tegn)"
  />
  <CreateContentImageField
    :selected-file="heroImageFile"
    @selected="emit('hero-image-selected', $event)"
  />
  <input
    v-model="form.commune"
    class="rounded-xl border border-slate-200 px-4 py-3"
    placeholder="Kommune"
  />
  <input
    v-model="form.region"
    class="rounded-xl border border-slate-200 px-4 py-3"
    placeholder="Region"
  />
  <input
    v-model="form.country"
    class="rounded-xl border border-slate-200 px-4 py-3"
    placeholder="Land"
  />
  <input
    v-model="form.population"
    type="number"
    class="rounded-xl border border-slate-200 px-4 py-3"
    placeholder="Indbyggertal"
  />
  <input
    v-model="form.visitorCenter"
    class="rounded-xl border border-slate-200 px-4 py-3"
    placeholder="Besøgscenter"
  />
  <textarea
    v-model="form.description"
    rows="4"
    class="rounded-xl border border-slate-200 px-4 py-3 sm:col-span-2"
    placeholder="Beskrivelse"
  ></textarea>
</template>

<script setup lang="ts">
import CreateContentImageField from './CreateContentImageField.vue'
import type { CreateCityForm } from '@/types/content/useCreateContent'

defineProps<{
  heroImageFile: File | null
}>()

const emit = defineEmits<{
  'hero-image-selected': [event: Event]
}>()

const form = defineModel<CreateCityForm>({ required: true })
</script>
