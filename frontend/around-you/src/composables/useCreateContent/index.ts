import { useCreateContentForm } from './useCreateContentForm'
import { useCreateContentImages } from './useCreateContentImages'
import { useCreateContentSubmit } from './useCreateContentSubmit'
import type { ContentType } from '@/types/content'

export const useCreateContent = () => {
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
