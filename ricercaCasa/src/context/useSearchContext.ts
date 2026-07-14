import { useContext } from 'react'
import { SearchContext } from './SearchContext'

export function useSearchContext() {
  const context = useContext(SearchContext)

  if (!context) {
    throw new Error('SearchContext mancante')
  }

  return context
}
