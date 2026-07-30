import { create } from 'zustand'
import type {
  GasHouseholdStatusChangedEvent,
  GasHouseholdStatusDto,
  GasPositionUpdatedEvent,
  GasSessionCompletedEvent,
  GasSessionDetailDto,
  GasSessionDto,
  GasSessionStartedEvent,
} from '@/types'

/**
 * Gaz navbati live store (ARCHITECTURE.md §2/§3). REST hooks (useGas) SEED this
 * store; SignalR events (wired separately) PATCH it via the apply* actions.
 * Pure state — no SignalR or service imports, so it stays trivially testable
 * and cannot affect the chat realtime layer.
 */
interface GasState {
  /** The mahalla whose session we're tracking. */
  mahallaId: number | null
  /** The active/planned session (resident banner + card). */
  session: GasSessionDto | null
  /** The current user's own household status in the session. */
  myStatus: GasHouseholdStatusDto | null
  /** Full queue (streets + households) when the tracker screen is open. */
  detail: GasSessionDetailDto | null

  // ── Seeders (from REST) ──
  setMahallaId: (id: number | null) => void
  setSession: (session: GasSessionDto | null) => void
  setMyStatus: (status: GasHouseholdStatusDto | null) => void
  setDetail: (detail: GasSessionDetailDto | null) => void

  // ── Realtime patches (from SignalR) ──
  applySessionStarted: (e: GasSessionStartedEvent) => void
  applyPositionUpdate: (e: GasPositionUpdatedEvent) => void
  applyHouseholdStatusChange: (e: GasHouseholdStatusChangedEvent) => void
  applySessionCompleted: (e: GasSessionCompletedEvent) => void

  reset: () => void
}

export const useGasStore = create<GasState>((set, get) => ({
  mahallaId: null,
  session: null,
  myStatus: null,
  detail: null,

  setMahallaId: (id) => set({ mahallaId: id }),
  setSession: (session) => set({ session }),
  setMyStatus: (status) => set({ myStatus: status }),
  setDetail: (detail) => set({ detail }),

  applySessionStarted: (e) => {
    const { session } = get()
    if (session && session.id === e.session_id) {
      set({ session: { ...session, status: 'active' } })
    }
  },

  applyPositionUpdate: (e) => {
    const { session, detail, myStatus } = get()

    const nextSession =
      session && session.id === e.session_id
        ? {
            ...session,
            current_household_id: e.current_household_id,
            delivered_count: e.delivered_count,
            total_count: e.total_count,
          }
        : session

    // Recompute "houses ahead" if both my house and the current house are in the queue.
    let nextMyStatus = myStatus
    if (
      myStatus &&
      detail &&
      detail.session.id === e.session_id &&
      e.current_household_id != null
    ) {
      const order = detail.households
      const currentIdx = order.findIndex((h) => h.household_id === e.current_household_id)
      const myIdx = order.findIndex((h) => h.household_id === myStatus.household_id)
      if (currentIdx >= 0 && myIdx >= 0) {
        nextMyStatus = { ...myStatus, houses_ahead: Math.max(0, myIdx - currentIdx) }
      }
    }

    set({ session: nextSession, myStatus: nextMyStatus })
  },

  applyHouseholdStatusChange: (e) => {
    const { detail, myStatus } = get()

    const nextDetail =
      detail && detail.session.id === e.session_id
        ? {
            ...detail,
            households: detail.households.map((h) =>
              h.household_id === e.household_id ? { ...h, status: e.status } : h,
            ),
          }
        : detail

    const nextMyStatus =
      myStatus && myStatus.household_id === e.household_id
        ? { ...myStatus, status: e.status }
        : myStatus

    set({ detail: nextDetail, myStatus: nextMyStatus })
  },

  applySessionCompleted: (e) => {
    const { session } = get()
    if (session && session.id === e.session_id) {
      set({ session: { ...session, status: 'completed' } })
    }
  },

  reset: () => set({ mahallaId: null, session: null, myStatus: null, detail: null }),
}))
