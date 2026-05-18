import { computed, ref, watch, type Ref } from 'vue'
import {
  deleteAllNotifications,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notifications.api'
import type { AppNotification } from '@/types/notification'

/**
 * Handles navbar notification state and actions
 * for authenticated users.
 */
export function useNavbarNotifications(isAuthenticated: Ref<boolean>) {
  const notifications = ref<AppNotification[]>([])
  const notificationsLoading = ref(false)
  const notificationError = ref('')

  // Computes the current unread notification count.
  const unreadNotificationCount = computed(() => {
    return notifications.value.filter((notification) => !notification.readAt).length
  })

  // Fetches notifications for the current authenticated user.
  async function loadNotifications(): Promise<void> {
    if (!isAuthenticated.value) {
      notifications.value = []
      return
    }

    notificationsLoading.value = true
    notificationError.value = ''

    try {
      notifications.value = await fetchNotifications()
    } catch (error) {
      notificationError.value =
        error instanceof Error ? error.message : 'Kunne ikke hente notifikationer.'
    } finally {
      notificationsLoading.value = false
    }
  }

  // Marks a notification as read if it has not already been opened.
  async function markRead(id: string): Promise<void> {
    const notification = notifications.value.find((entry) => entry._id === id)
    if (!notification || notification.readAt) return

    try {
      const updated = await markNotificationRead(id)
      notifications.value = notifications.value.map((entry) => (entry._id === id ? updated : entry))
    } catch (error) {
      notificationError.value =
        error instanceof Error ? error.message : 'Kunde ikke opdatere notifikationen.'
    }
  }

  // Marks all notifications as read in a single request.
  async function markAllRead(): Promise<void> {
    try {
      notifications.value = await markAllNotificationsRead()
    } catch (error) {
      notificationError.value =
        error instanceof Error ? error.message : 'Kunde ikke opdatere notifikationer.'
    }
  }

  // Removes all notifications after confirmation from the user.
  async function removeAllNotifications(): Promise<void> {
    const confirmed = window.confirm('Vil du fjerne alle notifikationer?')
    if (!confirmed) return

    try {
      await deleteAllNotifications()
      notifications.value = []
      notificationError.value = ''
    } catch (error) {
      notificationError.value =
        error instanceof Error ? error.message : 'Kunde ikke fjerne notifikationer.'
    }
  }

  // Clears local notification state, typically on logout.
  function clearNotifications(): void {
    notifications.value = []
    notificationError.value = ''
  }

  // Synchronizes notification state with authentication changes.
  watch(isAuthenticated, (authenticated) => {
    if (authenticated) {
      void loadNotifications()
      return
    }

    clearNotifications()
  })

  return {
    clearNotifications,
    loadNotifications,
    markAllRead,
    markRead,
    notificationError,
    notifications,
    notificationsLoading,
    removeAllNotifications,
    unreadNotificationCount,
  }
}
