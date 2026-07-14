import { apiClient } from '../../../lib/apiClient'
import type { ProviderInfo } from '../types/provider.types'

export function listProvidersApi() {
  return apiClient<{ data: ProviderInfo[] }>('/api/providers')
}
