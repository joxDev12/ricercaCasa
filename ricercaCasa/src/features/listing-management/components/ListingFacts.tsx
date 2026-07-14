import { compactText } from '../../../lib/formatters'
import type { ManagedPropertyDetails } from '../types/listingManagement.types'

type ListingFactsProps = {
  details: ManagedPropertyDetails
}

const fields = [
  { key: 'propertyType', label: 'Tipologia' },
  { key: 'propertyCondition', label: 'Stato' },
  { key: 'surfaceM2', label: 'Superficie', suffix: ' m²' },
  { key: 'rooms', label: 'Locali' },
  { key: 'bedrooms', label: 'Camere' },
  { key: 'bathrooms', label: 'Bagni' },
  { key: 'floor', label: 'Piano' },
  { key: 'totalFloors', label: 'Piani edificio' },
  { key: 'elevator', label: 'Ascensore' },
  { key: 'furnished', label: 'Arredato' },
  { key: 'heating', label: 'Riscaldamento' },
  { key: 'energyClass', label: 'Classe energetica' },
  { key: 'condominiumFees', label: 'Spese condominiali', suffix: ' € / mese' },
  { key: 'availability', label: 'Disponibilita' },
] as const

function formatFact(value: unknown, suffix = '') {
  if (value === true) return 'Si'
  if (value === false) return 'No'
  if (value === null || value === undefined || value === '') return 'N/D'
  return `${String(value)}${suffix}`
}

export function ListingFacts({ details }: ListingFactsProps) {
  const listing = details.representativeListing

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_14px_40px_-30px_rgba(15,23,42,0.25)]">
      <h3 className="font-display text-3xl font-bold tracking-[-0.03em] text-slate-950">
        Dettagli dell&apos;immobile
      </h3>
      <p className="mt-4 text-base leading-8 text-slate-500">
        {compactText(
          listing.description,
          'I dati mostrati sono quelli salvati localmente dalla fonte rappresentativa.',
        )}
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => (
          <article
            key={field.key}
            className="rounded-[1.4rem] border border-slate-200 bg-slate-50 px-5 py-4"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              {field.label}
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {formatFact(listing[field.key], 'suffix' in field ? field.suffix : '')}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
