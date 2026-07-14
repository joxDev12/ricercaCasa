import {
  createContext,
  useEffect,
  startTransition,
  useState,
  type PropsWithChildren,
} from 'react'
import type {
  ListingSummary,
  ProviderCode,
  SearchCriteria,
  SearchMeta,
} from '../features/search/types/search.types'

type SearchContextValue = {
  criteria: SearchCriteria
  error: string | null
  loading: boolean
  meta: SearchMeta | null
  results: ListingSummary[]
  setCriteria: (next: SearchCriteria) => void
  setError: (next: string | null) => void
  setLoading: (next: boolean) => void
  setResultsState: (items: ListingSummary[], meta: SearchMeta | null) => void
}

const defaultCriteria: SearchCriteria = {
  providers: ['immobiliare_it', 'idealista_it', 'casa_it'],
  location: '',
  locationPath: null,
  transactionType: 'sale',
  maxPrice: null,
  page: 1,
}

const STORAGE_KEY = 'ricercaCasa.searchState.v2'

function readPersistedState() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return null
    }

    return JSON.parse(raw) as {
      criteria?: SearchCriteria
      meta?: SearchMeta | null
      results?: ListingSummary[]
    }
  } catch {
    return null
  }
}

const SearchContext = createContext<SearchContextValue | null>(null)

export function SearchProvider({ children }: PropsWithChildren) {
  const persisted = readPersistedState()
  const normalizedCriteria = persisted?.criteria
    ? {
        ...defaultCriteria,
        ...persisted.criteria,
        providers:
          persisted.criteria.providers?.length
            ? persisted.criteria.providers
            : (persisted.criteria as SearchCriteria & { provider?: ProviderCode }).provider
              ? [
                  (persisted.criteria as SearchCriteria & {
                    provider?: ProviderCode
                  }).provider as ProviderCode,
                ]
            : defaultCriteria.providers,
      }
    : defaultCriteria
  const [criteria, setCriteria] = useState(
    normalizedCriteria,
  )
  const [results, setResults] = useState<ListingSummary[]>(
    persisted?.results ?? [],
  )
  const [meta, setMeta] = useState<SearchMeta | null>(persisted?.meta ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setResultsState(items: ListingSummary[], nextMeta: SearchMeta | null) {
    startTransition(() => {
      setResults(items)
      setMeta(nextMeta)
    })
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ criteria, meta, results }),
    )
  }, [criteria, meta, results])

  return (
    <SearchContext.Provider
      value={{
        criteria,
        error,
        loading,
        meta,
        results,
        setCriteria,
        setError,
        setLoading,
        setResultsState,
      }}
    >
      {children}
    </SearchContext.Provider>
  )
}

export { SearchContext }
