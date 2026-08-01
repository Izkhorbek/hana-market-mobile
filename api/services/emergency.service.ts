import type { ApiResponse, EmergencySectionDto } from '../../types'
import axiosInstance from '../api'
import ENDPOINT from '../endpoints'

/**
 * Emergency short numbers (Shoshilinch xizmatlar) data layer. Admin-managed list
 * served by the backend; the screen falls back to a local seed until it loads.
 * See ARCHITECTURE.md §2 (global, stateless read).
 */
export const emergencyService = {
  /**
   * The categorized emergency/government short numbers.
   * GET /api/emergency-numbers
   */
  getSections: () => {
    return axiosInstance.get<ApiResponse<EmergencySectionDto[]>>(ENDPOINT.EMERGENCY.LIST)
  },
}
