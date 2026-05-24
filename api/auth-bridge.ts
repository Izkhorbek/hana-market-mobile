/**
 * Auth bridge — breaks the circular dependency between api/api.ts and auth-store.ts.
 * api/api.ts imports from here (no store dependency).
 * auth-store.ts calls the setters here after the store is created.
 */

import { useAuthStore } from '@/modules/Auth/auth-store'

let _getToken: () => string | null = () => null
let _logout: () => void = () => {}
let _logoutSessionExpired: () => void = () => {}
let _refresh: () => Promise<string | null> = async () => null

export const setTokenGetter = (fn: () => string | null) => {
  _getToken = fn
}

export const setLogoutFn = (fn: () => void) => {
  _logout = fn
}

let sessionExpiredHandled = false  // module-level flag
export const setSessionExpiredLogoutFn = () => {
  if (sessionExpiredHandled) return  // ← Ikkinchi chaqiruvni bloklash
  sessionExpiredHandled = true

  const state = useAuthStore.getState()
  if (!state.isAuthenticated && !state.token) {
    sessionExpiredHandled = false
    return
  }

  useAuthStore.setState({ sessionExpiredOnStart: true })
  state.logout()

  // Keyingi login uchun flagni tozalash
  setTimeout(() => { sessionExpiredHandled = false }, 2000)
  
}

export const setRefreshTokenFn = (fn: () => Promise<string | null>) => {
  _refresh = fn
}

export const getAuthToken = (): string | null => _getToken()
export const authLogout = (): void => _logout()
export const authLogoutSessionExpired = (): void => _logoutSessionExpired()
export const refreshAuthToken = (): Promise<string | null> => _refresh()
