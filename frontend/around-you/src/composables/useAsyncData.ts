import { ref } from 'vue'
import type { Ref } from 'vue'

type UseAsyncDataOptions<T> = {
  defaultValue: T
  getErrorMessage?: (error: unknown) => string
}

type UseAsyncDataResult<T> = {
  data: Ref<T>
  loading: Ref<boolean>
  error: Ref<string | null>
  execute: () => Promise<T>
  setData: (value: T) => void
  setError: (message: string | null) => void
}

export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  options: UseAsyncDataOptions<T>,
): UseAsyncDataResult<T> {
  // Shared primitive for views that need the same loading/error/data lifecycle
  // without pulling in a full query library.
  const data = ref(options.defaultValue) as Ref<T>
  const loading = ref(false)
  const error = ref<string | null>(null)

  const setData = (value: T) => {
    data.value = value
  }

  const setError = (message: string | null) => {
    error.value = message
  }

  const execute = async (): Promise<T> => {
    loading.value = true
    error.value = null

    try {
      const result = await fetcher()
      data.value = result
      return result
    } catch (caughtError) {
      // Reset to the caller's known-safe shape so templates can keep rendering
      // without defensive null checks after a failed request.
      data.value = options.defaultValue
      error.value = options.getErrorMessage?.(caughtError) ?? 'Der opstod en fejl.'
      throw caughtError
    } finally {
      loading.value = false
    }
  }

  return {
    data,
    loading,
    error,
    execute,
    setData,
    setError,
  }
}
