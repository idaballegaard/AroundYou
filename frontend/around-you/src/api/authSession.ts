import { ref } from 'vue'
import type { User } from '@/types/user'
import { hasPermission, hasRole } from '@/utils/accessControl'

export const token = ref<string | null>(null)
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
  setAuthUser(user)
  authValidated.value = true
}

export function setAuthUser(user: User): void {
  currentUser.value = user
  isAdmin.value = userHasAdminAccess(user)
}

export function clearAuthSession(): void {
  token.value = null
  currentUser.value = null
  authValidated.value = false
  isAdmin.value = false
}
