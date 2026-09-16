import type { AdminCollectionConfig, AdminCollectionKey } from '@/types/admin'

export type AdminTabKey = AdminCollectionKey | 'reviews' | 'contact' | 'crawler'

export type AdminTab = {
  key: AdminTabKey
  label: string
}

export function getAdminTabs(collections: AdminCollectionConfig[]): AdminTab[] {
  return [
    ...collections.map((collection) => ({
      key: collection.key,
      label: collection.label,
    })),
    { key: 'contact', label: 'Henvendelser' },
    { key: 'reviews', label: 'Anmeldelsesrapporter' },
    { key: 'crawler', label: 'Eventcrawler' },
  ]
}

export function getActiveAdminCollection(
  collections: AdminCollectionConfig[],
  activeTab: AdminTabKey,
) {
  return collections.find((collection) => collection.key === activeTab)
}
