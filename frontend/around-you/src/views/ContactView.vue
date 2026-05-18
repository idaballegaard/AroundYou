<template>
  <main
    class="relative min-h-screen bg-cover bg-center bg-no-repeat py-4 sm:py-[50px]"
    style="background-image: url('/danmarkskort_1800x1280.jpg')"
  >
    <div class="pointer-events-none absolute inset-0 bg-[#e8c7aa]/55"></div>

    <div class="relative z-10 mx-4 overflow-hidden rounded-xl bg-white shadow-2xl sm:mx-[50px]">
      <section class="px-8 py-10">
        <div class="mx-auto grid gap-6">
          <ContactHeader :user-email="userEmail" />

          <div class="grid gap-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)]">
            <ContactTicketForm
              :category-options="contactTicketCategoryOptions"
              :error-message="errorMessage"
              :form="form"
              :is-submitting="isSubmitting"
              :success-message="successMessage"
              @submit="submitTicket"
            />

            <ContactTicketPreview
              :display-user-name="displayUserName"
              :has-message="Boolean(form.message)"
              :preview-date="previewDate"
              :preview-message="previewMessage"
              :preview-subject="previewSubject"
              :selected-category="selectedCategory"
              :user-email="userEmail"
            />
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import ContactHeader from '@/components/contact/ContactHeader.vue'
import ContactTicketForm from '@/components/contact/ContactTicketForm.vue'
import ContactTicketPreview from '@/components/contact/ContactTicketPreview.vue'
import { useContactView } from '@/composables/contact/useContactView'

const {
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
} = useContactView()
</script>
