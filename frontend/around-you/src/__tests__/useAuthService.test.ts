import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthService } from '../api/authService'
import { clearAuthSession } from '@/api/authSession'
import { USER_API_URL } from '@/constants/config'

// Mock utils
vi.mock('@/utils/auth', () => ({
  getStoredUserName: vi.fn(() => 'Guest'),
  getStoredUserAvatar: vi.fn(() => null),
}))

describe('useAuthService', () => {
  let auth: ReturnType<typeof useAuthService>
  let store: Record<string, string>

  beforeEach(() => {
    vi.restoreAllMocks()
    clearAuthSession()

    auth = useAuthService()

    store = {}

    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      },
    })

    vi.stubGlobal('fetch', vi.fn())
  })

  it('logs in successfully and keeps token + user data in memory', async () => {
    const mockResponse = {
      token: 'fake-jwt-token',
      user: {
        userName: 'testUser',
        email: 'test@test.com',
        userAvatar: 'avatar.png',
        role: 'user',
        permissions: [],
      },
    }

    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    )

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    const result = await auth.login('testUser', 'password')

    expect(fetchMock).toHaveBeenCalledWith(
      `${USER_API_URL}/login`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          identifier: 'testUser',
          password: 'password',
        }),
      }),
    )

    expect(result.token).toBe('fake-jwt-token')
    expect(auth.token.value).toBe('fake-jwt-token')
    expect(auth.currentUser.value?.userName).toBe('testUser')
    expect(auth.currentUser.value?.userAvatar).toBe('avatar.png')
    expect(sessionStorage.getItem('authToken')).toBe('fake-jwt-token')
  })

  it('removes avatar if not provided', async () => {
    const mockResponse = {
      token: 'fake-jwt-token',
      user: {
        userName: 'testUser',
        email: 'test@test.com',
        role: 'user',
        permissions: [],
      },
    }

    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        }),
      ) as unknown as typeof fetch,
    )

    await auth.login('testUser', 'password')

    expect(auth.currentUser.value?.userAvatar).toBeUndefined()
  })

  it('marks admin users as admin after login', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              token: 'admin-jwt-token',
              user: {
                userName: 'admin',
                email: 'admin@test.com',
                role: 'admin',
                permissions: ['admin:access'],
              },
            }),
        }),
      ) as unknown as typeof fetch,
    )

    await auth.login('admin', 'password')

    expect(auth.isAdmin.value).toBe(true)
    expect(auth.currentUser.value?.role).toBe('admin')
  })

  it('throws error on failed login', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Invalid credentials' }),
        }),
      ) as unknown as typeof fetch,
    )

    await expect(auth.login('wrong', 'wrong')).rejects.toThrow('Invalid credentials')
  })

  it('throws on network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('Network error'))),
    )

    await expect(auth.login('test', 'test')).rejects.toThrow('Network error')
  })

  it('throws if API response is malformed (missing token)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              user: {},
            }),
        }),
      ) as unknown as typeof fetch,
    )

    await expect(auth.login('test', 'test')).rejects.toThrow('Invalid API response')
  })

  it('does not crash if logout is called twice', () => {
    store.authToken = 'fake-jwt-token'

    auth.logout()
    auth.logout()

    expect(auth.token.value).toBe(null)
    expect(sessionStorage.getItem('authToken')).toBe(null)
  })

  it('registers successfully', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
        }),
      ) as unknown as typeof fetch,
    )

    await expect(auth.register('a', 'b', 'user', 'test@test.com', '123')).resolves.toBeUndefined()
  })

  it('throws if registration fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
        }),
      ) as unknown as typeof fetch,
    )

    await expect(auth.register('a', 'b', 'user', 'test@test.com', '123')).rejects.toThrow(
      'Registration failed',
    )
  })
})
