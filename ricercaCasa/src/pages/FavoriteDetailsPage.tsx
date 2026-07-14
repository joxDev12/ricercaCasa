import { Link, useNavigate, useParams } from 'react-router-dom'
import { ErrorMessage } from '../components/feedback/ErrorMessage'
import { LoadingGrid } from '../components/feedback/LoadingGrid'
import { PageContainer } from '../components/layout/PageContainer'
import { ArrowLeftIcon } from '../components/ui/Icons'
import { FavoriteDetails } from '../features/favorites/components/FavoriteDetails'
import { useFavorites } from '../features/favorites/hooks/useFavorites'
import { useDuplicateCandidates } from '../features/duplicates/hooks/useDuplicateCandidates'
import { useListingManagement } from '../features/listing-management/hooks/useListingManagement'

export function FavoriteDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const numericId = id ? Number(id) : null
  const { removeFavorite } = useFavorites()
  const {
    details,
    error,
    loading,
    refresh,
    removeAppointment,
    removeNote,
    saveAppointment,
    saveNote,
    updateStatus,
  } = useListingManagement(numericId)
  const { decide } = useDuplicateCandidates(refresh)

  return (
    <PageContainer>
      <div className="mb-6">
        <Link
          className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          to="/favorites"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Torna ai preferiti
        </Link>
      </div>

      {error ? <ErrorMessage message={error} /> : null}
      {loading && !details ? <LoadingGrid /> : null}
      {details ? (
        <FavoriteDetails
          favorite={details}
          onAppointmentDelete={removeAppointment}
          onAppointmentSave={saveAppointment}
          onDeleteProperty={async () => {
            await removeFavorite(details.id, 'property')
            navigate('/favorites')
          }}
          onDuplicateDecision={decide}
          onNoteDelete={removeNote}
          onNoteSave={saveNote}
          onStatusChange={updateStatus}
        />
      ) : null}
    </PageContainer>
  )
}
