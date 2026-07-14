export type ProviderCode = 'immobiliare_it' | 'idealista_it' | 'casa_it'
export type TransactionType = 'rent' | 'sale'

export type ProviderContext = {
  locationPath?: string | null
}

export type SearchCriteria = {
  providers: ProviderCode[]
  location: string
  locationPath: string | null
  providerContexts?: Partial<Record<ProviderCode, ProviderContext>>
  pagination?: Partial<Record<ProviderCode, number>>
  transactionType: TransactionType
  maxPrice: number | null
  page: number
}

export type LocationSuggestion = {
  id: string
  type: number
  label: string
  displayLabel: string
  path: string
  providerPaths?: Partial<Record<ProviderCode, string>>
}

export type SearchVariant = {
  provider: ProviderCode
  externalId: string
  sourceUrl: string
  title: string
  transactionType: TransactionType
  price: number | null
  pricePeriod: 'month' | 'week' | 'day' | 'total' | null
  currency: string
  locationLabel: string | null
  propertyType: string | null
  surfaceM2: number | null
  rooms: number | null
  floor: string | null
  shortDescription: string | null
  mainImageUrl: string | null
  advertiserName: string | null
  advertiserType: string | null
}

export type ListingSummary = SearchVariant & {
  variants: SearchVariant[]
  sourceCount: number
  providers: ProviderCode[]
  possibleDuplicate: boolean
}

export type SearchProviderMeta = {
  status: 'success' | 'failed'
  count?: number
  page?: number
  hasNextPage?: boolean
  totalResults?: number | null
  code?: string
  message?: string
}

export type SearchMeta = {
  page: number
  hasNextPage: boolean
  totalResults: number | null
  providers: Partial<Record<ProviderCode, SearchProviderMeta>>
  warnings: string[]
}

export type SearchResponse = {
  data: ListingSummary[]
  meta: SearchMeta
}
