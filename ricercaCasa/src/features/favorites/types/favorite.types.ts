import type { ListingSummary, TransactionType } from '../../search/types/search.types'

export type FavoriteListItem = Omit<ListingSummary, 'shortDescription'> & {
  id: number
  savedAt: string
}

export type FavoriteImage = {
  imageUrl: string
  altText: string | null
  position: number
  isPrimary: boolean
}

export type FavoriteDetails = FavoriteListItem & {
  description?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  address?: string | null
  municipality?: string | null
  province?: string | null
  region?: string | null
  postalCode?: string | null
  latitude?: number | null
  longitude?: number | null
  locationPrecision?: string | null
  features?: Record<string, unknown>
  rawData?: Record<string, unknown>
  images: FavoriteImage[]
  updated_at?: string
  created_at?: string
}

export type FavoritesFilters = {
  page?: number
  limit?: number
  transactionType?: TransactionType | ''
  maxPrice?: number | null
  location?: string
  sort?: 'saved_at_desc' | 'price_asc' | 'price_desc'
}

export type FavoritesResponse = {
  data: FavoriteListItem[]
  meta: {
    page: number
    limit: number
    total: number
    hasNextPage: boolean
  }
}
