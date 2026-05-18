const DEFAULT_API_BASE_URL = 'http://localhost:4000/api'
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL

if (import.meta.env.PROD && !configuredApiBaseUrl) {
  throw new Error('Missing VITE_API_BASE_URL for production build')
}

export const API_BASE_URL = (configuredApiBaseUrl ?? DEFAULT_API_BASE_URL).replace(/\/$/, '')

export const USER_API_URL = `${API_BASE_URL}/user`

export function resolveApiAssetUrl(url: string): string {
  const trimmedUrl = url.trim()

  if (!trimmedUrl) return trimmedUrl

  if (trimmedUrl.startsWith('/api/')) {
    // Normalize persisted API-relative assets to the current environment's API
    // origin, so production data still works in local development.
    return `${API_BASE_URL}${trimmedUrl.slice('/api'.length)}`
  }

  if (trimmedUrl.startsWith('/images/')) {
    return `${API_BASE_URL}${trimmedUrl}`
  }

  try {
    const parsedUrl = new URL(trimmedUrl)
    const isLoopbackApiUrl =
      (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') &&
      parsedUrl.pathname.startsWith('/api/')

    if (isLoopbackApiUrl) {
      // Some older records contain localhost API URLs. Rewrite only loopback API
      // URLs and leave external image URLs untouched.
      return `${API_BASE_URL}${parsedUrl.pathname.slice('/api'.length)}${parsedUrl.search}${parsedUrl.hash}`
    }
  } catch {
    return trimmedUrl
  }

  return trimmedUrl
}
