import type { AdminFieldValue } from '@/types/admin'

export function getAdminSuggestionLabel(
  fieldLabelByKey: ReadonlyMap<string, string>,
  key: string,
): string {
  return fieldLabelByKey.get(key) ?? key
}

export function formatAdminSuggestionValue(value: AdminFieldValue): string {
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'boolean') return value ? 'Ja' : 'Nej'
  return String(value)
}
