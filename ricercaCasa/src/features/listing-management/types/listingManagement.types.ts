import type { ProviderCode, SearchVariant } from '../../search/types/search.types'

export type ManagementStatus =
  | 'saved'
  | 'to_contact'
  | 'contacted'
  | 'appointment_scheduled'
  | 'visited'
  | 'discarded'

export type FavoriteImage = {
  imageUrl: string
  altText: string | null
  position: number
  isPrimary: boolean
}

export type SavedListingSource = SearchVariant & {
  id: number
  propertyGroupId: number
  providerName?: string
  description?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  totalFloors?: number | null
  elevator?: boolean | null
  furnished?: boolean | null
  propertyCondition?: string | null
  heating?: string | null
  energyClass?: string | null
  condominiumFees?: number | null
  availability?: string | null
  address?: string | null
  street?: string | null
  civicNumber?: string | null
  district?: string | null
  municipality?: string | null
  province?: string | null
  region?: string | null
  postalCode?: string | null
  latitude?: number | null
  longitude?: number | null
  locationPrecision?: string | null
  features?: Record<string, unknown>
  rawData?: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
  savedAt?: string
}

export type ListingNote = {
  id: number
  propertyGroupId: number
  body: string
  createdAt: string
  updatedAt: string
}

export type ListingAppointment = {
  id: number
  propertyGroupId: number
  scheduledAt: string
  status: 'scheduled' | 'completed' | 'cancelled'
  locationText: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type DuplicateCandidate = {
  id: number
  listingAId: number
  listingBId: number
  score: number
  status: 'pending' | 'auto_confirmed' | 'confirmed' | 'rejected'
  reasons: Array<{ signal: string; weight: number }>
  similarityLabel: 'alta' | 'media' | 'bassa'
  listingATitle?: string
  listingBTitle?: string
  listingAProvider?: ProviderCode
  listingBProvider?: ProviderCode
}

export type ManagedPropertyDetails = {
  id: number
  propertyGroupId: number
  managementStatus: ManagementStatus
  representativeListing: SavedListingSource
  sources: SavedListingSource[]
  images: FavoriteImage[]
  notes: ListingNote[]
  appointments: ListingAppointment[]
  duplicateCandidates: DuplicateCandidate[]
}
