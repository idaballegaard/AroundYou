import { computed, onMounted, ref, watch } from 'vue'

import {
  completeContactTicket,
  fetchAdminContactTickets,
  markContactTicketSeen,
  rejectContactTicket,
  reopenContactTicket,
  startContactTicketWork,
} from '@/api/contactTickets.api'
import {
  contactTicketCategoryOptions,
  getContactTicketCategoryMeta,
  type ContactTicket,
  type ContactTicketCategoryFilter,
  type ContactTicketStatusFilter,
} from '@/types/contact-ticket'
import {
  formatAdminContactTicketDate,
  getAdminContactTicketCategorySummary,
  getContactTicketRejectionReason,
  getContactTicketStatusBadgeClass,
  getContactTicketStatusLabel,
  sortAdminContactTickets,
  type AdminContactTicketSort,
} from './adminContactTickets.helpers'

/**
 * Manages admin contact ticket state, filtering, sorting, and ticket actions.
 */
export function useAdminContactTickets() {
  const tickets = ref<ContactTicket[]>([])
  const isLoading = ref(false)
  const errorMessage = ref('')
  const activeStatus = ref<ContactTicketStatusFilter>('all')
  const activeCategory = ref<ContactTicketCategoryFilter>('all')
  const activeSort = ref<AdminContactTicketSort>('newest')
  const selectedTicket = ref<ContactTicket | null>(null)

  // Builds category summary data and sorted ticket lists for the admin UI.
  const categorySummary = computed(() => getAdminContactTicketCategorySummary(tickets.value))
  const sortedTickets = computed(() => sortAdminContactTickets(tickets.value, activeSort.value))

  // Opens a ticket and marks it as seen.
  function openTicket(ticket: ContactTicket): void {
    selectedTicket.value = ticket
    void markTicketSeen(ticket._id)
  }

  // Closes the currently selected ticket modal or detail panel.
  function closeTicket(): void {
    selectedTicket.value = null
  }

  // Keeps local ticket state synchronized with the active filter selection.
  function syncTicketForActiveFilter(updatedTicket: ContactTicket): void {
    const shouldKeep = activeStatus.value === 'all' || activeStatus.value === updatedTicket.status

    tickets.value = shouldKeep
      ? tickets.value.map((ticket) => (ticket._id === updatedTicket._id ? updatedTicket : ticket))
      : tickets.value.filter((ticket) => ticket._id !== updatedTicket._id)

    selectedTicket.value =
      selectedTicket.value?._id === updatedTicket._id ? updatedTicket : selectedTicket.value
  }

  // Loads tickets based on the active admin filters.
  async function loadTickets(): Promise<void> {
    isLoading.value = true
    errorMessage.value = ''

    try {
      tickets.value = await fetchAdminContactTickets(activeStatus.value, activeCategory.value)
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Kunne ikke hente henvendelser.'
    } finally {
      isLoading.value = false
    }
  }

  // Marks a ticket as completed.
  async function completeTicket(id: string): Promise<void> {
    errorMessage.value = ''

    try {
      const updatedTicket = await completeContactTicket(id)
      syncTicketForActiveFilter(updatedTicket)
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Kunne ikke afslutte henvendelsen.'
    }
  }

  // Rejects a ticket after the admin provides a rejection reason.
  async function rejectTicket(id: string): Promise<void> {
    const reason = getContactTicketRejectionReason()
    if (!reason) return

    errorMessage.value = ''

    try {
      const updatedTicket = await rejectContactTicket(id, reason)
      syncTicketForActiveFilter(updatedTicket)
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Kunne ikke afvise henvendelsen.'
    }
  }

  // Marks a ticket as seen by the admin.
  async function markTicketSeen(id: string): Promise<void> {
    errorMessage.value = ''

    try {
      const updatedTicket = await markContactTicketSeen(id)
      tickets.value = tickets.value.map((ticket) => (ticket._id === id ? updatedTicket : ticket))
      selectedTicket.value = selectedTicket.value?._id === id ? updatedTicket : selectedTicket.value
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Kunne ikke markere henvendelsen som set.'
    }
  }

  // Moves a ticket into the in-progress state.
  async function startWorkOnTicket(id: string): Promise<void> {
    errorMessage.value = ''

    try {
      const updatedTicket = await startContactTicketWork(id)
      syncTicketForActiveFilter(updatedTicket)
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Kunne ikke starte arbejdet på henvendelsen.'
    }
  }

  // Reopens a previously completed or rejected ticket.
  async function reopenTicket(id: string): Promise<void> {
    errorMessage.value = ''

    try {
      const updatedTicket = await reopenContactTicket(id)
      syncTicketForActiveFilter(updatedTicket)
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Kunne ikke genåbne henvendelsen.'
    }
  }

  // Reloads tickets whenever admin filters change.
  watch([activeStatus, activeCategory], () => {
    void loadTickets()
  })

  // Loads the initial ticket list when the admin view mounts.
  onMounted(() => {
    void loadTickets()
  })

  return {
    activeCategory,
    activeSort,
    activeStatus,
    categorySummary,
    closeTicket,
    completeTicket,
    contactTicketCategoryOptions,
    errorMessage,
    formatDate: formatAdminContactTicketDate,
    getContactTicketCategoryMeta,
    getContactTicketStatusBadgeClass,
    getContactTicketStatusLabel,
    isLoading,
    loadTickets,
    openTicket,
    rejectTicket,
    reopenTicket,
    selectedTicket,
    startWorkOnTicket,
    sortedTickets,
  }
}
