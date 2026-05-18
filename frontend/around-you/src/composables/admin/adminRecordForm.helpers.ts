import type { AdminEditableRecord } from '@/types/admin'
import { isAllowedImageType } from '@/utils/imageCompressor'

export function getAdminFormStringField(record: AdminEditableRecord, key: string): string {
  // Dynamic admin fields can hold multiple primitive types; template bindings
  // get normalized values so inputs remain controlled.
  const value = record[key]
  return typeof value === 'string' ? value : ''
}

export function getAdminFormArrayField(record: AdminEditableRecord, key: string): string[] {
  const value = record[key]
  return Array.isArray(value) ? value : []
}

export function getAdminFormNumberField(record: AdminEditableRecord, key: string): number {
  const value = record[key]
  return typeof value === 'number' ? value : 0
}

export function getAdminFormBooleanField(record: AdminEditableRecord, key: string): boolean {
  const value = record[key]
  return typeof value === 'boolean' ? value : false
}

export function getAdminFormTagsField(record: AdminEditableRecord, key: string): string {
  return getAdminFormArrayField(record, key).join(', ')
}

export function getAdminFormDateField(record: AdminEditableRecord, key: string): string {
  const value = getAdminFormStringField(record, key)
  // datetime-local inputs expect minute precision and no timezone suffix.
  return value.includes('T') ? value.slice(0, 16) : value
}

export function toAdminTagsValue(value: string): string[] {
  // Admin tag fields are edited as comma-separated text but stored as arrays.
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function getSelectedAdminFiles(event: Event): {
  files: File[]
  target: HTMLInputElement | null
} {
  // Centralize file extraction so upload handlers can always clear the input
  // after success/failure, allowing the same file to be selected again.
  const target = event.target as HTMLInputElement | null
  return {
    target,
    files: target?.files ? Array.from(target.files) : [],
  }
}

export function validateAdminImageFiles(files: File[]): void {
  // Validate every selected file before any upload starts so image-list fields
  // cannot end up partially updated.
  const invalidFile = files.find((file) => !isAllowedImageType(file))

  if (invalidFile) {
    throw new Error('Kun PNG-, JPG- og WEBP-billeder er tilladt.')
  }
}
