import { describe, expect, it } from 'vitest'

import { API_BASE_URL, resolveApiAssetUrl } from '@/constants/config'

describe('config helpers', () => {
  it('resolves API image paths against the configured API base URL', () => {
    expect(resolveApiAssetUrl('/api/images/image-id')).toBe(`${API_BASE_URL}/images/image-id`)
    expect(resolveApiAssetUrl('/images/image-id')).toBe(`${API_BASE_URL}/images/image-id`)
  })

  it('rewrites persisted localhost API image URLs to the configured API base URL', () => {
    expect(resolveApiAssetUrl('http://localhost:4000/api/images/image-id?size=small#main')).toBe(
      `${API_BASE_URL}/images/image-id?size=small#main`,
    )
    expect(resolveApiAssetUrl('http://127.0.0.1:4000/api/images/image-id')).toBe(
      `${API_BASE_URL}/images/image-id`,
    )
  })

  it('leaves external and non-API asset URLs unchanged', () => {
    expect(resolveApiAssetUrl('https://images.example.com/photo.jpg')).toBe(
      'https://images.example.com/photo.jpg',
    )
    expect(resolveApiAssetUrl('/danmarkskort_1800x1280.jpg')).toBe('/danmarkskort_1800x1280.jpg')
  })
})
