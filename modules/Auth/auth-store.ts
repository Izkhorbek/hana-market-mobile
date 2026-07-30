import AsyncStorage from '@react-native-async-storage/async-storage'
import { isAxiosError } from 'axios'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import {
  setAccountDeletedFn,
  setHasRefreshableSession,
  setSessionExpiredLogoutFn,
  setLogoutFn,
  setRefreshTokenFn,
  setTokenGetter,
} from '@/api/auth-bridge'
import { queryClient } from '@/api/queryClient'
import { secureTokenStore } from '@/utils/secureTokenStore'
import { showDeletedAccountAlert } from '@/utils/deletedAccount'
import { logger } from '@/utils/logger'
import { setSentryUser } from '@/utils/sentry'
import { authService } from '@/api/services/auth.service'
import { userService } from '@/api/services/user.service'
import { useChatStore }  from '@/modules/Chat/chat-store'

// ── Types ──
export interface User {
  id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  email: string | null;
  phone_number: string | null;
  profile_image_url: string | null;
  latitude?: number | null;
  longitude?: number | null;
  search_radius_km?: number | null;
  address_name?: string | null;
  is_verified?: boolean;
  status?: string | null;
  is_blocked?: boolean;
}

interface AuthState {
  // State
  token: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  locationGranted: boolean;
  /**
   * Guest ("browse without login") mode. Set when the user taps "continue as
   * guest" on the welcome screen. Persisted so a returning guest lands straight
   * on the tabs. Independent of `isAuthenticated` (a guest has no token).
   * Cleared only on a successful `verifyOtp` — NOT in `logout()`, because
   * startup hydration calls `logout()` on an empty vault and that must not
   * bounce a returning guest back to the welcome screen.
   */
  isGuest: boolean;
  /**
   * Client-side location for a guest. Guests can't persist location on the
   * backend (`user/update/location` is auth-only), so their coordinates live
   * here and feed the product/map queries as a fallback for `user.latitude`.
   */
  guestLatitude: number | null;
  guestLongitude: number | null;
  /**
   * ISO timestamp of when the user explicitly accepted the Terms of Service &
   * Privacy Policy (App Store Guideline 1.2). Persisted so we don't re-prompt
   * an account that has already agreed. `null` = never recorded on this device.
   * NOTE: this is a client-side record; recording acceptance server-side
   * (version + timestamp + user id) is a recommended backend follow-up.
   */
  termsAcceptedAt: string | null;
  /**
   * Set to true when a startup token validation fails (expired / missing).
   * Cleared after the Alert is shown. NOT persisted.
   */
  sessionExpiredOnStart: boolean;

  // Actions
  setHydrated: (hydrated: boolean) => void;
  clearSessionExpiredOnStart: () => void;
  /**
   * Record that the user accepted the Terms & Privacy Policy (pass an ISO
   * timestamp). Called right after a successful OTP verification.
   */
  setTermsAccepted: (acceptedAt: string) => void;
  /**
   * Enter guest mode. The app gate (`app/index.tsx`) then routes to the tabs
   * even though there is no session.
   */
  continueAsGuest: () => void;
  /**
   * Store a guest's device-GPS coordinates client-side (no backend call).
   */
  setGuestLocation: (latitude: number, longitude: number) => void;
  /**
   * Ask the backend to SMS an OTP for this phone. No token is issued yet.
   */
  requestOtp: (phoneNumber: string) => Promise<void>;
  /**
   * Verify the OTP. On success the auth tokens are captured from the X-*
   * response headers and the user is authenticated. Implicit registration
   * happens server-side on first successful verify for a new phone number.
   */
  verifyOtp: (phoneNumber: string, code: string) => Promise<void>;
  /**
   * Exchange the persisted refresh token for a fresh access/refresh pair.
   * Returns the new access token on success or null if no refresh token is
   * available / refresh failed (caller should treat as session expired).
   */
  refreshTokens: () => Promise<string | null>;
  fetchUser: () => Promise<void>;
  updateLocation: (
    latitude: number,
    longitude: number,
    searchRadiusKm?: number,
    addressName?: string,
  ) => Promise<void>;
  setLocationGranted: (granted: boolean) => void;
  /**
   * Clear the session. Memory + caches are wiped synchronously (instant UI
   * logout); the returned promise resolves once the keychain has been durably
   * cleared, so an explicit user logout can `await` it before navigating to
   * guarantee a force-kill can't silently restore the session.
   */
  logout: () => Promise<void>;
}

const hasValidUserId = (user: User | null | undefined): user is User => {
  return !!user && typeof user.id === 'number' && user.id > 0
}

// Pull a single header in a case-insensitive way. Axios normalizes header
// keys to lowercase, but we defensively try common variants.
const readHeader = (
  headers: Record<string, any> | undefined,
  name: string,
): string | null => {
  if (!headers) return null
  const variants = [
    name,
    name.toLowerCase(),
    name.toUpperCase(),
    name.replace(/-/g, ''),
  ]
  for (const k of variants) {
    const v = headers[k]
    if (typeof v === 'string' && v.length > 0) return v
  }
  return null
}

// Extract our 4 auth headers from a verify-otp / refresh response.
const extractAuthTokens = (response: { headers?: any }) => ({
  token: readHeader(response.headers, 'x-access-token'),
  expiresAt: readHeader(response.headers, 'x-expires-at'),
  refreshToken: readHeader(response.headers, 'x-refresh-token'),
  refreshTokenExpiresAt: readHeader(
    response.headers,
    'x-refresh-token-expires-at',
  ),
})

// ── Store ──

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      token: null,
      refreshToken: null,
      expiresAt: null,
      refreshTokenExpiresAt: null,
      user: null,
      isAuthenticated: false,
      isHydrated: false,
      locationGranted: false,
      sessionExpiredOnStart: false,
      isGuest: false,
      guestLatitude: null,
      guestLongitude: null,
      termsAcceptedAt: null,

      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
      clearSessionExpiredOnStart: () => set({ sessionExpiredOnStart: false }),
      setTermsAccepted: (acceptedAt) => set({ termsAcceptedAt: acceptedAt }),
      continueAsGuest: () => set({ isGuest: true }),
      setGuestLocation: (latitude, longitude) =>
        set({
          guestLatitude: latitude,
          guestLongitude: longitude,
          locationGranted: true,
        }),

      requestOtp: async (phoneNumber) => {
        // Fire-and-forget from the store's perspective: the SMS is the only
        // side-effect. Errors propagate so the screen can show a localized
        // message to the user.
          await authService.requestOtp({ phone_number: phoneNumber })
      },

      verifyOtp: async (phoneNumber, code) => {
        const response = await authService.verifyOtp({ phone_number: phoneNumber, code })

        const tokens = extractAuthTokens(response)
        const userData = response.data?.data as User | undefined

        if (!tokens.token) {
          // Server accepted the OTP but didn't return a token — treat as auth
          // failure rather than silently leaving the user in a half-state.
          throw new Error('Authentication failed: no access token returned')
        }

        set({
          token: tokens.token,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
          refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
          isAuthenticated: true,
          // A guest who logs in is now a real user — leave guest mode so the
          // gate/UI stop treating them as a guest.
          isGuest: false,
          // Never write id=0 placeholder user into persisted auth state.
          user: hasValidUserId(userData) ? userData : get().user,
        })

        // Persist tokens to the OS keychain. AWAIT the write so the session's
        // refresh token is durably on disk before we proceed — a fire-and-forget
        // write interrupted by a force-kill right after OTP success would leave
        // the vault empty and corrupt the brand-new session. The vault swallows
        // its own errors (returns false) so a keychain failure won't throw.
        await secureTokenStore.write({
          token: tokens.token,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
          refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
        })

        if (!hasValidUserId(userData)) {
          await get().fetchUser()
        }
      },

      refreshTokens: async () => {
        const current = get().refreshToken
        if (!current) return null

        let response
        try {
          response = await authService.refreshToken({ refresh_token: current })
        } catch (error) {
          const status = isAxiosError(error) ? error.response?.status : undefined
          // Definitive failure: the refresh token itself is invalid/expired
          // (400/401). The session is dead → return null so the caller ends it.
          if (status === 400 || status === 401) {
            logger.warn(error, { code: 'AUTH_REFRESH_TOKEN_REJECTED' })
            return null
          }
          // Transient failure (network / timeout / 5xx): the refresh token is
          // still valid, we just couldn't reach the server. Re-throw so callers
          // KEEP the session instead of logging the user out on a network blip.
          logger.warn(error, { code: 'AUTH_REFRESH_TOKENS_TRANSIENT' })
          throw error
        }

        const tokens = extractAuthTokens(response)
        if (!tokens.token) return null

        const nextState = {
          token: tokens.token,
          // Backend rotates the refresh token; fall back to the previous one
          // only if the server (unexpectedly) omitted it.
          refreshToken: tokens.refreshToken ?? current,
          expiresAt: tokens.expiresAt ?? get().expiresAt,
          refreshTokenExpiresAt:
            tokens.refreshTokenExpiresAt ?? get().refreshTokenExpiresAt,
        }

        // Persist the ROTATED tokens BEFORE exposing them in memory / returning.
        // The server has already invalidated the previous refresh token; if a
        // force-kill landed between an in-memory update and a fire-and-forget
        // write, the vault would keep the dead token and brick the next launch.
        // Awaiting the write closes that window (see audit §5).
        await secureTokenStore.write(nextState)
        set({ ...nextState, isAuthenticated: true })

        return tokens.token
      },

      fetchUser: async () => {
        try {
          const response = await userService.getProfile()
          set({ user: response.data.data, sessionExpiredOnStart: false })
          // Tag Sentry events with the (non-PII) user identity for triage.
          if (response.data.data) {
            setSentryUser({
              id: response.data.data.id,
              username: response.data.data.username,
            })
          }
        } catch (error) {
          const status = isAxiosError(error) ? error.response?.status : undefined

          // 401 → DO NOT refresh or logout here. The axios response
          // interceptor (api/api.ts) is the single owner of token refresh: it
          // already ran the single-flight refresh + retry and, when that
          // failed, ended the session via authLogoutSessionExpired() (logout +
          // sessionExpiredOnStart). A 401 reaching this catch therefore means
          // recovery already failed and logout is already in flight. Re-running
          // refresh/logout here would double-wipe state (queryClient.clear,
          // SignalR disconnect, keychain wipe) and bypass the interceptor's
          // re-entrancy guard. Keep this branch side-effect free — do not
          // "fix" it by adding logout back.
          if (status === 401) {
            logger.warn(error, { code: 'AUTH_FETCH_USER_UNAUTHORIZED' })
            return
          }

          // 403 is not token-expiry, so the interceptor does not handle it.
          // Preserve the existing behaviour and end the session here, but do
          // NOT attempt a refresh — refreshing on a 403 is semantically wrong.
          if (status === 403) {
            set({ sessionExpiredOnStart: true })
            get().logout()
            return
          }

          // Network / server / unknown failures should not force logout.
          logger.warn(error, {
            code: 'AUTH_FETCH_USER_FAILED_NON_AUTH',
            extra: { status },
          })
        }
      },

      updateLocation: async (
        latitude,
        longitude,
        searchRadiusKm,
        addressName,
      ) => {
        await userService.updateLocation({
          latitude,
          longitude,
          search_radius_km: searchRadiusKm,
          address_name: addressName,
        })
        // Update local user state with new location data
        const currentUser = get().user
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              latitude,
              longitude,
              search_radius_km: searchRadiusKm,
              address_name: addressName,
            },
            locationGranted: true,
          })
        } else {
          set({ locationGranted: true })
        }
      },

      setLocationGranted: (granted) => set({ locationGranted: granted }),

      logout: async () => {
        // Capture the access token BEFORE clearing memory so the best-effort
        // server-side revoke below can still authenticate.
        const accessToken = get().token

        // Best-effort server-side refresh-token revoke (M2). Fire-and-forget so
        // it never blocks the UI or hangs logout on a dead network; if it
        // lands, a not-yet-flushed local token is useless on the next launch.
        // `_skipAuthRefresh` (set inside authService.logout) prevents a 401 from
        // re-entering refresh/logout.
        if (accessToken) {
          void authService.logout(accessToken).catch(() => {
            // Swallow — revoke is a hardening bonus, not required for logout.
          })
        }

        // Lazy import to break circular dependency
        useChatStore.getState().reset()

        // Wipe the entire React Query cache so no previous user's data
        // (chat list, messages, profile, unread counts, product queries, etc.)
        // bleeds into the next session on a shared device.
        queryClient.clear()

        // Clear auth state synchronously → UI logs out instantly and AuthGuard
        // redirects without waiting on the keychain.
        set({
          token: null,
          refreshToken: null,
          expiresAt: null,
          refreshTokenExpiresAt: null,
          user: null,
          isAuthenticated: false,
          locationGranted: false,
        })

        // Detach the Sentry identity so subsequent crashes aren't attributed
        // to the wrong user on a shared device.
        setSentryUser(null)

        // Durably wipe the keychain (M2). AWAIT so a force-kill immediately
        // after logout can't leave a restorable refresh token behind. Memory is
        // already cleared above, so even if this fails we never silently
        // restore — we just log a safe (token-free) code.
        const cleared = await secureTokenStore.clear()
        if (!cleared) {
          logger.warn('AUTH_LOGOUT_VAULT_CLEAR_FAILED', {
            code: 'AUTH_LOGOUT_VAULT_CLEAR_FAILED',
          })
        }
      },
    }),
    {
      name: 'hana-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Tokens are persisted SEPARATELY in the OS keychain via
      // `secureTokenStore`. Exclude them from the AsyncStorage blob so they
      // never sit in plaintext on disk.
      //
      // `isAuthenticated` is deliberately NOT persisted: the keychain
      // (`secureTokenStore`) is the SINGLE source of truth for "is there a
      // session." `isAuthenticated` is derived from the vault's refresh token
      // on every startup (see hydrateTokensFromVault). The persisted `user` is
      // a display cache only — it never decides auth.
      partialize: (state) => ({
        user: state.user,
        locationGranted: state.locationGranted,
        // Guest mode + guest coordinates are non-secret client state; persist
        // them so a returning guest reopens straight into the tabs.
        isGuest: state.isGuest,
        guestLatitude: state.guestLatitude,
        guestLongitude: state.guestLongitude,
        // Terms/Privacy acceptance record — persist so a returning, already-
        // agreed account is not re-prompted.
        termsAcceptedAt: state.termsAcceptedAt,
        // expiresAt timestamps are not secret, but keeping them next to their
        // tokens (in the vault) makes rotation atomic. So they're excluded too.
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) {
          // Even on AsyncStorage failure we still try to load tokens so a
          // returning user isn't unnecessarily logged out.
          void hydrateTokensFromVault()
          return
        }

        // Load tokens from the keychain BEFORE marking hydrated, so the
        // axios interceptor never sees a transient null token for an
        // authenticated user.
        void hydrateTokensFromVault(state)
      },
    },
  ),
)

// True when an ISO timestamp is absent-treated-as-not-expired or has passed.
const isExpired = (iso: string | null | undefined): boolean =>
  iso ? new Date(iso) <= new Date() : false

/**
 * Single source of truth = the OS keychain (`secureTokenStore`).
 *
 * On startup we DERIVE the session from the vault's refresh token — never from
 * the (non-persisted) `isAuthenticated` flag or the AsyncStorage user cache:
 *   • no / expired refresh token            → clear session, route to Login
 *   • valid refresh token, access expired   → refresh (keep session on a
 *                                              transient network error)
 *   • valid refresh token, access valid     → authenticated
 * `isHydrated` is set to true only after this completes. Also handles the
 * one-time migration from the legacy AsyncStorage-only token layout.
 */
async function hydrateTokensFromVault(rehydrated?: AuthState) {
  try {
    let tokens = await secureTokenStore.read()

    // ── Legacy migration ────────────────────────────────────────────────
    // Old builds wrote tokens into the AsyncStorage blob. If the vault is
    // empty but the rehydrated state still carries them, copy across once so
    // users aren't logged out when they update the app. The next persist cycle
    // (driven by `partialize`) strips them from AsyncStorage.
    if (
      !tokens.token &&
      !tokens.refreshToken &&
      rehydrated &&
      (rehydrated.token || rehydrated.refreshToken)
    ) {
      tokens = {
        token: rehydrated.token ?? null,
        refreshToken: rehydrated.refreshToken ?? null,
        expiresAt: rehydrated.expiresAt ?? null,
        refreshTokenExpiresAt: rehydrated.refreshTokenExpiresAt ?? null,
      }
      await secureTokenStore.write(tokens)
    }

    // ── Derive the session from the refresh token (the only authority) ───
    const refreshExpired = isExpired(tokens.refreshTokenExpiresAt)

    // Rule 6: missing or expired refresh token → no session. Only show the
    // "session expired" alert when a refresh token actually existed but is no
    // longer usable — NOT on a fresh install / clean logout (empty vault).
    if (!tokens.refreshToken || refreshExpired) {
      if (tokens.refreshToken && refreshExpired) {
        useAuthStore.setState({ sessionExpiredOnStart: true })
      }
      useAuthStore.getState().logout()
      return
    }

    // A usable refresh token exists → a session exists. Load it into memory.
    useAuthStore.setState({
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
      isAuthenticated: true,
    })

    // Rule 5: access token missing/expired but refresh token valid → refresh.
    if (!tokens.token || isExpired(tokens.expiresAt)) {
      try {
        const newToken = await useAuthStore.getState().refreshTokens()
        if (!newToken) {
          // Definitive: the refresh token was rejected as invalid/expired.
          useAuthStore.setState({ sessionExpiredOnStart: true })
          useAuthStore.getState().logout()
          return
        }
      } catch {
        // Transient (network / 5xx): keep the session. The next authenticated
        // request will refresh through the interceptor. Never log out here.
      }
    }

    // Refresh the user profile in the background — never block hydration on it,
    // and it cannot tear the session down (fetchUser only logs out on 403,
    // which a working token excludes).
    void useAuthStore.getState().fetchUser()
  } catch (error) {
    // Vault read / unexpected hydration failure — do NOT wipe a possibly-valid
    // session over a hiccup (rule 7). Leave the in-memory state as-is.
    logger.warn(error, { code: 'AUTH_HYDRATE_FAILED' })
  } finally {
    useAuthStore.getState().setHydrated(true)
  }
}

// Register bridge functions — breaks the circular dependency with api/api.ts
setTokenGetter(() => useAuthStore.getState().token)
// M1: a refresh is worth attempting when the session is hydrated and a refresh
// token exists — even if the in-memory access token is currently null.
setHasRefreshableSession(() => {
  const s = useAuthStore.getState()
  return s.isHydrated && !!s.refreshToken
})
setLogoutFn(() => useAuthStore.getState().logout())

let sessionExpiredHandled = false  // module-level flag to prevent multiple rapid calls
setSessionExpiredLogoutFn(() => {

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
})


// Deleted-account 403 on an authenticated request: end the session (AuthGuard
// then redirects to Login) and show the support-contact alert once. Deduped so
// several failing requests can't trigger multiple logouts/alerts. This is a
// distinct terminal state from session-expiry — a refresh would be pointless.
let accountDeletedHandled = false
setAccountDeletedFn(() => {
  if (accountDeletedHandled) return
  accountDeletedHandled = true

  useAuthStore.getState().logout()
  showDeletedAccountAlert()

  // Allow re-handling on a future session (e.g. next login on a shared device).
  setTimeout(() => {
    accountDeletedHandled = false
  }, 2000)
})

setRefreshTokenFn(() => useAuthStore.getState().refreshTokens())
