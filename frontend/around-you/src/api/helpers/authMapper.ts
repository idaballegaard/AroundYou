import type { User } from '@/types/user'
import { USER_PERMISSIONS, USER_ROLES } from '@/constants/accessControl'
import { optionalString } from './stringFields'

function isUserRole(value: unknown): value is User['role'] {
  return typeof value === 'string' && USER_ROLES.includes(value as User['role'])
}

function toUserPermissions(value: unknown): User['permissions'] {
  // API responses are treated as untrusted at this boundary. Filter unknown
  // permission strings before they enter access-control state.
  if (!Array.isArray(value)) return []

  return value.filter(
    (permission): permission is User['permissions'][number] =>
      typeof permission === 'string' &&
      USER_PERMISSIONS.includes(permission as User['permissions'][number]),
  )
}

export function toAuthenticatedUser(payload: unknown): User | null {
  // Login/session responses differ slightly between endpoints, so normalize the
  // user object before the rest of the app consumes auth state.
  if (!payload || typeof payload !== 'object') return null

  const rawUser = payload as Record<string, unknown>
  const userName = rawUser.userName
  const email = rawUser.email
  const role = rawUser.role

  if (typeof userName !== 'string' || typeof email !== 'string' || !isUserRole(role)) {
    return null
  }

  return {
    userName,
    email,
    firstName: optionalString(rawUser, 'firstName'),
    lastName: optionalString(rawUser, 'lastName'),
    userAvatar: optionalString(rawUser, 'userAvatar'),
    role,
    permissions: toUserPermissions(rawUser.permissions),
  }
}
