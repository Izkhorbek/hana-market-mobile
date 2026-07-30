// ==================== SERVICE (XIZMAT) TYPES ====================
// Xizmat is a separate domain from Product (its own DB table). Providers are
// contacted by phone (Path A) — there is intentionally NO chat/product coupling
// here. DTOs are snake_case at the boundary, mirroring the Product contract.
// See ARCHITECTURE.md §2 (global, stateless CRUD feature) and §4.

import type {
  ECurrencyType,
  EServiceCategory,
  EServicePriceType,
} from '@/constants/enums'
import type { User } from './index'

export type ServiceStatus = 'active' | 'hidden'

/** POST /api/service/create — multipart FormData (mirrors product create). */
export interface ServiceCreateRequest {
  category: EServiceCategory
  title: string
  description?: string
  price_type: EServicePriceType
  currency_type?: ECurrencyType
  price_uzs?: number
  price_usd?: number
  /** Public contact number (E.164, e.g. +99890...). Shown on the card. */
  phone_number: string
  latitude?: number
  longitude?: number
  /** Landmark ("mo'ljal"). */
  moljal?: string
  /** Free-form working hours, e.g. "9:00–18:00". */
  availability?: string
  images_json?: string // JSON.stringify(DraftImageDto[])
}

export interface ServiceUpdateRequest {
  category?: EServiceCategory
  title?: string
  description?: string
  price_type?: EServicePriceType
  currency_type?: ECurrencyType
  price_uzs?: number
  price_usd?: number
  phone_number?: string
  moljal?: string
  availability?: string
  status?: ServiceStatus
}

/** One row of GET /api/service/all (paginated, distance-scoped). */
export interface ServiceListItemDto {
  id: number
  category: EServiceCategory
  category_name: string | null
  title: string | null
  description: string | null
  price: string | null
  price_type: EServicePriceType
  price_type_name: string | null
  phone_number: string | null
  main_image_url: string | null
  distance: string | null
  moljal: string | null
  created_ago: string | null
}

/** GET /api/service/{id} — full detail. */
export interface SingleServiceDto {
  id: number
  user_id: number
  provider: User
  category: EServiceCategory
  category_name: string | null
  title: string
  description: string | null
  price: string | null
  price_type: EServicePriceType
  price_type_name: string | null
  currency_type: ECurrencyType
  phone_number: string | null
  latitude: number | null
  longitude: number | null
  moljal: string | null
  availability: string | null
  status: ServiceStatus
  images: string[]
  distance: string | null
  created_ago: string | null
  created_at: string
}

/** Query params for GET /api/service/all. */
export interface ServiceListParams {
  user_lat: number
  user_long: number
  current_page?: number
  page_size?: number
  category?: EServiceCategory
  search_query?: string
  radius_km?: number
}
