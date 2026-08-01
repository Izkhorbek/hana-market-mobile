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

// ── Cikl (Cycle) — fairness guarantee (GAZ spec §10) ────────────────────────

export type GasCycleStatus = 'in_progress' | 'completed'

/** Per-cycle household status (no 'current' — that's session-level). */
export type CycleHouseholdStatus = 'pending' | 'delivered' | 'skipped'

/** A distribution cycle (one full pass 1→N over the mahalla). */
export interface GasCycleDto {
  id: number
  mahalla_id: number
  cycle_number: number
  status: GasCycleStatus
  total_count: number
  delivered_count: number
  skipped_count: number
  /** Last served position — sessions continue from here. */
  current_household_id: number | null
  started_at: string | null
  completed_at: string | null
}

/** One household row within a cycle (authoritative per-cycle roster). */
export interface CycleHouseholdDto {
  household_id: number
  house_number: string
  address_label: string
  status: CycleHouseholdStatus
  /** 0/1/2 — at 2 the household becomes `skipped` for this cycle. */
  miss_count: number
  /** Stable order by street_order + house_number. */
  ordinal: number
  /** Carried over as skipped from the previous cycle → served first. */
  is_priority: boolean
}

/** POST /api/gas/cycles — start a new cycle (blocked if one is in progress). */
export interface CreateGasCycleRequest {
  mahalla_id: number
}

/** SignalR: a cycle was force-broken before completion (accountability). */
export interface GasCycleWarningEvent {
  mahalla_id: number
  cycle_number: number
  forced_by_user_id: number
  unserved_count: number
  reason: string
}
