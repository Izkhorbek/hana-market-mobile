import { isAxiosError } from 'axios'

/**
 * Coarse category of a failed request, used to show the user a message that
 * matches the *actual* cause instead of a one-size-fits-all string.
 */
export type ApiErrorKind =
  | 'auth'      // 401 / 403 — session ended / not permitted
  | 'network'   // no response — offline / DNS / timeout
  | 'server'    // 5xx — backend failure
  | 'location'  // 4xx on a geo-gated endpoint — missing / out-of-area location
  | 'unknown';  // anything else

/**
 * Classify an error from a **geo-gated** endpoint (e.g. `GET /product/all`,
 * which requires `user_lat` / `user_long`). Order matters: auth and transport
 * problems are detected before falling back to the location bucket, so a
 * session/network/server failure is never mislabelled as a location problem.
 */
export function classifyGeoApiError(error: unknown): ApiErrorKind {
  if (!isAxiosError(error)) return 'unknown'

  // No response object → request never completed (offline, DNS, timeout).
  if (!error.response) return 'network'

  const status = error.response.status
  if (status === 401 || status === 403) return 'auth'
  if (status >= 500) return 'server'

  // The endpoint is geo-gated, so a 400/404 is overwhelmingly a missing or
  // out-of-area location (or no listings for the searched coordinates).
  if (status === 400 || status === 404) return 'location'

  return 'unknown'
}

/**
 * Extract a human-readable message from an API error.
 *
 * Handles:
 *  - Plain string body
 *  - { message: string }
 *  - .NET `ValidationProblemDetails` shape: { errors: { field: string[] } }
 *  - { title, detail } (RFC 7807)
 *  - Network / unknown errors via `Error.message`
 */
export function parseApiError(error: any, fallback: string): string {
  const data = error?.response?.data

  if (typeof data === 'string' && data.trim().length > 0) {
    return data
  }

  if (data && typeof data === 'object') {
    if (typeof data.message === 'string' && data.message.trim().length > 0) {
      return data.message
    }

    if (data.errors && typeof data.errors === 'object') {
      const lines: string[] = []
      for (const value of Object.values(data.errors)) {
        if (Array.isArray(value)) {
          for (const m of value) {
            if (typeof m === 'string' && m.trim().length > 0) lines.push(m)
          }
        } else if (typeof value === 'string' && value.trim().length > 0) {
          lines.push(value)
        }
      }
      if (lines.length > 0) return lines.join('\n')
    }

    if (typeof data.detail === 'string' && data.detail.trim().length > 0) {
      return data.detail
    }
    if (typeof data.title === 'string' && data.title.trim().length > 0) {
      return data.title
    }
  }

  if (typeof error?.message === 'string' && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}
