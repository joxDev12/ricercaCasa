import { formatListingPrice } from '../../../lib/currency'
import { compactText, formatDate } from '../../../lib/formatters'
import type { FavoriteDetails as FavoriteDetailsType } from '../types/favorite.types'

type FavoriteDetailsProps = {
  favorite: FavoriteDetailsType
}

export function FavoriteDetails({ favorite }: FavoriteDetailsProps) {
  return (
    <section className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            {favorite.provider}
          </p>
          <h2 className="font-display text-4xl font-bold leading-tight tracking-[-0.04em] text-slate-950">
            {favorite.title}
          </h2>
          <p className="text-3xl font-bold text-blue-600">
            {formatListingPrice(
              favorite.price,
              favorite.currency,
              favorite.pricePeriod,
            )}
          </p>
          <p className="text-sm leading-7 text-slate-500">
            {compactText(favorite.description, 'Descrizione completa non disponibile')}
          </p>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.35)]">
          <dl className="grid gap-4 text-sm text-slate-700">
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Operazione
              </dt>
              <dd>{favorite.transactionType === 'rent' ? 'Affitto' : 'Vendita'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Localita
              </dt>
              <dd>{compactText(favorite.locationLabel)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Indirizzo
              </dt>
              <dd>{compactText(favorite.address)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Aggiornato
              </dt>
              <dd>{formatDate(favorite.updated_at)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {favorite.images.map((image) => (
          <img
            key={`${image.imageUrl}-${image.position}`}
            alt={image.altText ?? favorite.title}
            className="h-64 w-full rounded-[2rem] object-cover shadow-lg shadow-stone-950/5"
            src={image.imageUrl}
          />
        ))}
      </div>
    </section>
  )
}
