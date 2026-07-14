import { useEffect, useState } from 'react'
import { listProvidersApi } from '../services/providersApi'
import type { ProviderInfo } from '../types/provider.types'

const fallbackProviders: ProviderInfo[] = [
  { code: 'immobiliare_it', name: 'Immobiliare.it' },
  { code: 'idealista_it', name: 'Idealista' },
  { code: 'casa_it', name: 'Casa.it' },
]

export function useProviders() {
  const [providers, setProviders] = useState<ProviderInfo[]>(fallbackProviders)

  useEffect(() => {
    listProvidersApi()
      .then((response) => {
        if (response.data.length) {
          setProviders(response.data)
        }
      })
      .catch(() => undefined)
  }, [])

  return providers
}
