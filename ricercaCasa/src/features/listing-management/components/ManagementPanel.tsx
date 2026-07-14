import { ManagementStatusSelect } from './ManagementStatusSelect'
import { NotesSection } from './NotesSection'
import { AppointmentsSection } from './AppointmentsSection'
import type {
  ListingAppointment,
  ListingNote,
  ManagementStatus,
} from '../types/listingManagement.types'

type ManagementPanelProps = {
  appointments: ListingAppointment[]
  notes: ListingNote[]
  onAppointmentDelete: (appointmentId: number) => Promise<void>
  onAppointmentSave: (
    payload: Pick<ListingAppointment, 'scheduledAt' | 'status' | 'locationText' | 'notes'>,
    appointmentId?: number,
  ) => Promise<void>
  onNoteDelete: (noteId: number) => Promise<void>
  onNoteSave: (body: string, noteId?: number) => Promise<void>
  onStatusChange: (status: ManagementStatus) => Promise<void>
  status: ManagementStatus
}

export function ManagementPanel({
  appointments,
  notes,
  onAppointmentDelete,
  onAppointmentSave,
  onNoteDelete,
  onNoteSave,
  onStatusChange,
  status,
}: ManagementPanelProps) {
  return (
    <section className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_14px_40px_-30px_rgba(15,23,42,0.25)]">
      <h3 className="font-display text-3xl font-bold tracking-[-0.03em] text-slate-950">
        Gestione annuncio
      </h3>

      <ManagementStatusSelect onChange={onStatusChange} value={status} />
      <AppointmentsSection
        appointments={appointments}
        onDelete={onAppointmentDelete}
        onSave={onAppointmentSave}
      />
      <NotesSection notes={notes} onDelete={onNoteDelete} onSave={onNoteSave} />
    </section>
  )
}
