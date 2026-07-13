export type TransactionType = 'rent' | 'sale'

export type SearchCriteria = {
  provider: 'immobiliare_it'
  location: string
  locationPath: string | null
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
}

export type ListingSummary = {
  provider: 'immobiliare_it'
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

export type SearchMeta = {
  page: number
  hasNextPage: boolean
  totalResults: number | null
}

export type SearchResponse = {
  data: ListingSummary[]
  meta: SearchMeta
}
