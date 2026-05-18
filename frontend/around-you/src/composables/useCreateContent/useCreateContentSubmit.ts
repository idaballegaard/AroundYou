import { ref } from 'vue'
import { getAuthToken } from '@/api/authSession'
import { createAttraction, createCity, createEvent, uploadImageFile } from '@/api/contentApi'
import { createContentSuggestion } from '@/api/contentSuggestions.api'
import { useAuthService } from '@/api/authService'
import { getGeocodedCoordinates } from '@/api/geocoding.api'
import type { AttractionPayload, CityPayload, EventPayload } from '@/types/content'
import type { ContentSuggestionPayload, ContentSuggestionType } from '@/types/content-suggestion'
import type {
  CreateAttractionForm,
  CreateCityForm,
  CreateContentFileArrayRef,
  CreateContentFileRef,
  CreateContentFormType,
  CreateContentMessageStateSetter,
  CreateEventForm,
} from '@/types/content/useCreateContent'
import { compressImageFile } from '@/utils/imageCompressor'
import {
  normalizeDateRange,
  normalizeNonNegativeNumber,
  normalizeStringArray,
  normalizeText,
} from '@/utils/validators'

const splitList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

type ContentSubmissionDestination = 'created' | 'suggested'

const resolveGpsPosition = async (address: string, city: string) => {
  // Events and attractions are entered with address/city fields but stored with
  // gpsPosition so maps can render without geocoding on every page load.
  if (!address.trim() || !city.trim()) {
    throw new Error('Indtast både adresse og by.')
  }

  const location = await getGeocodedCoordinates(address.trim(), city.trim())
  return `${location.latitude},${location.longitude}`
}

const resolveCityGpsPosition = async (city: string) => {
  // Cities are geocoded by name because the create flow does not ask for a
  // street address.
  if (!city.trim()) {
    throw new Error('Indtast en by.')
  }

  const location = await getGeocodedCoordinates(null, city.trim())
  return `${location.latitude},${location.longitude}`
}

export const validateCityForm = (cityForm: Pick<CreateCityForm, 'tagLine'>) => {
  // Keep tagline validation local to the city branch because event and
  // attraction submissions do not share this field.
  const tagLine = cityForm.tagLine.trim()

  if (!tagLine) {
    throw new Error('Indtast en tagline til byen.')
  }

  if (tagLine.length < 20 || tagLine.length > 100) {
    throw new Error('Byens tagline skal være mellem 20 og 100 tegn.')
  }
}

export const useCreateContentSubmit = (
  selectedType: CreateContentFormType,
  eventForm: CreateEventForm,
  attractionForm: CreateAttractionForm,
  cityForm: CreateCityForm,
  eventHeroImageFile: CreateContentFileRef,
  attractionHeroImageFile: CreateContentFileRef,
  cityHeroImageFile: CreateContentFileRef,
  eventImageArrayFiles: CreateContentFileArrayRef,
  attractionImageArrayFiles: CreateContentFileArrayRef,
  compressImageFiles: (files: File[]) => Promise<File[]>,
) => {
  // The submit composable owns all backend-facing transformations: validation,
  // image compression/upload, geocoding, and role-based destination choice.
  const isSubmitting = ref(false)
  const isUploadingImage = ref(false)
  const { currentUser, isAdmin } = useAuthService()

  const submitContentByRole = async (
    type: ContentSuggestionType,
    payload: ContentSuggestionPayload,
    token: string | null,
  ): Promise<ContentSubmissionDestination> => {
    // Admin users write directly to canonical collections. Regular users submit
    // suggestions so admins can review before publishing.
    if (currentUser.value?.role === 'admin' || isAdmin.value) {
      if (type === 'event') {
        await createEvent(payload as EventPayload, token)
      } else if (type === 'attraction') {
        await createAttraction(payload as AttractionPayload, token)
      } else {
        await createCity(payload as CityPayload, token)
      }

      return 'created'
    }

    await createContentSuggestion(type, payload)
    return 'suggested'
  }

  const submitEvent = async (): Promise<ContentSubmissionDestination> => {
    if (!eventHeroImageFile.value) {
      throw new Error('Upload et billede til dette arrangement.')
    }

    const token = getAuthToken()
    const gpsPosition = await resolveGpsPosition(eventForm.address, eventForm.city)
    const dates = normalizeDateRange(eventForm.startDate, eventForm.endDate)

    isUploadingImage.value = true

    // Upload the hero and optional gallery images before building the payload,
    // because the backend expects persisted image URLs rather than File objects.
    const compressedHeroImage = await compressImageFile(eventHeroImageFile.value)
    const compressedImageArray = await compressImageFiles(eventImageArrayFiles.value)
    const heroImage = await uploadImageFile(compressedHeroImage, token)
    const imageArray = await Promise.all(
      compressedImageArray.map((file) => uploadImageFile(file, token)),
    )

    const payload: EventPayload = {
      name: normalizeText(eventForm.name, { field: 'Navn', required: true, min: 3, max: 255 }),
      description: normalizeText(eventForm.description, {
        field: 'Beskrivelse',
        required: true,
        min: 3,
        max: 1024,
      }),
      heroImage,
      imageArray,
      price: normalizeNonNegativeNumber(eventForm.price, 'Pris'),
      link: normalizeText(eventForm.link, { field: 'Link', required: true, max: 2048 }),
      gpsPosition,
      slugArray: normalizeStringArray(eventForm.slugArray),
      isAnnual: eventForm.isAnnual,
      startDate: dates.startDate,
      endDate: dates.endDate,
      openingHours: normalizeStringArray(splitList(eventForm.openingHoursText)),
    }

    return submitContentByRole('event', payload, token)
  }

  const submitAttraction = async (): Promise<ContentSubmissionDestination> => {
    if (!attractionHeroImageFile.value) {
      throw new Error('Upload et billede til denne attraktion.')
    }

    const token = getAuthToken()
    const gpsPosition = await resolveGpsPosition(attractionForm.address, attractionForm.city)

    isUploadingImage.value = true

    // Attractions share the event image workflow but do not carry date fields.
    const compressedHeroImage = await compressImageFile(attractionHeroImageFile.value)
    const compressedImageArray = await compressImageFiles(attractionImageArrayFiles.value)
    const heroImage = await uploadImageFile(compressedHeroImage, token)
    const imageArray = await Promise.all(
      compressedImageArray.map((file) => uploadImageFile(file, token)),
    )

    const payload: AttractionPayload = {
      name: normalizeText(attractionForm.name, {
        field: 'Navn',
        required: true,
        min: 3,
        max: 255,
      }),
      description: normalizeText(attractionForm.description, {
        field: 'Beskrivelse',
        required: true,
        min: 3,
        max: 1024,
      }),
      heroImage,
      imageArray,
      price: normalizeNonNegativeNumber(attractionForm.price, 'Pris'),
      link: normalizeText(attractionForm.link, { field: 'Link', required: true, max: 2048 }),
      gpsPosition,
      slugArray: normalizeStringArray(attractionForm.slugArray),
      openingHours: normalizeStringArray(splitList(attractionForm.openingHoursText)),
    }

    return submitContentByRole('attraction', payload, token)
  }

  const submitCity = async (): Promise<ContentSubmissionDestination> => {
    validateCityForm(cityForm)

    if (!cityHeroImageFile.value) {
      throw new Error('Upload et billede til denne by.')
    }

    const token = getAuthToken()
    const gpsPosition = await resolveCityGpsPosition(cityForm.name)

    isUploadingImage.value = true

    // Cities only have a hero image today, so no imageArray payload is sent.
    const compressedHeroImage = await compressImageFile(cityHeroImageFile.value)
    const heroImage = await uploadImageFile(compressedHeroImage, token)

    const payload: CityPayload = {
      name: normalizeText(cityForm.name, { field: 'Navn', required: true, min: 3, max: 255 }),
      tagLine: normalizeText(cityForm.tagLine, {
        field: 'Byens slogan',
        required: true,
        min: 20,
        max: 100,
      }),
      description: normalizeText(cityForm.description, {
        field: 'Beskrivelse',
        required: true,
        min: 3,
        max: 1024,
      }),
      heroImage,
      commune: normalizeText(cityForm.commune, { field: 'Kommune', required: true, max: 255 }),
      region: normalizeText(cityForm.region, { field: 'Region', required: true, max: 255 }),
      country: normalizeText(cityForm.country, { field: 'Land', required: true, max: 255 }),
      gpsPosition,
      population: normalizeNonNegativeNumber(cityForm.population, 'Indbyggertal', 100_000_000),
      visitorCenter: normalizeText(cityForm.visitorCenter, { field: 'Besøgscenter', max: 255 }),
    }

    return submitContentByRole('city', payload, token)
  }

  const submitSelected = async (setMessage: CreateContentMessageStateSetter) => {
    // Single public entry point for the view. The selected tab controls which
    // branch runs, but success/error messaging remains consistent.
    try {
      isSubmitting.value = true
      setMessage('', 'info')

      let destination: ContentSubmissionDestination

      if (selectedType.value === 'event') {
        destination = await submitEvent()
      } else if (selectedType.value === 'attraction') {
        destination = await submitAttraction()
      } else {
        destination = await submitCity()
      }

      setMessage(
        destination === 'created'
          ? 'Indholdet er oprettet.'
          : 'Dit forslag er sendt til admin og afventer godkendelse.',
        'success',
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Kunne ikke sende forslaget.', 'error')
    } finally {
      // Image upload state spans compression and upload work for the selected
      // content type, so it is reset here after all submit branches finish.
      isUploadingImage.value = false
      isSubmitting.value = false
    }
  }

  return {
    isSubmitting,
    isUploadingImage,
    submitEvent,
    submitAttraction,
    submitCity,
    submitSelected,
  }
}
