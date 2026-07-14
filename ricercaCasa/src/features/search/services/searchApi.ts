import { apiClient } from '../../../lib/apiClient'
import type {
  LocationSuggestion,
  SearchCriteria,
  SearchResponse,
} from '../types/search.types'

export function searchApi(criteria: SearchCriteria) {
  return apiClient<SearchResponse>('/api/search', {
    method: 'POST',
    body: JSON.stringify(criteria),
  })
}

export function locationSuggestionsApi(
  query: string,
  signal: AbortSignal,
  context: {
    label?: string
    path?: string | null
    providers?: string[]
  },
) {
  return apiClient<{ data: LocationSuggestion[] }>('/api/search/locations', {
    signal,
    query: {
      q: query,
      contextLabel: context.label,
      contextPath: context.path,
      providers: context.providers?.join(','),
    },
  })
}
