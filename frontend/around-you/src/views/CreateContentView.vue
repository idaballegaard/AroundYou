<template>
  <main
    class="min-h-screen relative bg-cover bg-center bg-no-repeat py-4 sm:py-[50px]"
    style="background-image: url('/danmarkskort_1800x1280.jpg')"
  >
    <div class="pointer-events-none absolute inset-0 bg-[#e8c7aa]/55" />

    <div class="relative z-10 mx-4 sm:mx-[50px] bg-white shadow-2xl rounded-xl overflow-hidden">
      <section class="bg-[#094b7b] px-8 py-8">
        <h1 class="text-4xl font-black tracking-tight text-white">Del din oplevelse med andre</h1>
        <p class="mt-2 text-base text-white">
          Tilføj nye byer, arrangementer eller attraktioner og vær med til at inspirere andre brugere
        </p>
      </section>

      <div class="px-8 py-10">
        <CreateContentTypeTabs v-model="selectedType" :type-button-class="typeButtonClass" />

        <CreateContentStatusMessage
          ref="messageElement"
          :message="message"
          :message-type="messageType"
        />

        <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="handleSubmit">
          <CreateContentEventForm
            v-if="selectedType === 'event'"
            v-model="eventForm"
            :category-options="categoryOptions"
            :hero-image-file="eventHeroImageFile"
            :image-array-files="eventImageArrayFiles"
            @hero-image-selected="(event) => onHeroImageSelected('event', event)"
            @image-array-selected="(event) => onImageArraySelected('event', event)"
            @remove-image-array-file="(index) => removeImageArrayFile('event', index)"
          />

          <CreateContentAttractionForm
            v-if="selectedType === 'attraction'"
            v-model="attractionForm"
            :category-options="categoryOptions"
            :hero-image-file="attractionHeroImageFile"
            :image-array-files="attractionImageArrayFiles"
            @hero-image-selected="(event) => onHeroImageSelected('attraction', event)"
            @image-array-selected="(event) => onImageArraySelected('attraction', event)"
            @remove-image-array-file="(index) => removeImageArrayFile('attraction', index)"
          />

          <CreateContentCityForm
            v-if="selectedType === 'city'"
            v-model="cityForm"
            :hero-image-file="cityHeroImageFile"
            @hero-image-selected="(event) => onHeroImageSelected('city', event)"
          />

          <button
            type="submit"
            class="rounded-full bg-[#094b7b] px-6 py-3 text-sm font-semibold text-white sm:col-span-2"
            :disabled="isSubmitting || isUploadingImage"
          >
            {{ isUploadingImage ? 'Uploader billede...' : submitButtonLabel }}
          </button>
        </form>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import CreateContentAttractionForm from '@/components/create-content/CreateContentAttractionForm.vue'
import CreateContentCityForm from '@/components/create-content/CreateContentCityForm.vue'
import CreateContentEventForm from '@/components/create-content/CreateContentEventForm.vue'
import CreateContentStatusMessage from '@/components/create-content/CreateContentStatusMessage.vue'
import CreateContentTypeTabs from '@/components/create-content/CreateContentTypeTabs.vue'
import { useCreateContent } from '@/composables/useCreateContent'
import { computed, nextTick, ref } from 'vue'

const {
  selectedType,
  isSubmitting,
  isUploadingImage,
  message,
  messageType,
  eventHeroImageFile,
  attractionHeroImageFile,
  cityHeroImageFile,
  eventImageArrayFiles,
  attractionImageArrayFiles,
  categoryOptions,
  eventForm,
  attractionForm,
  cityForm,
  onHeroImageSelected,
  onImageArraySelected,
  removeImageArrayFile,
  submitSelected,
  typeButtonClass,
} = useCreateContent()

const messageElement = ref<InstanceType<typeof CreateContentStatusMessage> | null>(null)

const submitButtonLabel = computed(() => {
  if (selectedType.value === 'event') {
    return 'Gem arrangement'
  }

  if (selectedType.value === 'attraction') {
    return 'Gem attraktion'
  }

  return 'Gem by'
})

const handleSubmit = async () => {
  await submitSelected()

  if (messageType.value !== 'error') {
    return
  }

  await nextTick()
  messageElement.value?.scrollIntoView()
}
</script>
