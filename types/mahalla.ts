// ==================== MAHALLA (NEIGHBORHOOD) TYPES ====================
// Membership layer that powers hyperlocal features (gas, announcements, …).
// Mirrors docs/GAZ_NAVBATI_BACKEND_SPEC.md §2 (mahalla, mahalla_member,
// household) and §4.1. Pure types — no imports.

// Hierarchy: mahalla_rais (manager, controls admin roles) > mahalla_admin > distributor > resident.
export type MahallaRole = 'resident' | 'mahalla_admin' | 'distributor' | 'mahalla_rais'

// ── Territory hierarchy: region → district → mahalla (onboarding cascade) ─────

/** GET /api/region → all regions (name ASC). */
export interface RegionDto {
  id: number
  name: string
}

/** GET /api/district?region_id={id} → districts of one region (name ASC). */
export interface DistrictDto {
  id: number
  region_id: number
  name: string
}

export interface MahallaDto {
  id: number
  name: string
  /** Legacy display names (still returned by the backend). */
  district: string
  region: string
  /** Normalized FK ids. Nullable — a not-yet-normalized mahalla can be null. */
  district_id: number | null
  region_id: number | null
}

/** The claimed household (house + address) attached to a membership. */
export interface MahallaHouseholdDto {
  id: number
  house_number: string
  address_label: string | null
  is_verified: boolean
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
  /**
   * The claimed household details (house number + address). Optional/nullable —
   * present once the backend embeds it in /my; rendered defensively otherwise.
   */
  household?: MahallaHouseholdDto | null
  /** Convenience: the mahalla itself, so /my needs no second call. */
  mahalla: MahallaDto
}

/** Query params for GET /api/mahalla (search/select during onboarding). */
export interface MahallaListParams {
  /** Preferred filter — the normalized district FK. */
  district_id?: number
  /** Legacy string filters (kept, still work). */
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

/** State-registry status of a distributor company (from davlat reestri). */
export type DistributorCompanyStatus = 'active' | 'liquidating' | 'suspended'

/**
 * A mahalla gas-distributor company profile (GET /api/mahalla/{id}/distributors).
 * Official/legal fields are entered by the Hana Market platform admin (admin
 * dashboard) — NOT by app users — so residents can verify who supplies their gas.
 */
export interface MahallaDistributorDto {
  id: number
  /** Linked app account that runs live gas sessions, if any (else null). */
  user_id: number | null
  /** Official company or sole-proprietor (YATT) name. */
  company_name: string
  /** STIR (INN) — 9-digit taxpayer identification number. */
  tin: string
  /** Legal (state-registered) address. */
  legal_address: string | null
  /** OKED (IFUT) — activity classifier, "code — name". */
  oked: string | null
  /** Registration status (active / liquidating / suspended). */
  company_status: DistributorCompanyStatus
  /** QQS (VAT) payer status + certificate number. */
  is_vat_payer: boolean
  vat_certificate_no: string | null
  /** State registration date (ISO yyyy-MM-dd) + registry number. */
  registered_at: string | null
  registry_number: string | null
  /** Director F.I.SH. — null for a sole proprietor (YATT). */
  director_name: string | null
  /** Public contact number (E.164) — NOT the private account/OTP phone. */
  phone: string
}
