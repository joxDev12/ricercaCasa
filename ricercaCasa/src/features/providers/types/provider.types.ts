import type { ProviderCode } from '../../search/types/search.types'

export type ProviderInfo = {
  code: ProviderCode
  name: string
  baseUrl?: string
}
