/**
 * Auth bridge — breaks the circular dependency between api/api.ts and auth-store.ts.
 * api/api.ts imports from here (no store dependency).
 * auth-store.ts calls the setters here after the store is created.
 *
 * IMPORTANT: Do NOT import auth-store.ts here — that re-introduces the cycle.
 */

let _getToken: () => string | null = () => null
let _hasRefreshableSession: () => boolean = () => false
let _logout: () => void = () => {}
let _logoutSessionExpired: () => void = () => {}
let _refresh: () => Promise<string | null> = async () => null

export const setTokenGetter = (fn: () => string | null) => {
  _getToken = fn
}

/**
 * Register a predicate for "a refresh is still worth attempting" — i.e. the
 * store is hydrated and a refresh token is present, even if the in-memory
 * access token is currently null (M1). Lets the 401 interceptor recover a
 * session whose access token was never re-populated after a transient
 * startup-refresh failure, instead of logging the user out.
 */
export const setHasRefreshableSession = (fn: () => boolean) => {
  _hasRefreshableSession = fn
}

export const setLogoutFn = (fn: () => void) => {
  _logout = fn
}

export const setSessionExpiredLogoutFn = (fn: () => void) => {
  _logoutSessionExpired = fn
}

export const setRefreshTokenFn = (fn: () => Promise<string | null>) => {
  _refresh = fn
}

export const getAuthToken = (): string | null => _getToken()
export const hasRefreshableSession = (): boolean => _hasRefreshableSession()
export const authLogout = (): void => _logout()
export const authLogoutSessionExpired = (): void => _logoutSessionExpired()
export const refreshAuthToken = (): Promise<string | null> => _refresh()
