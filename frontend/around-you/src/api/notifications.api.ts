import { apiRequest } from '@/api/http'
import { getAuthToken } from '@/api/authSession'
import type { AppNotification } from '@/types/notification'

export function fetchNotifications(): Promise<AppNotification[]> {
  return apiRequest<AppNotification[]>('/notifications', {
    token: getAuthToken(),
  })
}

export function markNotificationRead(id: string): Promise<AppNotification> {
  return apiRequest<AppNotification>(`/notifications/${encodeURIComponent(id)}/read`, {
    method: 'PATCH',
    token: getAuthToken(),
  })
}

export function markAllNotificationsRead(): Promise<AppNotification[]> {
  return apiRequest<AppNotification[]>('/notifications/read-all', {
    method: 'PATCH',
    token: getAuthToken(),
  })
}

export function deleteAllNotifications(): Promise<unknown> {
  return apiRequest('/notifications', {
    method: 'DELETE',
    token: getAuthToken(),
  })
}
