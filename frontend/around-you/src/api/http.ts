import { API_BASE_URL } from '@/constants/config'

type RequestOptions = RequestInit & {
  token?: string | null
}

type CachedGetEntry<T> = {
  expiresAt: number
  promise: Promise<T>
}

const DEFAULT_PUBLIC_GET_CACHE_TTL_MS = 30_000
const publicGetCache = new Map<string, CachedGetEntry<unknown>>()

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...requestOptions } = options
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    // Include the HttpOnly auth cookie while still allowing explicit bearer
    // tokens for endpoints that need the in-memory token immediately.
    credentials: 'include',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })
  const contentType = response.headers?.get?.('content-type') ?? ''

  if (!response.ok) {
    let message = `Request failed for ${path}`

    try {
      const error = (await response.json()) as { message?: string; error?: string }
      message = error.message ?? error.error ?? message
    } catch {
      message = `${message}: ${response.status}`
    }

    throw new Error(message)
  }

  if (contentType && !contentType.includes('application/json')) {
    // Catches misconfigured dev proxies where Vite serves index.html for /api
    // requests, which otherwise fails later as a JSON parse error.
    throw new Error(`Expected JSON response for ${path}, received ${contentType}`)
  }

  return response.json() as Promise<T>
}

export function apiGetCached<T>(path: string, ttlMs = DEFAULT_PUBLIC_GET_CACHE_TTL_MS): Promise<T> {
  const now = Date.now()
  const cached = publicGetCache.get(path) as CachedGetEntry<T> | undefined

  if (cached && cached.expiresAt > now) {
    return cached.promise
  }

  // Cache the in-flight promise as well as the completed value so concurrent
  // public reads share one request. Failed requests are never cached.
  const promise = apiRequest<T>(path).catch((error) => {
    publicGetCache.delete(path)
    throw error
  })

  publicGetCache.set(path, {
    expiresAt: now + ttlMs,
    promise,
  })

  return promise
}

export function clearApiCache(): void {
  // Mutating admin/content calls should clear public GET cache so home/search
  // views do not show stale records for the full TTL.
  publicGetCache.clear()
}

export function jsonHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' }
}
