import { ref } from 'vue'
import type { User } from '@/types/user'
import { hasPermission, hasRole } from '@/utils/accessControl'

const AUTH_TOKEN_STORAGE_KEY = 'authToken'

function readStoredAuthToken(): string | null {
  try {
    return window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

function persistAuthToken(authToken: string): void {
  try {
    window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, authToken)
  } catch {
    // Keep the in-memory session even if browser storage is unavailable.
  }
}

function removeStoredAuthToken(): void {
  try {
    window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
  } catch {
    // Nothing else to clear when browser storage is unavailable.
  }
}

// Keep auth state in memory for the current tab, with sessionStorage as a
// refresh fallback when the HttpOnly cookie is not retained by the browser.
export const token = ref<string | null>(readStoredAuthToken())
export const currentUser = ref<User | null>(null)
export const authValidated = ref(false)
export const isAdmin = ref(false)

function userHasAdminAccess(user: User | null): boolean {
  return !!user && (hasRole(user.role, 'admin') || hasPermission(user.permissions, 'admin:access'))
}

export function getAuthToken(): string | null {
  return token.value
}

export function setAuthSession(authToken: string, user: User): void {
  token.value = authToken
  persistAuthToken(authToken)
  setAuthUser(user)
  authValidated.value = true
}

export function setAuthUser(user: User): void {
  currentUser.value = user
  isAdmin.value = userHasAdminAccess(user)
}

export function clearAuthSession(): void {
  token.value = null
  removeStoredAuthToken()
  currentUser.value = null
  authValidated.value = false
  isAdmin.value = false
}
