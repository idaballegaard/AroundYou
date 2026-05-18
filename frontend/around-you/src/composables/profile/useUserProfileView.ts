import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { getAuthToken } from '@/api/authSession'
import { uploadImageFile } from '@/api/contentApi'
import { restrictUserProfile } from '@/api/user'
import { useAuth } from '@/composables/useAuth'
import { useUser } from '@/composables/profile/useUser'
import { compressImageFile, isAllowedImageType } from '@/utils/imageCompressor'
import {
  AVATAR_UPLOAD_ERROR_MESSAGE,
  AVATAR_UPLOAD_OPTIONS,
  DELETE_ACCOUNT_ERROR_MESSAGE,
  INVALID_AVATAR_SAVE_MESSAGE,
  INVALID_AVATAR_TYPE_MESSAGE,
  MISSING_AVATAR_AUTH_MESSAGE,
  MISSING_DELETE_AUTH_MESSAGE,
  PROFILE_UPDATED_MESSAGE,
  getErrorMessage,
  getProfileAvatar,
  getProfileDisplayName,
  getProfileInitials,
} from './profileView.helpers'

type AvatarInputElement = HTMLInputElement & {
  files: FileList | null
}

export const useUserProfileView = () => {
  // Owns the profile edit workflow, including avatar preview lifecycle and the
  // soft-delete/restriction confirmation modal.
  const router = useRouter()
  const { user, loading, error, fetchUser, updateUser } = useUser()
  const { logout } = useAuth()

  const successMessage = ref('')
  const avatarError = ref('')
  const avatarFile = ref<File | null>(null)
  const avatarPreview = ref('')
  const hasInvalidAvatarFile = ref(false)
  const uploadingAvatar = ref(false)
  const deletingAccount = ref(false)
  const deleteAccountError = ref('')
  const isDeleteModalOpen = ref(false)

  const displayName = computed(() => getProfileDisplayName(user.value))
  const displayAvatar = computed(() => getProfileAvatar(avatarPreview.value, user.value))
  const initials = computed(() => getProfileInitials(user.value))

  const revokeAvatarPreview = () => {
    // Object URLs are tied to browser memory; revoke before replacing or
    // unmounting to avoid leaking selected avatar previews.
    if (avatarPreview.value.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview.value)
    }
  }

  const clearAvatarInput = (target: AvatarInputElement) => {
    target.value = ''
  }

  const handleAvatarSelected = (event: Event) => {
    const target = event.target as AvatarInputElement | null
    const file = target?.files?.[0]

    avatarError.value = ''
    successMessage.value = ''

    if (!file) {
      hasInvalidAvatarFile.value = false
      return
    }

    if (!isAllowedImageType(file)) {
      avatarError.value = INVALID_AVATAR_TYPE_MESSAGE
      avatarFile.value = null
      hasInvalidAvatarFile.value = true
      clearAvatarInput(target)
      return
    }

    hasInvalidAvatarFile.value = false
    revokeAvatarPreview()
    // Keep the preview local until save, so selecting a file does not mutate the
    // persisted profile unless the user submits the form.
    avatarFile.value = file
    avatarPreview.value = URL.createObjectURL(file)
  }

  const uploadAvatarIfSelected = async () => {
    // Avatar upload is separated from profile update because the user endpoint
    // stores only the uploaded image URL.
    if (!avatarFile.value || !user.value) {
      return true
    }

    const token = getAuthToken()

    if (!token) {
      avatarError.value = MISSING_AVATAR_AUTH_MESSAGE
      return false
    }

    uploadingAvatar.value = true

    try {
      const compressedFile = await compressImageFile(avatarFile.value, AVATAR_UPLOAD_OPTIONS)
      user.value.userAvatar = await uploadImageFile(compressedFile, token)
      avatarFile.value = null
      revokeAvatarPreview()
      avatarPreview.value = ''
      return true
    } catch (err: unknown) {
      avatarError.value = getErrorMessage(err, AVATAR_UPLOAD_ERROR_MESSAGE)
      return false
    } finally {
      uploadingAvatar.value = false
    }
  }

  const handleUpdate = async () => {
    successMessage.value = ''

    if (hasInvalidAvatarFile.value) {
      avatarError.value = INVALID_AVATAR_SAVE_MESSAGE
      return
    }

    avatarError.value = ''

    const avatarUploaded = await uploadAvatarIfSelected()
    if (!avatarUploaded) {
      return
    }

    await updateUser()
    if (!error.value) {
      successMessage.value = PROFILE_UPDATED_MESSAGE
    }
  }

  const openDeleteModal = () => {
    isDeleteModalOpen.value = true
  }

  const closeDeleteModal = () => {
    if (deletingAccount.value) {
      return
    }

    deleteAccountError.value = ''
    isDeleteModalOpen.value = false
  }

  const confirmDeleteAccount = async () => {
    // Account deletion is implemented as backend restriction, then local logout,
    // so the user loses access immediately without removing historical content.
    const token = getAuthToken()

    if (!token) {
      deleteAccountError.value = MISSING_DELETE_AUTH_MESSAGE
      return
    }

    deletingAccount.value = true
    deleteAccountError.value = ''

    try {
      await restrictUserProfile(token)
      logout()
      await router.push('/auth/login')
    } catch (err: unknown) {
      deleteAccountError.value = getErrorMessage(err, DELETE_ACCOUNT_ERROR_MESSAGE)
    } finally {
      deletingAccount.value = false
    }
  }

  onMounted(() => {
    fetchUser()
  })

  onUnmounted(() => {
    revokeAvatarPreview()
  })

  return {
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
  }
}
