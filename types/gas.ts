// ==================== GAZ (GAS DISTRIBUTION) TYPES ====================
// Live, stateful feature (ARCHITECTURE.md §2 -> modules/Gas + SignalR).
// Mirrors docs/GAZ_NAVBATI_BACKEND_SPEC.md. Status values are snake_case string
// unions matching the backend contract. Pure types — no imports.

export type GasSessionStatus =
  | 'planned'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'

export type GasHouseholdStatus = 'pending' | 'current' | 'delivered' | 'skipped'

export type GasResourceType = 'gas_balloon'

/** A distribution session (GET /api/gas/sessions/active, .../{id}). */
export interface GasSessionDto {
  id: number
  mahalla_id: number
  resource_type: GasResourceType
  scheduled_date: string
  scheduled_time: string | null
  status: GasSessionStatus
  /** Live "where are we now" — the household currently being served. */
  current_household_id: number | null
  delivered_count: number
  total_count: number
  note: string | null
}

/** Current user's own household status within a session (GET .../my-status). */
export interface GasHouseholdStatusDto {
  household_id: number
  address_label: string
  status: GasHouseholdStatus
  /** "Sizgacha N uy" — households ahead in the queue. */
  houses_ahead: number | null
  eta_minutes: number | null
  resident_confirmed: boolean
}

/** One household row in the session queue. */
export interface GasHouseholdRow {
  household_id: number
  street_id: number | null
  house_number: string
  address_label: string
  status: GasHouseholdStatus
  is_mine?: boolean
}

/** One street row in the session route. */
export interface GasStreetRow {
  street_id: number
  name: string
  order_index: number
  delivered_count: number
  total_count: number
}

/** GET /api/gas/sessions/{id} — full session with its queue. */
export interface GasSessionDetailDto {
  session: GasSessionDto
  streets: GasStreetRow[]
  households: GasHouseholdRow[]
}

// ── Requests (admin / session runner) ──────────────────────────────────────

export interface CreateGasSessionRequest {
  mahalla_id: number
  scheduled_date: string
  scheduled_time?: string
  /** Ordered street ids = the route. */
  street_order: number[]
  note?: string
}

export interface UpdateGasPositionRequest {
  current_household_id: number
}

export interface UpdateGasHouseholdStatusRequest {
  status: 'delivered' | 'skipped'
  note?: string
}

export interface ConfirmGasReceiptRequest {
  received: boolean
  note?: string
}

// ── SignalR event payloads (realtime, mahalla:{id} group) ───────────────────

export interface GasSessionStartedEvent {
  session_id: number
  mahalla_id: number
  scheduled_time: string | null
}

export interface GasPositionUpdatedEvent {
  session_id: number
  current_household_id: number | null
  delivered_count: number
  total_count: number
}

export interface GasHouseholdStatusChangedEvent {
  session_id: number
  household_id: number
  status: GasHouseholdStatus
}

export interface GasSessionCompletedEvent {
  session_id: number
}

// ── Fairness / accountability (SIMPLE model — no separate "cycle" object) ────
// Fairness is intrinsic to the session sequence: the backend continues from the
// last-served position and serves previously-skipped households first. There is
// no cycle entity in the app; the only signal kept is the "order broken" warning.

/** SignalR: distribution order was broken (accountability — announced to all members). */
export interface GasCycleWarningEvent {
  mahalla_id: number
  cycle_number: number
  forced_by_user_id: number
  unserved_count: number
  reason: string
}
