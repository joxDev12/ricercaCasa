import type { ProviderCode, SearchCriteria } from '../types/search.types'
import { useState } from 'react'

export function useSearchForm(initialCriteria: SearchCriteria) {
  const [providers, setProviders] = useState<ProviderCode[]>(initialCriteria.providers)
  const [location, setLocation] = useState(initialCriteria.location)
  const [locationPath, setLocationPath] = useState(
    initialCriteria.locationPath ?? null,
  )
  const [providerContexts, setProviderContexts] = useState(
    initialCriteria.providerContexts,
  )
  const [transactionType, setTransactionType] = useState(initialCriteria.transactionType)
  const [maxPrice, setMaxPrice] = useState(
    initialCriteria.maxPrice ? String(initialCriteria.maxPrice) : '',
  )

  function buildCriteria(page = 1): SearchCriteria {
    return {
      providers,
      location: location.trim(),
      locationPath,
      providerContexts,
      transactionType,
      maxPrice: maxPrice ? Number(maxPrice) : null,
      page,
    }
  }

  function toggleProvider(provider: ProviderCode) {
    setProviders((current) => {
      if (current.includes(provider)) {
        return current.length === 1
          ? current
          : current.filter((item) => item !== provider)
      }

      return [...current, provider]
    })
  }

  return {
    buildCriteria,
    location,
    locationPath,
    maxPrice,
    providers,
    setLocation,
    setLocationPath,
    setProviderContexts,
    setMaxPrice,
    setTransactionType,
    toggleProvider,
    transactionType,
  }
}
