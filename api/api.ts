import Constants from 'expo-constants'
import {
  authLogoutSessionExpired,
  getAuthToken,
  hasRefreshableSession,
  refreshAuthToken,
} from '@/api/auth-bridge'
import { logger } from '@/utils/logger'
import axios, { AxiosError, AxiosRequestConfig } from 'axios'

// API base URL is sourced from EXPO_PUBLIC_API_URL (see .env.example).
// In production builds, plain HTTP is blocked at the platform level
// (Android network_security_config + iOS ATS), so this MUST be HTTPS.
//
// Local dev fallback: real device on same Wi-Fi as a dev backend.
// Android emulator alternative: http://10.0.2.2:5000/api
const DEV_API_URL_FALLBACK='http://192.168.0.111:5000/api'

const appEnv = String(Constants.expoConfig?.extra?.appEnv ?? 'development')
const isProductionApp = appEnv === 'production'
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim()
const API_URL = DEV_API_URL_FALLBACK //configuredApiUrl  || (isProductionApp ? '' : DEV_API_URL_FALLBACK)

if (!API_URL) {
  throw new Error('Missing EXPO_PUBLIC_API_URL for production build')
}

if (isProductionApp && !/^https:\/\//i.test(API_URL)) {
  throw new Error('EXPO_PUBLIC_API_URL must use HTTPS for production builds')
}

// Static files (wwwroot) are served from the server root, not under /api
export const IMAGE_BASE_URL = API_URL.replace(/\/api\/?$/, '')

// Internal flag attached to a request to opt out of the auto-refresh-on-401
// loop. Used by the /auth/refresh and /auth/logout calls themselves.
type RetriableConfig = AxiosRequestConfig & {
  _retried?: boolean;
  _skipAuthRefresh?: boolean;
};

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to inject auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// ── Single-flight refresh ──
// If multiple requests fail with 401 concurrently, only one refresh call is
// made and all callers wait on the same promise.
let refreshInFlight: Promise<string | null> | null = null

const runSingleFlightRefresh = (): Promise<string | null> => {
  if (!refreshInFlight) {
    refreshInFlight = refreshAuthToken().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

// Response interceptor for global error handling + transparent token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    return response
  },
  async (error: AxiosError) => {
    const originalConfig = (error.config || {}) as RetriableConfig
    const url = originalConfig.url || 'unknown'
    const method = originalConfig.method?.toUpperCase() || 'unknown'
    const status = error.response?.status ?? 'no response'

    // Report to backend telemetry — skip the telemetry endpoint itself to
    // avoid an infinite loop, and skip 401s which are handled below.
    const isTelemetryCall = url.includes('telemetry/log')
    const numericStatus = typeof status === 'number' ? status : undefined
    if (!isTelemetryCall && numericStatus !== 401) {
      const isNetwork = !error.response
      const isServer = !!numericStatus && numericStatus >= 500
      const code = isNetwork ? 'API_NETWORK_ERROR' : `API_HTTP_${numericStatus}`
      const opts = {
        extra: {
          method,
          url,
          status: numericStatus,
          response_message:
            (error.response?.data as any)?.message ??
            (error.response?.data as any)?.errors?.[0],
        },
      }
      if (isServer) {
        logger.error(code, error, opts)
      } else {
        // Network / 4xx → warn (4xx is usually user/validation, network is transient)
        logger.warn(error, { code, ...opts })
      }
    }

    if (error.response) {
      const responseStatus = error.response.status

      if (
        responseStatus === 401 &&
        !originalConfig._retried &&
        !originalConfig._skipAuthRefresh &&
        // Attempt refresh whenever a refresh is still worth trying — either an
        // access token is present, OR (M1) the session is hydrated with a
        // refresh token even though the in-memory access token is currently
        // null (e.g. a transient startup-refresh failure left it unset). Gating
        // on the access token alone would skip refresh here and log the user
        // out despite a still-valid refresh token.
        (getAuthToken() || hasRefreshableSession())
      ) {
        originalConfig._retried = true
        try {
          const newToken = await runSingleFlightRefresh()
          if (newToken) {
            originalConfig.headers = {
              ...(originalConfig.headers || {}),
              Authorization: `Bearer ${newToken}`,
            }
            return axiosInstance.request(originalConfig)
          }
          // null → the refresh token was rejected as invalid/expired. The
          // session is genuinely dead, so end it.
          authLogoutSessionExpired()
        } catch (refreshErr) {
          // Throw → a TRANSIENT refresh failure (network / timeout / 5xx). The
          // refresh token is still valid; we just couldn't reach the server.
          // Keep the session and let the original request reject — do NOT log
          // the user out on a network blip.
          logger.warn(refreshErr, { code: 'AUTH_REFRESH_TRANSIENT', extra: { url } })
        }
      } else if (responseStatus === 401) {
        // Refresh disabled / already retried / no token → log out.
        authLogoutSessionExpired()
      }
    }

    return Promise.reject(error)
  },
)

export default axiosInstance
