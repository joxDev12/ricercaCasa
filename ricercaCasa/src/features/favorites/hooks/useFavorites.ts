import { useState } from 'react'
import { useFavoritesContext } from '../../../context/useFavoritesContext'
import {
  deleteFavoriteApi,
  listFavoritesApi,
  saveFavoriteApi,
} from '../services/favoritesApi'
import type {
  FavoritesFilters,
  FavoritesResponse,
} from '../types/favorite.types'
import type { ListingSummary } from '../../search/types/search.types'

export function useFavorites() {
  const { refreshSavedIds, savedKeys, savingKeys, setSavingKey } = useFavoritesContext()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function saveFavorite(listing: ListingSummary) {
    const key = `${listing.provider}:${listing.externalId}`
    setSavingKey(key, true)
    setError(null)

    try {
      const response = await saveFavoriteApi(listing)
      await refreshSavedIds()
      return response
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Salvataggio fallito')
      throw caught
    } finally {
      setSavingKey(key, false)
    }
  }

  async function listFavorites(filters: FavoritesFilters): Promise<FavoritesResponse> {
    setLoading(true)
    setError(null)

    try {
      return await listFavoritesApi(filters)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Caricamento fallito')
      throw caught
    } finally {
      setLoading(false)
    }
  }

  async function removeFavorite(id: number) {
    setLoading(true)
    setError(null)

    try {
      await deleteFavoriteApi(id)
      await refreshSavedIds()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Eliminazione fallita')
      throw caught
    } finally {
      setLoading(false)
    }
  }

  return { error, listFavorites, loading, removeFavorite, saveFavorite, savedKeys, savingKeys }
}
