import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import {
  setLogoutFn,
  setRefreshTokenFn,
  setTokenGetter,
} from '@/api/auth-bridge'
import { queryClient } from '@/api/queryClient'
import { secureTokenStore } from '@/utils/secureTokenStore'
import { setSentryUser } from '@/utils/sentry'
import { authApi as localAuthApi, userApi as localUserApi } from './api'
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
   * Set to true when a startup token validation fails (expired / missing).
   * Cleared after the Alert is shown. NOT persisted.
   */
  sessionExpiredOnStart: boolean;

  // Actions
  setHydrated: (hydrated: boolean) => void;
  clearSessionExpiredOnStart: () => void;
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
  logout: () => void;
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

      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
      clearSessionExpiredOnStart: () => set({ sessionExpiredOnStart: false }),

      requestOtp: async (phoneNumber) => {
        // Fire-and-forget from the store's perspective: the SMS is the only
        // side-effect. Errors propagate so the screen can show a localized
        // message to the user.
        await localAuthApi.requestOtp(phoneNumber)
      },

      verifyOtp: async (phoneNumber, code) => {
        const response = await localAuthApi.verifyOtp(phoneNumber, code)

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
          // Never write id=0 placeholder user into persisted auth state.
          user: hasValidUserId(userData) ? userData : get().user,
        })

        // Persist tokens to the OS keychain (fire-and-forget; vault swallows
        // its own errors so a keychain failure won't break the login flow).
        void secureTokenStore.write({
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
        try {
          const response = await localAuthApi.refresh(current)
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

          set({ ...nextState, isAuthenticated: true })
          void secureTokenStore.write(nextState)

          return tokens.token
        } catch {
          return null
        }
      },

      fetchUser: async () => {
        try {
          const response = await localUserApi.getUser()
          set({ user: response.data.data, sessionExpiredOnStart: false })
          // Tag Sentry events with the (non-PII) user identity for triage.
          if (response.data.data) {
            setSentryUser({
              id: response.data.data.id,
              username: response.data.data.username,
            })
          }
        } catch {
          // Token is expired / invalid — flag it so the UI can show an Alert,
          // then wipe the session so the user is sent back to the welcome page.
          set({ sessionExpiredOnStart: true })
          get().logout()
        }
      },

      updateLocation: async (
        latitude,
        longitude,
        searchRadiusKm,
        addressName,
      ) => {
        await localUserApi.updateLocation({
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

      logout: () => {
        // Lazy import to break circular dependency
        useChatStore.getState().reset()

        // Wipe the entire React Query cache so no previous user's data
        // (chat list, messages, profile, unread counts, product queries, etc.)
        // bleeds into the next session on a shared device.
        queryClient.clear()

        // Clear auth state
        set({
          token: null,
          refreshToken: null,
          expiresAt: null,
          refreshTokenExpiresAt: null,
          user: null,
          isAuthenticated: false,
          locationGranted: false,
        })

        // Wipe the keychain entry. Fire-and-forget — vault swallows errors.
        void secureTokenStore.clear()

        // Detach the Sentry identity so subsequent crashes aren't attributed
        // to the wrong user on a shared device.
        setSentryUser(null)
      },
    }),
    {
      name: 'hana-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Tokens are persisted SEPARATELY in the OS keychain via
      // `secureTokenStore`. Exclude them from the AsyncStorage blob so they
      // never sit in plaintext on disk.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        locationGranted: state.locationGranted,
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

/**
 * Pull tokens out of the OS keychain into the in-memory zustand state, then
 * mark hydration complete. Also handles the one-time migration from the
 * legacy AsyncStorage-only layout (where tokens lived inside the persisted
 * blob).
 */
async function hydrateTokensFromVault(rehydrated?: AuthState) {
  try {
    const vaultTokens = await secureTokenStore.read()

    // ── Legacy migration ────────────────────────────────────────────────
    // Old builds wrote tokens into the AsyncStorage blob. If the vault is
    // empty but the rehydrated state still carries them, copy across once
    // so users aren't logged out when they update the app. The next persist
    // cycle (driven by `partialize`) will strip them from AsyncStorage.
    const legacyToken = rehydrated?.token ?? null
    const legacyRefresh = rehydrated?.refreshToken ?? null
    const shouldMigrate =
      !vaultTokens.token && (legacyToken || legacyRefresh)

    if (shouldMigrate && rehydrated) {
      const migrated = {
        token: legacyToken,
        refreshToken: legacyRefresh,
        expiresAt: rehydrated.expiresAt ?? null,
        refreshTokenExpiresAt: rehydrated.refreshTokenExpiresAt ?? null,
      }
      await secureTokenStore.write(migrated)
      useAuthStore.setState(migrated)
    } else if (vaultTokens.token) {
      // Normal path — vault wins over whatever (shouldn't be) in AsyncStorage.
      useAuthStore.setState({
        token: vaultTokens.token,
        refreshToken: vaultTokens.refreshToken,
        expiresAt: vaultTokens.expiresAt,
        refreshTokenExpiresAt: vaultTokens.refreshTokenExpiresAt,
        isAuthenticated: true,
      })
    }
  } finally {
    const s = useAuthStore.getState()

    // Guard: authenticated but vault returned no token (token was wiped by
    // the OS, uninstall-reinstall, or manual vault clear). Treat the same as
    // an expired session.
    if (s.isAuthenticated && !s.token) {
      useAuthStore.setState({ sessionExpiredOnStart: true })
      s.logout()
      s.setHydrated(true)
      return
    }

    // Always validate the stored token against the server on startup.
    // fetchUser() sets sessionExpiredOnStart + calls logout() on any failure,
    // so the user is redirected to the welcome page with an Alert.
    if (s.isAuthenticated && s.token) {
      s.fetchUser().finally(() => s.setHydrated(true))
      return
    }

    // Fresh install / already logged out — nothing to validate.
    s.setHydrated(true)
  }
}

// Register bridge functions — breaks the circular dependency with api/api.ts
setTokenGetter(() => useAuthStore.getState().token)
setLogoutFn(() => useAuthStore.getState().logout())
setRefreshTokenFn(() => useAuthStore.getState().refreshTokens())
