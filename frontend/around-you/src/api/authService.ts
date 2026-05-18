import type { User } from '@/types/user'
import { toAuthenticatedUser } from '@/api/helpers/authMapper'
import { USER_API_URL } from '@/constants/config'
import {
  authValidated,
  clearAuthSession,
  currentUser,
  isAdmin,
  setAuthSession,
  setAuthUser,
  token,
} from '@/api/authSession'

type AuthResponse = {
  token: string
  user: User
}

// Extracts API error messages while keeping a fallback for invalid error responses.
async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const error = (await response.json()) as { message?: string; error?: string }
    return error.message || error.error || fallback
  } catch {
    return fallback
  }
}

/**
 * Provides authentication actions and shared auth state.
 */
export const useAuthService = () => {
  // Authenticates the user and stores the returned session data.
  const login = async (identifier: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${USER_API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ identifier, password }),
    })

    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'Login failed'))
    }

    const data = await response.json()
    const authenticatedUser = toAuthenticatedUser((data as { user?: unknown }).user)
    const authToken = (data as { token?: unknown }).token

    if (typeof authToken !== 'string' || !authToken || !authenticatedUser) {
      throw new Error('Invalid API response')
    }

    setAuthSession(authToken, authenticatedUser)

    return { token: authToken, user: authenticatedUser }
  }

  // Creates a new user account.
  const register = async (
    firstName: string,
    lastName: string,
    userName: string,
    email: string,
    password: string,
  ): Promise<void> => {
    const res = await fetch(`${USER_API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, userName, email, password }),
    })

    if (!res.ok) {
      throw new Error(await getErrorMessage(res, 'Registration failed'))
    }
  }

  // Clears local auth state immediately and then attempts server-side logout.
  const logout = () => {
    clearAuthSession()
    void Promise.resolve(
      fetch(`${USER_API_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      }),
    ).catch(() => {
      // Local auth state is already cleared; failing to clear the cookie should not block logout UI.
    })
  }

  // Validates the current session and refreshes local user/token state.
  const checkSession = async (): Promise<boolean> => {
    const response = await fetch(`${USER_API_URL}/me`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
      },
    })

    if (!response.ok) {
      logout()
      return false
    }

    const data = await response.json()
    const user = toAuthenticatedUser(data)

    if (!user) {
      logout()
      return false
    }

    const refreshedToken = (data as { token?: unknown }).token
    token.value =
      typeof refreshedToken === 'string' && refreshedToken ? refreshedToken : token.value

    authValidated.value = true
    setAuthUser(user)

    return true
  }

  return {
    login,
    register,
    logout,
    checkSession,
    token,
    currentUser,
    authValidated,
    isAdmin,
  }
}
