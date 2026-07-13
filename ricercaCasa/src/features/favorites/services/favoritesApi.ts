import { apiClient } from '../../../lib/apiClient'
import type {
  FavoriteDetails,
  FavoritesFilters,
  FavoritesResponse,
} from '../types/favorite.types'
import type { ListingSummary } from '../../search/types/search.types'

type SaveFavoriteResponse = {
  status: 'created' | 'updated'
  favorite: FavoriteDetails
}

export function listFavoritesApi(filters: FavoritesFilters) {
  return apiClient<FavoritesResponse>('/api/favorites', { query: filters })
}

export function getFavoriteApi(id: number) {
  return apiClient<{ data: FavoriteDetails }>(`/api/favorites/${id}`)
}

export function deleteFavoriteApi(id: number) {
  return apiClient<void>(`/api/favorites/${id}`, { method: 'DELETE' })
}

export function saveFavoriteApi(listing: ListingSummary) {
  return apiClient<SaveFavoriteResponse>('/api/favorites', {
    method: 'POST',
    body: JSON.stringify(listing),
  })
}
