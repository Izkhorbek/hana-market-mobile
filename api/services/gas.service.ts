import type {
  ApiResponse,
  ConfirmGasReceiptRequest,
  CreateGasSessionRequest,
  GasHouseholdStatusDto,
  GasSessionDetailDto,
  GasSessionDto,
  PaginatedResponse,
  UpdateGasHouseholdStatusRequest,
  UpdateGasPositionRequest,
} from '../../types'
import axiosInstance from '../api'
import ENDPOINT from '../endpoints'

/**
 * Gaz navbati (Gas distribution) REST data layer. Realtime updates arrive over
 * SignalR and are handled in modules/Gas — not here. See ARCHITECTURE.md §2.
 */
export const gasService = {
  /**
   * The current active/planned session for a mahalla (main resident view).
   * GET /api/gas/sessions/active?mahalla_id=
   */
  getActiveSession: (mahallaId: number) => {
    return axiosInstance.get<ApiResponse<GasSessionDto | null>>(ENDPOINT.GAS.ACTIVE_SESSION, {
      params: { mahalla_id: mahallaId },
    })
  },

  /**
   * Past/all sessions for a mahalla (history — rais/admin review).
   * GET /api/gas/sessions?mahalla_id=&current_page=&page_size=
   */
  listSessions: (mahallaId: number, page = 1, pageSize = 20) => {
    return axiosInstance.get<ApiResponse<PaginatedResponse<GasSessionDto>>>(ENDPOINT.GAS.LIST_SESSIONS, {
      params: { mahalla_id: mahallaId, current_page: page, page_size: pageSize },
    })
  },

  /**
   * Full session with its street/household queue.
   * GET /api/gas/sessions/{id}
   */
  getSession: (id: number) => {
    return axiosInstance.get<ApiResponse<GasSessionDetailDto>>(ENDPOINT.GAS.SESSION_BY_ID(id))
  },

  /**
   * The current user's own household status within a session.
   * GET /api/gas/sessions/{id}/my-status
   */
  getMyStatus: (id: number) => {
    return axiosInstance.get<ApiResponse<GasHouseholdStatusDto>>(ENDPOINT.GAS.MY_STATUS(id))
  },

  /**
   * Create a session (mahalla admin).
   * POST /api/gas/sessions
   */
  createSession: (data: CreateGasSessionRequest) => {
    return axiosInstance.post<ApiResponse<GasSessionDto>>(ENDPOINT.GAS.CREATE_SESSION, data)
  },

  /** POST /api/gas/sessions/{id}/start */
  startSession: (id: number) => {
    return axiosInstance.post<ApiResponse<GasSessionDto>>(ENDPOINT.GAS.START(id))
  },

  /** POST /api/gas/sessions/{id}/pause */
  pauseSession: (id: number) => {
    return axiosInstance.post<ApiResponse<GasSessionDto>>(ENDPOINT.GAS.PAUSE(id))
  },

  /** POST /api/gas/sessions/{id}/complete */
  completeSession: (id: number) => {
    return axiosInstance.post<ApiResponse<GasSessionDto>>(ENDPOINT.GAS.COMPLETE(id))
  },

  /** Cancel a session (planned/paused) → status 'cancelled'. POST /api/gas/sessions/{id}/cancel */
  cancelSession: (id: number) => {
    return axiosInstance.post<ApiResponse<GasSessionDto>>(ENDPOINT.GAS.CANCEL(id))
  },

  /**
   * Update the live "where are we now" position (admin / runner).
   * PATCH /api/gas/sessions/{id}/position
   */
  updatePosition: (id: number, data: UpdateGasPositionRequest) => {
    return axiosInstance.patch<ApiResponse<GasSessionDto>>(ENDPOINT.GAS.POSITION(id), data)
  },

  /**
   * Mark a household delivered/skipped (admin / runner).
   * PATCH /api/gas/sessions/{id}/households/{householdId}/status
   */
  updateHouseholdStatus: (
    id: number,
    householdId: number,
    data: UpdateGasHouseholdStatusRequest,
  ) => {
    return axiosInstance.patch<ApiResponse<GasHouseholdStatusDto>>(
      ENDPOINT.GAS.HOUSEHOLD_STATUS(id, householdId),
      data,
    )
  },

  /**
   * Resident self-confirm receipt ("men oldim" / "kelmadi").
   * POST /api/gas/sessions/{id}/households/{householdId}/confirm
   */
  confirmReceipt: (id: number, householdId: number, data: ConfirmGasReceiptRequest) => {
    return axiosInstance.post<ApiResponse<GasHouseholdStatusDto>>(
      ENDPOINT.GAS.CONFIRM(id, householdId),
      data,
    )
  },
}
