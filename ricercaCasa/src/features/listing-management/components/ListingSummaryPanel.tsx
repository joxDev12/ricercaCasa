import { Button } from '../../../components/ui/Button'
import { ExternalLinkIcon, MapPinIcon } from '../../../components/ui/Icons'
import { formatListingPrice } from '../../../lib/currency'
import { compactText } from '../../../lib/formatters'
import type { ManagedPropertyDetails } from '../types/listingManagement.types'

type ListingSummaryPanelProps = {
  details: ManagedPropertyDetails
  onDeleteProperty: () => void
}

const transactionLabel = {
  rent: 'AFFITTO',
  sale: 'VENDITA',
}

export function ListingSummaryPanel({
  details,
  onDeleteProperty,
}: ListingSummaryPanelProps) {
  const listing = details.representativeListing

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.35)]">
      <div className="flex flex-wrap gap-3">
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold tracking-[0.16em] text-blue-700">
          {transactionLabel[listing.transactionType]}
        </span>
        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500">
          {listing.providerName ?? listing.provider}
        </span>
      </div>

      <h2 className="mt-6 font-display text-4xl font-bold leading-tight tracking-[-0.04em] text-slate-950">
        {listing.title}
      </h2>

      <p className="mt-4 flex items-center gap-2 text-base text-slate-500">
        <MapPinIcon className="h-4 w-4" />
        {compactText(listing.locationLabel)}
      </p>

      <p className="mt-8 text-4xl font-bold tracking-[-0.04em] text-blue-600">
        {formatListingPrice(listing.price, listing.currency, listing.pricePeriod)}
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Button
          className="gap-3"
          onClick={() => window.open(listing.sourceUrl, '_blank', 'noopener,noreferrer')}
        >
          Apri fonte
          <ExternalLinkIcon className="h-4 w-4" />
        </Button>
        <Button onClick={onDeleteProperty} variant="ghost">
          Elimina immobile dai preferiti
        </Button>
      </div>
    </section>
  )
}
