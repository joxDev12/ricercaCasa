import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import {
  BedIcon,
  CalendarIcon,
  LayersIcon,
  MapPinIcon,
  NoteIcon,
  RulerIcon,
} from '../../../components/ui/Icons'
import { formatListingPrice } from '../../../lib/currency'
import { formatDate } from '../../../lib/formatters'
import type { FavoriteListItem } from '../types/favorite.types'

type FavoriteCardProps = {
  compact?: boolean
  favorite: FavoriteListItem
  onDelete: (id: number) => void
}

export function FavoriteCard({ compact = false, favorite, onDelete }: FavoriteCardProps) {
  return (
    <article
      className={`${
        compact
          ? 'flex h-full flex-col'
          : 'grid md:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_220px]'
      } gap-5 rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.35)]`}
    >
      <div className="overflow-hidden rounded-[1.25rem] bg-slate-100">
        {favorite.mainImageUrl ? (
          <img
            alt={favorite.title}
            className={compact ? 'h-56 w-full object-cover' : 'h-full max-h-[210px] w-full object-cover md:max-h-none'}
            src={favorite.mainImageUrl}
          />
        ) : (
          <div className="flex h-full min-h-52 items-center justify-center text-sm text-slate-500">
            Nessuna immagine
          </div>
        )}
      </div>

      <div className={compact ? 'flex-1 space-y-4' : 'space-y-4'}>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Salvato il {formatDate(favorite.savedAt)}
          </p>
          <h3 className="font-display text-2xl font-bold tracking-[-0.03em] text-slate-950">
            {favorite.title}
          </h3>
          <p className="flex items-center gap-2 text-base text-slate-500">
            <MapPinIcon className="h-4 w-4" />
            {favorite.locationLabel ?? 'N/D'}
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
          <p className="flex items-center gap-2">
            <BedIcon className="h-4 w-4" />
            {favorite.rooms ? `${favorite.rooms} locali` : 'Locali N/D'}
          </p>
          <p className="flex items-center gap-2">
            <RulerIcon className="h-4 w-4" />
            {favorite.surfaceM2 ? `${favorite.surfaceM2} m²` : 'Superficie N/D'}
          </p>
          <p className="flex items-center gap-2">
            <LayersIcon className="h-4 w-4" />
            {favorite.floor ?? 'Piano N/D'}
          </p>
        </div>

        <p className="text-3xl font-bold tracking-[-0.03em] text-blue-600">
          {formatListingPrice(favorite.price, favorite.currency, favorite.pricePeriod)}
        </p>

        <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          <span>{favorite.managementStatus.replaceAll('_', ' ')}</span>
          <span>{favorite.sourceCount} fonti</span>
          <span className="capitalize">{favorite.providers.join(' • ')}</span>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
          <p className="flex items-center gap-2">
            <NoteIcon className="h-4 w-4" />
            {favorite.noteCount} note
          </p>
          <p className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {favorite.nextAppointmentAt
              ? formatDate(favorite.nextAppointmentAt)
              : 'Nessuna visita'}
          </p>
        </div>
      </div>

      <div className={`flex flex-col gap-3 ${compact ? 'mt-auto' : 'xl:justify-center'}`}>
          <Link
            className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
            to={`/favorites/${favorite.id}`}
          >
            Dettaglio
          </Link>
          <Button className="text-base" onClick={() => onDelete(favorite.id)} variant="danger">
            Rimuovi
          </Button>
      </div>
    </article>
  )
}
