import { Button } from '../../../components/ui/Button'
import { ExternalLinkIcon } from '../../../components/ui/Icons'
import { formatListingPrice } from '../../../lib/currency'
import { formatDate } from '../../../lib/formatters'
import type { SavedListingSource } from '../types/listingManagement.types'

type SourceVariantsProps = {
  representativeId: number
  sources: SavedListingSource[]
}

export function SourceVariants({
  representativeId,
  sources,
}: SourceVariantsProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_14px_40px_-30px_rgba(15,23,42,0.25)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Fonti collegate
          </p>
          <h3 className="mt-2 font-display text-2xl font-bold tracking-[-0.03em] text-slate-950">
            Stesso immobile, piu pubblicazioni
          </h3>
        </div>
        <p className="text-sm text-slate-500">{sources.length} fonti salvate</p>
      </div>

      <div className="mt-6 space-y-3">
        {sources.map((source) => (
          <article
            key={source.id}
            className="flex flex-col gap-3 rounded-[1.4rem] border border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {source.providerName ?? source.provider}
                {source.id === representativeId ? ' • fonte rappresentativa' : ''}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {formatListingPrice(source.price, source.currency, source.pricePeriod)}
                {' • '}
                aggiornato {formatDate(source.updatedAt ?? source.savedAt ?? null)}
              </p>
            </div>

            <Button
              className="gap-2"
              onClick={() =>
                window.open(source.sourceUrl, '_blank', 'noopener,noreferrer')
              }
              variant="ghost"
            >
              Apri fonte
              <ExternalLinkIcon className="h-4 w-4" />
            </Button>
          </article>
        ))}
      </div>
    </section>
  )
}
