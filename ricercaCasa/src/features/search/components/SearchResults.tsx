import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { ListIcon } from '../../../components/ui/Icons'
import { ViewModeToggle, type ViewMode } from '../../../components/ui/ViewModeToggle'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { ErrorMessage } from '../../../components/feedback/ErrorMessage'
import { LoadingGrid } from '../../../components/feedback/LoadingGrid'
import { usePropertySearch } from '../hooks/usePropertySearch'
import { SearchResultCard } from './SearchResultCard'

export function SearchResults() {
  const { error, loadMore, loading, meta, results } = usePropertySearch()
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  if (loading && results.length === 0) {
    return <LoadingGrid />
  }

  if (error && results.length === 0) {
    return <ErrorMessage message={error} />
  }

  if (results.length === 0) {
    return (
      <EmptyState
        description="Cerca per zona, tipo operazione e budget. I risultati restano temporanei finche non salvi."
        title="Nessun risultato da mostrare"
      />
    )
  }

  return (
    <section className="space-y-6 pt-4">
      {error ? <ErrorMessage message={error} /> : null}
      {meta?.warnings?.length ? (
        <ErrorMessage message={meta.warnings.join(' • ')} />
      ) : null}

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-10 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="flex items-center gap-3 text-3xl font-bold tracking-[-0.03em] text-slate-950">
            <ListIcon className="h-6 w-6 text-slate-500" />
            Risultati
          </p>
          <p className="text-sm text-slate-500">
            Pagina {meta?.page ?? 1}
            {meta?.totalResults ? ` • ${meta.totalResults} gruppi annuncio` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-sm text-slate-500">
            Salva solo immobili che vuoi tenere nel database locale.
          </p>
          <ViewModeToggle onChange={setViewMode} value={viewMode} />
        </div>
      </div>

      <div className={viewMode === 'grid' ? 'grid gap-5 md:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}>
        {results.map((listing) => (
          <SearchResultCard
            compact={viewMode === 'grid'}
            key={listing.externalId}
            listing={listing}
          />
        ))}
      </div>

      {meta?.hasNextPage ? (
        <div className="flex justify-center">
          <Button disabled={loading} onClick={() => loadMore()} variant="ghost">
            {loading ? 'Carico...' : 'Carica altri'}
          </Button>
        </div>
      ) : null}
    </section>
  )
}
