<template>
  <main class="min-h-[calc(100vh-88px)] bg-[#C1D2DE] px-4 py-8">
    <section
      class="mx-auto max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(9,75,123,0.16)]"
    >
      <ProfileHero :display-avatar="displayAvatar" :display-name="displayName" :initials="initials" />

      <div class="px-6 py-8 sm:px-10">
        <p class="text-xs font-semibold uppercase tracking-[0.28em] text-[#de5826]">Konto</p>
        <h2 class="mt-2 text-3xl font-black tracking-tight text-[#094b7b]">Min profil</h2>

        <div
          v-if="loading && !user"
          class="mt-6 rounded-xl bg-[#C1D2DE] px-4 py-3 text-sm font-semibold text-[#094b7b]"
        >
          Henter profil...
        </div>

        <p
          v-else-if="error"
          class="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
        >
          {{ error }}
        </p>

        <p
          v-if="successMessage"
          class="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
        >
          {{ successMessage }}
        </p>

        <ProfileForm
          v-if="user"
          :avatar-error="avatarError"
          :avatar-file="avatarFile"
          :loading="loading"
          :uploading-avatar="uploadingAvatar"
          :user="user"
          @avatar-selected="handleAvatarSelected"
          @submit="handleUpdate"
        />

        <DeleteAccountPanel
          v-if="user"
          :deleting-account="deletingAccount"
          @open="openDeleteModal"
        />
      </div>
    </section>

    <DeleteAccountModal
      v-if="isDeleteModalOpen"
      :delete-account-error="deleteAccountError"
      :deleting-account="deletingAccount"
      @close="closeDeleteModal"
      @confirm="confirmDeleteAccount"
    />
  </main>
</template>

<script setup lang="ts">
import DeleteAccountModal from '@/components/profile/DeleteAccountModal.vue'
import DeleteAccountPanel from '@/components/profile/DeleteAccountPanel.vue'
import ProfileForm from '@/components/profile/ProfileForm.vue'
import ProfileHero from '@/components/profile/ProfileHero.vue'
import { useUserProfileView } from '@/composables/profile/useUserProfileView'

const {
  avatarError,
  avatarFile,
  closeDeleteModal,
  confirmDeleteAccount,
  deleteAccountError,
  deletingAccount,
  displayAvatar,
  displayName,
  error,
  handleAvatarSelected,
  handleUpdate,
  initials,
  isDeleteModalOpen,
  loading,
  openDeleteModal,
  successMessage,
  uploadingAvatar,
  user,
} = useUserProfileView()
</script>
