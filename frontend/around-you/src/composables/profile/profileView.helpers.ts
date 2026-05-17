import type { User } from '@/types/user'
import { resolveApiAssetUrl } from '@/constants/config'

export const AVATAR_UPLOAD_OPTIONS = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.78,
} as const

export const INVALID_AVATAR_TYPE_MESSAGE = 'Vælg et PNG-, JPG- eller WEBP-billede.'
export const MISSING_AVATAR_AUTH_MESSAGE =
  'Du skal være logget ind for at uploade et avatarbillede.'
export const INVALID_AVATAR_SAVE_MESSAGE = 'Vælg et PNG-, JPG- eller WEBP-billede, før du gemmer.'
export const AVATAR_UPLOAD_ERROR_MESSAGE = 'Avatarbilledet kunne ikke uploades.'
export const PROFILE_UPDATED_MESSAGE = 'Profilen er opdateret.'
export const MISSING_DELETE_AUTH_MESSAGE = 'Du skal være logget ind for at slette din konto.'
export const DELETE_ACCOUNT_ERROR_MESSAGE = 'Kontoen kunne ikke slettes lige nu.'

export const getProfileDisplayName = (user: User | null) => {
  return user?.userName || 'Din profil'
}

export const getProfileAvatar = (avatarPreview: string, user: User | null) => {
  return avatarPreview || resolveApiAssetUrl(user?.userAvatar ?? '')
}

export const getProfileInitials = (user: User | null) => {
  const source = user?.userName || user?.email || 'AY'

  return source.slice(0, 2).toUpperCase()
}

export const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback
}
