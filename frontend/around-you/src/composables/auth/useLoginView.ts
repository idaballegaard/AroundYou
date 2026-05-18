import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuth } from '@/composables/useAuth'
import { useGeolocationStore } from '@/stores/geolocation'

export function useLoginView() {
  const router = useRouter()
  const { login, isAuthenticated } = useAuth()
  const geo = useGeolocationStore()

  const identifier = ref('')
  const password = ref('')
  const errorMessage = ref('')
  const isSubmitting = ref(false)

  const handleLogin = async () => {
    if (!identifier.value || !password.value) return

    try {
      isSubmitting.value = true
      errorMessage.value = ''

      await login(identifier.value.trim(), password.value)

      if (!isAuthenticated.value) return

      geo.getLocation()
      await router.push('/')
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Login mislykkedes.'
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    errorMessage,
    handleLogin,
    identifier,
    isSubmitting,
    password,
  }
}
