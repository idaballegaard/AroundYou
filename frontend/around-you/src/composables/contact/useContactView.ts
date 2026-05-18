import { computed, reactive, ref } from 'vue'

import { createContactTicket } from '@/api/contactTickets.api'
import { useAuth } from '@/composables/useAuth'
import {
  contactTicketCategoryOptions,
  getContactTicketCategoryMeta,
  type CreateContactTicketPayload,
} from '@/types/contact-ticket'

/**
 * Manages contact form state, preview values, and ticket submission.
 */
export function useContactView() {
  const { currentUser } = useAuth()

  const isSubmitting = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')

  // Stores the editable contact ticket form fields.
  const form = reactive<CreateContactTicketPayload>({
    category: 'bug',
    subject: '',
    message: '',
  })

  // Maps authenticated user data into display values for the contact view.
  const userEmail = computed(() => currentUser.value?.email ?? 'din konto-email')
  const displayUserName = computed(() => currentUser.value?.userName ?? 'Bruger')
  const selectedCategory = computed(() => getContactTicketCategoryMeta(form.category))

  // Generates the timestamp shown in the ticket preview.
  const previewDate = computed(() =>
    new Date().toLocaleString('da-DK', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
  )

  // Provides fallback preview text before the user has typed anything.
  const previewSubject = computed(() => form.subject || 'Din titel vises her')
  const previewMessage = computed(
    () =>
      form.message ||
      'Din beskrivelse vises her, mens du skriver. Admin modtager teksten sammen med din kategori, titel og konto-email.',
  )

  // Sends the contact ticket and resets the form on success.
  const submitTicket = async (): Promise<void> => {
    isSubmitting.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      await createContactTicket({ ...form })
      form.subject = ''
      form.message = ''
      successMessage.value = 'Din henvendelse er sendt til admin.'
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Kunne ikke sende henvendelsen.'
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    contactTicketCategoryOptions,
    displayUserName,
    errorMessage,
    form,
    isSubmitting,
    previewDate,
    previewMessage,
    previewSubject,
    selectedCategory,
    submitTicket,
    successMessage,
    userEmail,
  }
}
