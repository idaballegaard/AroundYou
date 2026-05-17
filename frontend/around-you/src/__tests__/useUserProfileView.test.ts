import { defineComponent, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useUserProfileView } from '@/composables/profile/useUserProfileView'
import { clearAuthSession, setAuthSession } from '@/api/authSession'
import type { User } from '@/types/user'

const mocks = vi.hoisted(() => ({
  compressImageFile: vi.fn(),
  fetchUser: vi.fn(),
  isAllowedImageType: vi.fn(),
  logout: vi.fn(),
  push: vi.fn(),
  restrictUserProfile: vi.fn(),
  updateUser: vi.fn(),
  uploadImageFile: vi.fn(),
}))

const user = ref<User | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

vi.mock('@/composables/profile/useUser', () => ({
  useUser: () => ({
    user,
    loading,
    error,
    fetchUser: mocks.fetchUser,
    updateUser: mocks.updateUser,
  }),
}))

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    logout: mocks.logout,
  }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mocks.push,
  }),
}))

vi.mock('@/api/contentApi', () => ({
  uploadImageFile: mocks.uploadImageFile,
}))

vi.mock('@/api/user', () => ({
  restrictUserProfile: mocks.restrictUserProfile,
}))

vi.mock('@/utils/imageCompressor', () => ({
  compressImageFile: mocks.compressImageFile,
  isAllowedImageType: mocks.isAllowedImageType,
}))

const mountProfileHarness = () => {
  let exposed: ReturnType<typeof useUserProfileView> | undefined

  const Harness = defineComponent({
    setup() {
      exposed = useUserProfileView()

      return exposed
    },
    template: '<div />',
  })

  const wrapper = mount(Harness)

  return {
    wrapper,
    get state() {
      if (!exposed) {
        throw new Error('Profile harness did not initialize')
      }

      return exposed
    },
  }
}

describe('useUserProfileView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearAuthSession()
    const storage = new Map<string, string>()

    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      removeItem: vi.fn((key: string) => {
        storage.delete(key)
      }),
      setItem: vi.fn((key: string, value: string) => {
        storage.set(key, value)
      }),
    })

    user.value = {
      userName: 'helena',
      email: 'helena@example.com',
      firstName: 'Helena',
      lastName: 'Nielsen',
      role: 'user',
      permissions: [],
    }
    loading.value = false
    error.value = null

    mocks.compressImageFile.mockImplementation((file) => file)
    mocks.isAllowedImageType.mockReturnValue(true)
    mocks.push.mockResolvedValue(undefined)
    mocks.restrictUserProfile.mockResolvedValue({ isRestricted: true })
    mocks.updateUser.mockResolvedValue(undefined)
    mocks.uploadImageFile.mockResolvedValue('uploaded-avatar.jpg')

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:avatar-preview'),
      revokeObjectURL: vi.fn(),
    })
  })

  it('fetches profile data on mount and exposes display values', () => {
    const { state, wrapper } = mountProfileHarness()

    expect(mocks.fetchUser).toHaveBeenCalledOnce()
    expect(state.displayName.value).toBe('helena')
    expect(state.initials.value).toBe('HE')

    wrapper.unmount()
  })

  it('rejects invalid avatar files before submitting profile updates', async () => {
    mocks.isAllowedImageType.mockReturnValue(false)
    const { state, wrapper } = mountProfileHarness()
    const input = document.createElement('input')
    const file = new File(['avatar'], 'avatar.gif', { type: 'image/gif' })

    Object.defineProperty(input, 'files', {
      value: [file],
    })

    state.handleAvatarSelected({ target: input } as unknown as Event)
    await state.handleUpdate()

    expect(state.avatarError.value).toBe('Vælg et PNG-, JPG- eller WEBP-billede, før du gemmer.')
    expect(mocks.uploadImageFile).not.toHaveBeenCalled()
    expect(mocks.updateUser).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('uploads a selected avatar before saving the profile', async () => {
    setAuthSession('token-123', user.value!)
    const { state, wrapper } = mountProfileHarness()
    const input = document.createElement('input')
    const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })

    Object.defineProperty(input, 'files', {
      value: [file],
    })

    state.handleAvatarSelected({ target: input } as unknown as Event)
    await state.handleUpdate()
    await nextTick()

    expect(mocks.compressImageFile).toHaveBeenCalledWith(file, {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.78,
    })
    expect(mocks.uploadImageFile).toHaveBeenCalledWith(file, 'token-123')
    expect(user.value?.userAvatar).toBe('uploaded-avatar.jpg')
    expect(mocks.updateUser).toHaveBeenCalledOnce()
    expect(state.successMessage.value).toBe('Profilen er opdateret.')

    wrapper.unmount()
  })

  it('requires auth before deleting an account', async () => {
    const { state, wrapper } = mountProfileHarness()

    state.openDeleteModal()
    await state.confirmDeleteAccount()

    expect(state.isDeleteModalOpen.value).toBe(true)
    expect(state.deleteAccountError.value).toBe('Du skal være logget ind for at slette din konto.')
    expect(mocks.restrictUserProfile).not.toHaveBeenCalled()
    expect(mocks.logout).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('restricts the user, logs out, and redirects after confirming account deletion', async () => {
    setAuthSession('token-123', user.value!)
    const { state, wrapper } = mountProfileHarness()

    await state.confirmDeleteAccount()

    expect(mocks.restrictUserProfile).toHaveBeenCalledWith('token-123')
    expect(mocks.logout).toHaveBeenCalledOnce()
    expect(mocks.push).toHaveBeenCalledWith('/auth/login')

    wrapper.unmount()
  })
})
