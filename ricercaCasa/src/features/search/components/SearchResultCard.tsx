import { Button } from '../../../components/ui/Button'
import {
  BedIcon,
  BuildingIcon,
  HeartIcon,
  LayersIcon,
  MapPinIcon,
  RulerIcon,
} from '../../../components/ui/Icons'
import { useFavorites } from '../../favorites/hooks/useFavorites'
import type { ListingSummary } from '../types/search.types'
import { formatListingPrice } from '../../../lib/currency'
import { compactText } from '../../../lib/formatters'

type SearchResultCardProps = {
  compact?: boolean
  listing: ListingSummary
}

export function SearchResultCard({ compact = false, listing }: SearchResultCardProps) {
  const { saveFavorite, savedKeys, savingKeys } = useFavorites()
  const variants = listing.variants.length ? listing.variants : [listing]
  const saveKeys = variants.map((variant) => `${variant.provider}:${variant.externalId}`)
  const isSaved = saveKeys.some((key) => savedKeys.has(key))
  const isSaving = saveKeys.some((key) => savingKeys.has(key))

  return (
    <article
      className={`${
        compact
          ? 'flex h-full flex-col'
          : 'grid md:grid-cols-[280px_1fr] xl:grid-cols-[290px_1fr_170px]'
      } gap-5 rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.35)]`}
    >
      <div className="overflow-hidden rounded-[1.25rem] bg-slate-100">
        {listing.mainImageUrl ? (
          <img
            alt={listing.title}
            className={compact ? 'h-56 w-full object-cover' : 'h-full max-h-[210px] w-full object-cover md:max-h-none'}
            src={listing.mainImageUrl}
          />
        ) : (
          <div className="flex h-full min-h-52 items-center justify-center text-sm text-slate-500">
            Nessuna immagine
          </div>
        )}
      </div>

      <div className={compact ? 'flex-1 space-y-4' : 'space-y-4'}>
        <div className="space-y-2">
          <h3 className="font-display text-2xl font-bold leading-tight tracking-[-0.03em] text-slate-950">
            {listing.title}
          </h3>
          <p className="flex items-center gap-2 text-base text-slate-500">
            <MapPinIcon className="h-4 w-4" />
            {compactText(listing.locationLabel, 'Localita non disponibile')}
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
          <p className="flex items-center gap-2">
            <BedIcon className="h-4 w-4" />
            {listing.rooms ? `${listing.rooms} locali` : 'Locali N/D'}
          </p>
          <p className="flex items-center gap-2">
            <RulerIcon className="h-4 w-4" />
            {listing.surfaceM2 ? `${listing.surfaceM2} m²` : 'Superficie N/D'}
          </p>
          <p className="flex items-center gap-2">
            <LayersIcon className="h-4 w-4" />
            {compactText(listing.floor, 'Piano N/D')}
          </p>
        </div>

        <p className="line-clamp-2 text-sm leading-7 text-slate-500">
          {compactText(listing.shortDescription, 'Descrizione non disponibile')}
        </p>

        {listing.advertiserName && (
          <p className="text-sm font-medium text-slate-600">
            Inserzionista: {listing.advertiserName}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {variants.map((variant) => (
            <span
              key={`${variant.provider}:${variant.externalId}`}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              <BuildingIcon className="h-3.5 w-3.5" />
              {variant.provider.replace('_', '.')}
            </span>
          ))}
        </div>

        <p className="text-3xl font-bold tracking-[-0.03em] text-blue-600">
          {formatListingPrice(listing.price, listing.currency, listing.pricePeriod)}
        </p>
      </div>

      <div className={`flex flex-col gap-3 ${compact ? 'mt-auto' : 'xl:justify-center'}`}>
        <Button
          className="gap-3 text-base"
          disabled={isSaved || isSaving}
          onClick={() => saveFavorite(listing)}
        >
          <HeartIcon className="h-5 w-5" />
          {isSaved ? 'Salvato' : isSaving ? 'Salvo...' : 'Salva'}
        </Button>
        <Button
          className="text-base"
          onClick={() =>
            window.open(listing.sourceUrl, '_blank', 'noopener,noreferrer')
          }
          variant="ghost"
        >
          Apri fonte
        </Button>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          {listing.transactionType === 'rent' ? 'Affitto' : 'Compravendita'}
          {listing.sourceCount > 1 ? ` • ${listing.sourceCount} fonti` : ''}
        </p>
      </div>
    </article>
  )
}
