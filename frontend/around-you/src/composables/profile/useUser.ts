import { ref } from 'vue'
import { getAuthToken, setAuthUser } from '@/api/authSession'
import { getUserProfile, updateUserProfile, type UserProfileUpdate } from '@/api/user'
import type { User } from '@/types/user'

const user = ref<User | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

export const useUser = () => {
  const fetchUser = async () => {
    const token = getAuthToken()

    if (!token) {
      error.value = 'No token found'
      return
    }

    loading.value = true
    error.value = null

    try {
      user.value = await getUserProfile(token)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  const updateUser = async () => {
    const token = getAuthToken()

    if (!token || !user.value) return

    loading.value = true
    error.value = null

    try {
      const updates: UserProfileUpdate = {
        userName: user.value.userName,
        email: user.value.email,
        firstName: user.value.firstName,
        lastName: user.value.lastName,
        userAvatar: user.value.userAvatar,
      }
      user.value = await updateUserProfile(token, updates)
      setAuthUser(user.value)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    error,
    fetchUser,
    updateUser,
  }
}
