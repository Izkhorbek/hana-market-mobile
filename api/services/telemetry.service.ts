import type { ApiResponse, MobileLogDto } from '../../types'
import axiosInstance from '../api'
import ENDPOINT from '../endpoints'

/**
 * Telemetry service — talks to the backend `telemetry/log` endpoint.
 *
 * NOTE: This is a low-level service. Application code should prefer the
 * higher-level `logger` facade in `utils/logger.ts`, which enriches the
 * payload with device/app metadata, truncates oversized fields, and never
 * throws.
 */
export const telemetryService = {
  /**
   * Send a single log entry to the backend.
   * POST /telemetry/log
   *
   * `_skipAuthRefresh` prevents the axios interceptor from triggering a
   * token refresh / logout loop if telemetry calls themselves fail with 401.
   */
  log: (data: MobileLogDto) => {
    return axiosInstance.post<ApiResponse<object>>(ENDPOINT.LOG.LOG, data, {
      // @ts-expect-error custom flag consumed by the response interceptor
      _skipAuthRefresh: true,
      timeout: 8000,
    })
  },
}
