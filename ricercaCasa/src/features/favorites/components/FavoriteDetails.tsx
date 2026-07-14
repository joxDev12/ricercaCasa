import { ListingFacts } from '../../listing-management/components/ListingFacts'
import { ListingGallery } from '../../listing-management/components/ListingGallery'
import { ListingSummaryPanel } from '../../listing-management/components/ListingSummaryPanel'
import { ManagementPanel } from '../../listing-management/components/ManagementPanel'
import { SourceVariants } from '../../listing-management/components/SourceVariants'
import { DuplicateCandidatesSection } from '../../duplicates/components/DuplicateCandidatesSection'
import type { FavoriteDetails as FavoriteDetailsType } from '../types/favorite.types'
import type {
  ListingAppointment,
  ManagementStatus,
} from '../../listing-management/types/listingManagement.types'

type FavoriteDetailsProps = {
  favorite: FavoriteDetailsType
  onAppointmentDelete: (appointmentId: number) => Promise<void>
  onAppointmentSave: (
    payload: Pick<ListingAppointment, 'scheduledAt' | 'status' | 'locationText' | 'notes'>,
    appointmentId?: number,
  ) => Promise<void>
  onDeleteProperty: () => void
  onDuplicateDecision: (candidateId: number, decision: 'confirmed' | 'rejected') => Promise<void>
  onNoteDelete: (noteId: number) => Promise<void>
  onNoteSave: (body: string, noteId?: number) => Promise<void>
  onStatusChange: (status: ManagementStatus) => Promise<void>
}

export function FavoriteDetails({
  favorite,
  onAppointmentDelete,
  onAppointmentSave,
  onDeleteProperty,
  onDuplicateDecision,
  onNoteDelete,
  onNoteSave,
  onStatusChange,
}: FavoriteDetailsProps) {
  return (
    <section className="space-y-8 pb-12">
      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <ListingGallery
          fallbackTitle={favorite.representativeListing.title}
          images={favorite.images}
        />
        <ListingSummaryPanel
          details={favorite}
          onDeleteProperty={onDeleteProperty}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <ListingFacts details={favorite} />
        <ManagementPanel
          appointments={favorite.appointments}
          notes={favorite.notes}
          onAppointmentDelete={onAppointmentDelete}
          onAppointmentSave={onAppointmentSave}
          onNoteDelete={onNoteDelete}
          onNoteSave={onNoteSave}
          onStatusChange={onStatusChange}
          status={favorite.managementStatus}
        />
      </div>

      <SourceVariants
        representativeId={favorite.representativeListing.id}
        sources={favorite.sources}
      />
      <DuplicateCandidatesSection
        candidates={favorite.duplicateCandidates}
        onDecision={onDuplicateDecision}
      />
    </section>
  )
}
