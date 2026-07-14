import { apiClient } from '../../../lib/apiClient'
import type {
  ListingAppointment,
  ListingNote,
  ManagedPropertyDetails,
  ManagementStatus,
} from '../types/listingManagement.types'

export function getManagedPropertyApi(id: number) {
  return apiClient<{ data: ManagedPropertyDetails }>(`/api/favorites/${id}`)
}

export function updateManagementStatusApi(id: number, status: ManagementStatus) {
  return apiClient<{ data: { managementStatus: ManagementStatus } }>(
    `/api/favorites/${id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
  )
}

export function createNoteApi(id: number, body: string) {
  return apiClient<{ data: ListingNote }>(`/api/favorites/${id}/notes`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  })
}

export function updateNoteApi(id: number, noteId: number, body: string) {
  return apiClient<{ data: ListingNote }>(`/api/favorites/${id}/notes/${noteId}`, {
    method: 'PATCH',
    body: JSON.stringify({ body }),
  })
}

export function deleteNoteApi(id: number, noteId: number) {
  return apiClient<void>(`/api/favorites/${id}/notes/${noteId}`, {
    method: 'DELETE',
  })
}

export function createAppointmentApi(
  id: number,
  payload: Pick<ListingAppointment, 'scheduledAt' | 'status' | 'locationText' | 'notes'>,
) {
  return apiClient<{ data: ListingAppointment }>(`/api/favorites/${id}/appointments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateAppointmentApi(
  id: number,
  appointmentId: number,
  payload: Pick<ListingAppointment, 'scheduledAt' | 'status' | 'locationText' | 'notes'>,
) {
  return apiClient<{ data: ListingAppointment }>(
    `/api/favorites/${id}/appointments/${appointmentId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  )
}

export function deleteAppointmentApi(id: number, appointmentId: number) {
  return apiClient<void>(`/api/favorites/${id}/appointments/${appointmentId}`, {
    method: 'DELETE',
  })
}
