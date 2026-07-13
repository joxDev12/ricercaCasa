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

    try {
      const nextCriteria = { ...criteria, page: criteria.page + 1 }
      const response = await searchApi(nextCriteria)
      setCriteria(nextCriteria)
      setResultsState([...results, ...response.data], response.meta)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Caricamento fallito')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setCriteria({
      ...criteria,
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
