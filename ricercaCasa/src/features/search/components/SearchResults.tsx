import { Button } from '../../../components/ui/Button'
import { ListIcon } from '../../../components/ui/Icons'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { ErrorMessage } from '../../../components/feedback/ErrorMessage'
import { LoadingGrid } from '../../../components/feedback/LoadingGrid'
import { usePropertySearch } from '../hooks/usePropertySearch'
import { SearchResultCard } from './SearchResultCard'

export function SearchResults() {
  const { error, loadMore, loading, meta, results } = usePropertySearch()

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

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-10 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="flex items-center gap-3 text-3xl font-bold tracking-[-0.03em] text-slate-950">
            <ListIcon className="h-6 w-6 text-slate-500" />
            Risultati
          </p>
          <p className="text-sm text-slate-500">
            Pagina {meta?.page ?? 1}
            {meta?.totalResults ? ` • ${meta.totalResults} annunci letti` : ''}
          </p>
        </div>
        <p className="text-sm text-slate-500">
          Salva solo annunci che vuoi tenere nel database locale.
        </p>
      </div>

      <div className="space-y-4">
        {results.map((listing) => (
          <SearchResultCard key={listing.externalId} listing={listing} />
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
