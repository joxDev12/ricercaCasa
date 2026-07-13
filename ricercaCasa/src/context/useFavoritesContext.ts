import { useContext } from 'react'
import { FavoritesContext } from './FavoritesContext'

export function useFavoritesContext() {
  const context = useContext(FavoritesContext)

  if (!context) {
    throw new Error('FavoritesContext mancante')
  }

  return context
}
