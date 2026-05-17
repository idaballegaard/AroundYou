import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiGetCached, clearApiCache } from '@/api/http'
import { API_BASE_URL } from '@/constants/config'

describe('apiGetCached', () => {
  beforeEach(() => {
    clearApiCache()
    vi.restoreAllMocks()
  })

  it('deduplicates concurrent requests for the same public GET path', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ _id: 'event-1' }]),
    })

    vi.stubGlobal('fetch', fetchMock)

    const [first, second] = await Promise.all([apiGetCached('/events'), apiGetCached('/events')])

    expect(first).toEqual([{ _id: 'event-1' }])
    expect(second).toEqual([{ _id: 'event-1' }])
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/events`, {
      credentials: 'include',
      headers: {},
    })
  })

  it('can be cleared after content mutations', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ _id: 'event-1' }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ _id: 'event-2' }]),
      })

    vi.stubGlobal('fetch', fetchMock)

    await expect(apiGetCached('/events')).resolves.toEqual([{ _id: 'event-1' }])
    clearApiCache()
    await expect(apiGetCached('/events')).resolves.toEqual([{ _id: 'event-2' }])

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('rejects successful non-json responses with a clear error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html' }),
        json: () => Promise.reject(new SyntaxError('Unexpected token <')),
      }),
    )

    await expect(apiGetCached('/city')).rejects.toThrow(
      'Expected JSON response for /city, received text/html',
    )
  })
})
