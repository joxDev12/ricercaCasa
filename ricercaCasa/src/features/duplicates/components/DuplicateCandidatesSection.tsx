import { Button } from '../../../components/ui/Button'
import type { DuplicateCandidate } from '../../listing-management/types/listingManagement.types'

type DuplicateCandidatesSectionProps = {
  candidates: DuplicateCandidate[]
  onDecision: (candidateId: number, decision: 'confirmed' | 'rejected') => Promise<void>
}

export function DuplicateCandidatesSection({
  candidates,
  onDecision,
}: DuplicateCandidatesSectionProps) {
  if (candidates.length === 0) {
    return null
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_14px_40px_-30px_rgba(15,23,42,0.25)]">
      <h3 className="font-display text-3xl font-bold tracking-[-0.03em] text-slate-950">
        Possibili duplicati
      </h3>

      <div className="mt-6 space-y-4">
        {candidates.map((candidate) => (
          <article
            key={candidate.id}
            className="rounded-[1.4rem] border border-slate-200 px-5 py-4"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-600">
              Somiglianza {candidate.similarityLabel}
            </p>
            <p className="mt-3 text-base font-semibold text-slate-950">
              {candidate.listingATitle ?? 'Annuncio A'}
            </p>
            <p className="text-sm text-slate-500">
              {candidate.listingAProvider} • {candidate.listingBProvider}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {candidate.reasons.map((reason) => (
                <span
                  key={`${candidate.id}-${reason.signal}`}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                >
                  {reason.signal}
                </span>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={() => onDecision(candidate.id, 'confirmed')}>
                Conferma duplicato
              </Button>
              <Button onClick={() => onDecision(candidate.id, 'rejected')} variant="ghost">
                Non e lo stesso immobile
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
