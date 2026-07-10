import type { ApiResponse, VersionCheckParams, VersionCheckResponse } from '../../types'
import axiosInstance from '../api'
import ENDPOINT from '../endpoints'

export const appService = {
  /**
   * Check the backend version policy for the current build.
   * GET /api/app/version-check
   *
   * Public endpoint (no auth required). Callers must treat failures as
   * non-blocking — a failed check should never prevent app usage.
   */
  checkAppVersion: (params: VersionCheckParams) => {
    // Plain GET on a public endpoint. Deliberately NOT setting _skipAuthRefresh:
    // that flag would force a 401 down the interceptor's logout branch. Letting
    // it behave like a normal request means a 401 only ever triggers the
    // existing transparent refresh (for a live session) and never a new logout
    // path — the caller treats any failure as non-blocking regardless.
    return axiosInstance.get<ApiResponse<VersionCheckResponse>>(
      ENDPOINT.APP.VERSION_CHECK,
      { params },
    )
  },
}
