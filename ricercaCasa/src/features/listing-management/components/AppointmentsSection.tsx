import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { CalendarIcon, PencilIcon, TrashIcon } from '../../../components/ui/Icons'
import { formatDate } from '../../../lib/formatters'
import type { ListingAppointment } from '../types/listingManagement.types'

type AppointmentsSectionProps = {
  appointments: ListingAppointment[]
  onDelete: (appointmentId: number) => Promise<void>
  onSave: (
    payload: Pick<ListingAppointment, 'scheduledAt' | 'status' | 'locationText' | 'notes'>,
    appointmentId?: number,
  ) => Promise<void>
}

function toDatetimeLocal(value: string) {
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  const normalized = new Date(date.getTime() - offset * 60_000)
  return normalized.toISOString().slice(0, 16)
}

export function AppointmentsSection({
  appointments,
  onDelete,
  onSave,
}: AppointmentsSectionProps) {
  const [editingId, setEditingId] = useState<number | undefined>()
  const [scheduledAt, setScheduledAt] = useState('')
  const [status, setStatus] = useState<ListingAppointment['status']>('scheduled')
  const [locationText, setLocationText] = useState('')
  const [notes, setNotes] = useState('')

  function fillFromAppointment(appointment: ListingAppointment) {
    setEditingId(appointment.id)
    setScheduledAt(toDatetimeLocal(appointment.scheduledAt))
    setStatus(appointment.status)
    setLocationText(appointment.locationText ?? '')
    setNotes(appointment.notes ?? '')
  }

  function reset() {
    setEditingId(undefined)
    setScheduledAt('')
    setStatus('scheduled')
    setLocationText('')
    setNotes('')
  }

  async function handleSubmit() {
    if (!scheduledAt) {
      return
    }

    await onSave(
      {
        scheduledAt: new Date(scheduledAt).toISOString(),
        status,
        locationText: locationText || null,
        notes: notes || null,
      },
      editingId,
    )
    reset()
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <CalendarIcon className="h-5 w-5 text-blue-600" />
        <h4 className="text-lg font-semibold text-slate-950">Appuntamenti</h4>
      </div>

      <div className="grid gap-3">
        <input
          className="h-14 rounded-[1.4rem] border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          onChange={(event) => setScheduledAt(event.target.value)}
          type="datetime-local"
          value={scheduledAt}
        />
        <select
          className="h-14 rounded-[1.4rem] border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          onChange={(event) =>
            setStatus(event.target.value as ListingAppointment['status'])
          }
          value={status}
        >
          <option value="scheduled">Programmato</option>
          <option value="completed">Completato</option>
          <option value="cancelled">Annullato</option>
        </select>
        <input
          className="h-14 rounded-[1.4rem] border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          onChange={(event) => setLocationText(event.target.value)}
          placeholder="Luogo o indicazioni"
          value={locationText}
        />
        <textarea
          className="min-h-24 rounded-[1.4rem] border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Note appuntamento"
          value={notes}
        />
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSubmit}>
          {editingId ? 'Aggiorna appuntamento' : 'Salva appuntamento'}
        </Button>
        {editingId ? (
          <Button onClick={reset} variant="ghost">
            Annulla
          </Button>
        ) : null}
      </div>

      <div className="space-y-3">
        {appointments.length === 0 ? (
          <p className="text-sm text-slate-500">Nessun appuntamento salvato.</p>
        ) : (
          appointments.map((appointment) => (
            <article
              key={appointment.id}
              className="rounded-[1.4rem] border border-slate-200 px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    {formatDate(appointment.scheduledAt)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {appointment.locationText ?? 'Luogo non indicato'}
                  </p>
                  {appointment.notes ? (
                    <p className="mt-2 text-sm leading-7 text-slate-700">
                      {appointment.notes}
                    </p>
                  ) : null}
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => fillFromAppointment(appointment)} variant="ghost">
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => onDelete(appointment.id)} variant="danger">
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
