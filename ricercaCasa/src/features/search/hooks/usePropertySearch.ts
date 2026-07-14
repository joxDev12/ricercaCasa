import { useSearchContext } from '../../../context/useSearchContext'
import { searchApi } from '../services/searchApi'
import type { SearchCriteria } from '../types/search.types'

export function usePropertySearch() {
  const {
    criteria,
    error,
    loading,
    meta,
    results,
    setCriteria,
    setError,
    setLoading,
    setResultsState,
  } = useSearchContext()

  async function search(nextCriteria: SearchCriteria) {
    setLoading(true)
    setError(null)

    try {
      const response = await searchApi(nextCriteria)
      setCriteria(nextCriteria)
      setResultsState(response.data, response.meta)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Ricerca fallita')
    } finally {
      setLoading(false)
    }
  }

  async function loadMore() {
    if (!meta?.hasNextPage || loading) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const providers = criteria.providers.filter(
        (provider) => meta.providers[provider]?.hasNextPage,
      )
      const pagination = Object.fromEntries(
        providers.map((provider) => [
          provider,
          (meta.providers[provider]?.page ?? criteria.page) + 1,
        ]),
      )
      const nextCriteria = { ...criteria, providers, pagination, page: criteria.page + 1 }
      const response = await searchApi(nextCriteria)
      const seen = new Set(
        results.map((listing) => `${listing.provider}:${listing.externalId}`),
      )
      const newResults = response.data.filter(
        (listing) => !seen.has(`${listing.provider}:${listing.externalId}`),
      )

      if (!newResults.length) {
        setResultsState(results, {
          ...response.meta,
          page: criteria.page,
          hasNextPage: false,
        })
        return
      }

      setCriteria({ ...criteria, pagination, page: nextCriteria.page })
      setResultsState([...results, ...newResults], response.meta)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Caricamento fallito')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setCriteria({
      ...criteria,
      providers: criteria.providers,
      location: '',
      locationPath: null,
      maxPrice: null,
      page: 1,
    })
    setError(null)
    setResultsState([], null)
  }

  return { error, loadMore, loading, meta, reset, results, search }
}
