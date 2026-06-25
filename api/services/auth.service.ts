import type {
  ApiResponse,
  RefreshTokenRequest,
  RequestOtpRequest,
  User,
  VerifyOtpRequest,
} from '../../types'
import type { AxiosResponse } from 'axios'
import axiosInstance from '../api'
import ENDPOINT from '../endpoints'

export const authService = {
  /**
   * Request an OTP for a phone number.
   * POST /api/auth/request-otp
   * Server will SMS a 6-digit code. No token is issued at this step.
   */
  requestOtp: (data: RequestOtpRequest) => {
    return axiosInstance.post<ApiResponse<object>>(ENDPOINT.AUTH.REQUEST_OTP, data)
  },

  /**
   * Verify an OTP and authenticate the user.
   * POST /api/auth/verify-otp
   * Implicitly registers the user on first successful verify.
   * Tokens returned in response headers:
   *   X-Access-Token, X-Expires-At, X-Refresh-Token, X-Refresh-Token-Expires-At
   */
  verifyOtp: (data: VerifyOtpRequest) => {
    return axiosInstance.post<ApiResponse<User>>(
      ENDPOINT.AUTH.VERIFY_OTP,
      data,
    )
  },

  /**
   * Exchange a refresh token for a new access/refresh token pair.
   * POST /api/auth/refresh
   * New tokens are returned in the same X-* response headers as verify-otp.
   * Skip the auth interceptor's refresh-on-401 retry for this call to avoid
   * infinite loops.
   */
  refreshToken: (
    data: RefreshTokenRequest,
  ): Promise<AxiosResponse<ApiResponse<object>>> => {
    return axiosInstance.post<ApiResponse<object>>(ENDPOINT.AUTH.REFRESH, data, {
      // @ts-expect-error custom flag consumed by api.ts interceptor
      _skipAuthRefresh: true,
    }) as Promise<AxiosResponse<ApiResponse<object>>>
  },

  /**
   * Logout user — server-side revokes the current refresh token.
   * POST /api/auth/logout
   *
   * `accessToken` may be passed explicitly so the call still authenticates when
   * the store has already cleared its in-memory token (logout clears memory
   * first for an instant UI logout, then fires this revoke). Skips the auth
   * interceptor's refresh-on-401 retry — a 401 here just means the session is
   * already gone, which is the desired end state.
   */
  logout: (accessToken?: string) => {
    return axiosInstance.post<ApiResponse<object>>(ENDPOINT.AUTH.LOGOUT, undefined, {
      ...(accessToken
        ? { headers: { Authorization: `Bearer ${accessToken}` } }
        : {}),
      // @ts-expect-error custom flag consumed by api.ts interceptor
      _skipAuthRefresh: true,
    })
  },
}
