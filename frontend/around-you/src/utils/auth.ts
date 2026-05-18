import { currentUser, getAuthToken } from '@/api/authSession'

interface JwtPayload {
  userID?: string
}

function getJwtPayload(): JwtPayload | null {
  const token = getAuthToken()
  const encodedPayload = token?.split('.')[1]

  if (!encodedPayload) return null

  try {
    const payload = JSON.parse(window.atob(encodedPayload)) as unknown
    return payload && typeof payload === 'object' ? (payload as JwtPayload) : null
  } catch {
    return null
  }
}

export function getStoredUserName(): string {
  return currentUser.value?.userName ?? 'Guest'
}

export function getStoredUserId(): string | null {
  const payload = getJwtPayload()
  return payload?.userID ?? null
}

export function getStoredUserAvatar(): string | null {
  return currentUser.value?.userAvatar ?? null
}

export function getUserInitials(userName: string): string {
  const clean = userName.trim()
  if (!clean) return 'AY'

  return clean.slice(0, 2).toUpperCase()
}
