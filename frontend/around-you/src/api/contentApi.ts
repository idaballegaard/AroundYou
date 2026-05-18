import type {
  AttractionPayload,
  CityPayload,
  EventPayload,
  UploadedImageResponse,
} from '@/types/content'
import { clearApiCache } from '@/api/http'
import { API_BASE_URL } from '@/constants/config'

const authHeaders = (token: string | null, includeJsonContentType = true) => {
  // Image uploads use FormData, so callers can opt out of JSON content type and
  // let the browser set the multipart boundary.
  return {
    ...(includeJsonContentType ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

const toBackendError = async (response: Response, fallbackMessage: string) => {
  // Prefer backend validation messages when present, but keep a meaningful
  // frontend fallback for non-JSON errors such as proxy failures.
  try {
    const errorBody = await response.json()
    const backendMessage =
      typeof errorBody?.message === 'string' ? errorBody.message : fallbackMessage
    return new Error(backendMessage)
  } catch {
    return new Error(fallbackMessage)
  }
}

export const uploadImageFile = async (file: File, token: string | null) => {
  // All image writes go through the backend so files are validated, stored, and
  // returned as API-relative URLs that resolve across environments.
  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch(`${API_BASE_URL}/upload/image`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(token, false),
    body: formData,
  })

  if (!response.ok) {
    throw await toBackendError(
      response,
      `Billedet kunne ikke uploades. Statuskode: ${response.status}`,
    )
  }

  const body = (await response.json()) as UploadedImageResponse

  if (!body.imageUrl) {
    throw new Error('Billedet blev uploadet, men serveren sendte ikke et billedlink tilbage.')
  }

  return body.imageUrl
}

const postJson = async <T>(url: string, body: T, token: string | null) => {
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw await toBackendError(response, `Request failed: ${response.status}`)
  }

  clearApiCache()
  return response.json()
}

export const createEvent = (payload: EventPayload, token: string | null) => {
  return postJson(`${API_BASE_URL}/events`, payload, token)
}

export const createAttraction = (payload: AttractionPayload, token: string | null) => {
  return postJson(`${API_BASE_URL}/attractions`, payload, token)
}

export const createCity = (payload: CityPayload, token: string | null) => {
  return postJson(`${API_BASE_URL}/city`, payload, token)
}
