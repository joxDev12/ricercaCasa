import type { PropsWithChildren } from 'react'
import { FavoritesProvider } from '../context/FavoritesContext'
import { SearchProvider } from '../context/SearchContext'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <FavoritesProvider>
      <SearchProvider>{children}</SearchProvider>
    </FavoritesProvider>
  )
}
