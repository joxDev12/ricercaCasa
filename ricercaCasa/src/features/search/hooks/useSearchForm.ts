import { useState } from 'react'
import type { SearchCriteria } from '../types/search.types'

export function useSearchForm(initialCriteria: SearchCriteria) {
  const [location, setLocation] = useState(initialCriteria.location)
  const [locationPath, setLocationPath] = useState(
    initialCriteria.locationPath ?? null,
  )
  const [transactionType, setTransactionType] = useState(initialCriteria.transactionType)
  const [maxPrice, setMaxPrice] = useState(
    initialCriteria.maxPrice ? String(initialCriteria.maxPrice) : '',
  )

  function buildCriteria(page = 1): SearchCriteria {
    return {
      provider: 'immobiliare_it',
      location: location.trim(),
      locationPath,
      transactionType,
      maxPrice: maxPrice ? Number(maxPrice) : null,
      page,
    }
  }

  return {
    buildCriteria,
    location,
    locationPath,
    maxPrice,
    setLocation,
    setLocationPath,
    setMaxPrice,
    setTransactionType,
    transactionType,
  }
}
