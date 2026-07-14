import type {
  ProviderCode,
  TransactionType,
} from '../../search/types/search.types'
import type {
  ManagedPropertyDetails,
  ManagementStatus,
} from '../../listing-management/types/listingManagement.types'

export type FavoriteListItem = {
  id: number
  propertyGroupId: number
  provider: ProviderCode
  externalId: string
  sourceUrl: string
  title: string
  transactionType: TransactionType
  propertyType: string | null
  price: number | null
  pricePeriod: 'month' | 'week' | 'day' | 'total' | null
  currency: string
  surfaceM2: number | null
  rooms: number | null
  floor: string | null
  locationLabel: string | null
  mainImageUrl: string | null
  advertiserName: string | null
  advertiserType: string | null
  savedAt: string
  managementStatus: ManagementStatus
  sourceCount: number
  providers: ProviderCode[]
  noteCount: number
  nextAppointmentAt: string | null
}

export type FavoriteDetails = ManagedPropertyDetails

export type FavoritesFilters = {
  page?: number
  limit?: number
  transactionType?: TransactionType | ''
  maxPrice?: number | null
  location?: string
  provider?: ProviderCode | ''
  managementStatus?: ManagementStatus | ''
  hasFutureAppointment?: boolean
  sort?: 'saved_at_desc' | 'price_asc' | 'price_desc' | 'appointment_asc'
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
