import { useCreateContentForm } from './useCreateContentForm'
import { useCreateContentImages } from './useCreateContentImages'
import { useCreateContentSubmit } from './useCreateContentSubmit'
import type { ContentType } from '@/types/content'

export const useCreateContent = () => {
  // Facade composable for CreateContentView.vue. It composes form state, image
  // selection, and submit behavior while keeping the view mostly declarative.
  const {
    selectedType,
    message,
    messageType,
    categoryOptions,
    eventForm,
    attractionForm,
    cityForm,
    typeButtonClass,
  } = useCreateContentForm()

  const {
    eventHeroImageFile,
    attractionHeroImageFile,
    cityHeroImageFile,
    eventImageArrayFiles,
    attractionImageArrayFiles,
    onHeroImageSelected: _onHeroImageSelected,
    onImageArraySelected: _onImageArraySelected,
    removeImageArrayFile,
    compressImageFiles,
  } = useCreateContentImages()

  const {
    isSubmitting,
    isUploadingImage,
    submitSelected: _submitSelected,
  } = useCreateContentSubmit(
    selectedType,
    eventForm,
    attractionForm,
    cityForm,
    eventHeroImageFile,
    attractionHeroImageFile,
    cityHeroImageFile,
    eventImageArrayFiles,
    attractionImageArrayFiles,
    compressImageFiles,
  )

  const setMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    // Child composables report errors through this setter so the view has one
    // status message region regardless of which step failed.
    message.value = msg
    messageType.value = type
  }

  const onHeroImageSelected = (contentType: ContentType, event: Event) => {
    _onHeroImageSelected(contentType, event, setMessage)
  }

  const onImageArraySelected = (contentType: 'event' | 'attraction', event: Event) => {
    _onImageArraySelected(contentType, event, setMessage)
  }

  const submitSelected = async () => {
    await _submitSelected(setMessage)
  }

  return {
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
  }
}
