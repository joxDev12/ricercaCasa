import { useEffect, useState } from 'react'
import {
  createAppointmentApi,
  createNoteApi,
  deleteAppointmentApi,
  deleteNoteApi,
  getManagedPropertyApi,
  updateAppointmentApi,
  updateManagementStatusApi,
  updateNoteApi,
} from '../services/listingManagementApi'
import type {
  ListingAppointment,
  ManagedPropertyDetails,
  ManagementStatus,
} from '../types/listingManagement.types'

type AppointmentPayload = Pick<
  ListingAppointment,
  'scheduledAt' | 'status' | 'locationText' | 'notes'
>

export function useListingManagement(id: number | null) {
  const [details, setDetails] = useState<ManagedPropertyDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(id))

  async function refresh() {
    if (!id) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await getManagedPropertyApi(id)
      setDetails(response.data)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Caricamento fallito')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!id) {
      return
    }

    let active = true

    getManagedPropertyApi(id)
      .then((response) => {
        if (!active) {
          return
        }

        setDetails(response.data)
        setError(null)
      })
      .catch((caught) =>
        active
          ? setError(caught instanceof Error ? caught.message : 'Caricamento fallito')
          : undefined,
      )
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [id])

  async function updateStatus(status: ManagementStatus) {
    if (!id) {
      return
    }

    await updateManagementStatusApi(id, status)
    await refresh()
  }

  async function saveNote(body: string, noteId?: number) {
    if (!id) {
      return
    }

    if (noteId) {
      await updateNoteApi(id, noteId, body)
    } else {
      await createNoteApi(id, body)
    }

    await refresh()
  }

  async function removeNote(noteId: number) {
    if (!id) {
      return
    }

    await deleteNoteApi(id, noteId)
    await refresh()
  }

  async function saveAppointment(payload: AppointmentPayload, appointmentId?: number) {
    if (!id) {
      return
    }

    if (appointmentId) {
      await updateAppointmentApi(id, appointmentId, payload)
    } else {
      await createAppointmentApi(id, payload)
    }

    await refresh()
  }

  async function removeAppointment(appointmentId: number) {
    if (!id) {
      return
    }

    await deleteAppointmentApi(id, appointmentId)
    await refresh()
  }

  return {
    details,
    error,
    loading,
    refresh,
    removeAppointment,
    removeNote,
    saveAppointment,
    saveNote,
    updateStatus,
  }
}
