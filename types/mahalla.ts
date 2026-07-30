// ==================== MAHALLA (NEIGHBORHOOD) TYPES ====================
// Membership layer that powers hyperlocal features (gas, announcements, …).
// Mirrors docs/GAZ_NAVBATI_BACKEND_SPEC.md §2 (mahalla, mahalla_member,
// household) and §4.1. Pure types — no imports.

export type MahallaRole = 'resident' | 'mahalla_admin' | 'distributor'

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
