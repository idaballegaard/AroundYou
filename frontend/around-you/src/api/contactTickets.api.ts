import { apiRequest, jsonHeaders } from '@/api/http'
import { getAuthToken } from '@/api/authSession'
import type {
  ContactTicket,
  ContactTicketCategoryFilter,
  ContactTicketStatusFilter,
  CreateContactTicketPayload,
} from '@/types/contact-ticket'

export function createContactTicket(payload: CreateContactTicketPayload): Promise<ContactTicket> {
  return apiRequest<ContactTicket>('/contact/tickets', {
    method: 'POST',
    token: getAuthToken(),
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  })
}

export function fetchAdminContactTickets(
  status: ContactTicketStatusFilter = 'open',
  category: ContactTicketCategoryFilter = 'all',
): Promise<ContactTicket[]> {
  const params = new URLSearchParams({ status })

  if (category !== 'all') {
    params.set('category', category)
  }

  return apiRequest<ContactTicket[]>(`/admin/contact/tickets?${params.toString()}`, {
    token: getAuthToken(),
  })
}

export function completeContactTicket(id: string): Promise<ContactTicket> {
  return apiRequest<ContactTicket>(`/admin/contact/tickets/${encodeURIComponent(id)}/complete`, {
    method: 'PATCH',
    token: getAuthToken(),
  })
}

export function rejectContactTicket(id: string, reason: string): Promise<ContactTicket> {
  return apiRequest<ContactTicket>(`/admin/contact/tickets/${encodeURIComponent(id)}/reject`, {
    method: 'PATCH',
    token: getAuthToken(),
    headers: jsonHeaders(),
    body: JSON.stringify({ reason }),
  })
}

export function markContactTicketSeen(id: string): Promise<ContactTicket> {
  return apiRequest<ContactTicket>(`/admin/contact/tickets/${encodeURIComponent(id)}/seen`, {
    method: 'PATCH',
    token: getAuthToken(),
  })
}

export function startContactTicketWork(id: string): Promise<ContactTicket> {
  return apiRequest<ContactTicket>(`/admin/contact/tickets/${encodeURIComponent(id)}/start`, {
    method: 'PATCH',
    token: getAuthToken(),
  })
}

export function reopenContactTicket(id: string): Promise<ContactTicket> {
  return apiRequest<ContactTicket>(`/admin/contact/tickets/${encodeURIComponent(id)}/reopen`, {
    method: 'PATCH',
    token: getAuthToken(),
  })
}
