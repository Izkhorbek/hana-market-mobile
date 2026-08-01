// ==================== MAHALLA (NEIGHBORHOOD) TYPES ====================
// Membership layer that powers hyperlocal features (gas, announcements, …).
// Mirrors docs/GAZ_NAVBATI_BACKEND_SPEC.md §2 (mahalla, mahalla_member,
// household) and §4.1. Pure types — no imports.

// Hierarchy: mahalla_rais (manager, controls admin roles) > mahalla_admin > distributor > resident.
export type MahallaRole = 'resident' | 'mahalla_admin' | 'distributor' | 'mahalla_rais'

export interface MahallaDto {
  id: number
  name: string
  district: string
  region: string
}

/** The current user's membership in a mahalla (GET /api/mahalla/my). */
export interface MahallaMemberDto {
  id: number
  mahalla_id: number
  user_id: number
  role: MahallaRole
  /** false = pending (awaiting the rais's verification). */
  is_verified: boolean
  household_id: number | null
  /** Convenience: the mahalla itself, so /my needs no second call. */
  mahalla: MahallaDto
}

/** Query params for GET /api/mahalla (search/select during onboarding). */
export interface MahallaListParams {
  region?: string
  district?: string
  search?: string
}

/** POST /api/mahalla/join — link the user to a mahalla + claim a household. */
export interface JoinMahallaRequest {
  mahalla_id: number
  house_number: string
  street_name?: string
}

/** A mahalla distributor's public contact (GET /api/mahalla/{id}/distributors). */
export interface MahallaDistributorDto {
  user_id: number
  name: string
  /** Public contact number (E.164) — NOT the private account/OTP phone. */
  phone: string
}
