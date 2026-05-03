import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  setLogoutFn,
  setRefreshTokenFn,
  setTokenGetter,
} from '@/api/auth-bridge';
import { authApi as localAuthApi, userApi as localUserApi } from './api';

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

  // Actions
  setHydrated: (hydrated: boolean) => void;
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
  return !!user && typeof user.id === 'number' && user.id > 0;
};

// Pull a single header in a case-insensitive way. Axios normalizes header
// keys to lowercase, but we defensively try common variants.
const readHeader = (
  headers: Record<string, any> | undefined,
  name: string,
): string | null => {
  if (!headers) return null;
  const variants = [
    name,
    name.toLowerCase(),
    name.toUpperCase(),
    name.replace(/-/g, ''),
  ];
  for (const k of variants) {
    const v = headers[k];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return null;
};

// Extract our 4 auth headers from a verify-otp / refresh response.
const extractAuthTokens = (response: { headers?: any }) => ({
  token: readHeader(response.headers, 'x-access-token'),
  expiresAt: readHeader(response.headers, 'x-expires-at'),
  refreshToken: readHeader(response.headers, 'x-refresh-token'),
  refreshTokenExpiresAt: readHeader(
    response.headers,
    'x-refresh-token-expires-at',
  ),
});

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

      setHydrated: (hydrated) => set({ isHydrated: hydrated }),

      requestOtp: async (phoneNumber) => {
        // Fire-and-forget from the store's perspective: the SMS is the only
        // side-effect. Errors propagate so the screen can show a localized
        // message to the user.
        await localAuthApi.requestOtp(phoneNumber);
      },

      verifyOtp: async (phoneNumber, code) => {
        const response = await localAuthApi.verifyOtp(phoneNumber, code);
        const tokens = extractAuthTokens(response);
        const userData = response.data?.data as User | undefined;

        if (!tokens.token) {
          // Server accepted the OTP but didn't return a token — treat as auth
          // failure rather than silently leaving the user in a half-state.
          throw new Error('Authentication failed: no access token returned');
        }

        set({
          token: tokens.token,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
          refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
          isAuthenticated: true,
          // Never write id=0 placeholder user into persisted auth state.
          user: hasValidUserId(userData) ? userData : get().user,
        });

        if (!hasValidUserId(userData)) {
          await get().fetchUser();
        }
      },

      refreshTokens: async () => {
        const current = get().refreshToken;
        if (!current) return null;
        try {
          const response = await localAuthApi.refresh(current);
          const tokens = extractAuthTokens(response);
          if (!tokens.token) return null;

          set({
            token: tokens.token,
            // Backend rotates the refresh token; fall back to the previous one
            // only if the server (unexpectedly) omitted it.
            refreshToken: tokens.refreshToken ?? current,
            expiresAt: tokens.expiresAt ?? get().expiresAt,
            refreshTokenExpiresAt:
              tokens.refreshTokenExpiresAt ?? get().refreshTokenExpiresAt,
            isAuthenticated: true,
          });
          return tokens.token;
        } catch {
          return null;
        }
      },

      fetchUser: async () => {
        try {
          const response = await localUserApi.getUser();
          set({ user: response.data.data });
        } catch {
          // Token may be expired and refresh failed — log out
          get().logout();
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
        });
        // Update local user state with new location data
        const currentUser = get().user;
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
          });
        } else {
          set({ locationGranted: true });
        }
      },

      setLocationGranted: (granted) => set({ locationGranted: granted }),

      logout: () => {
        // Lazy import to break circular dependency
        const { useChatStore } = require('@/modules/Chat/chat-store');
        useChatStore.getState().reset();

        // Clear auth state
        set({
          token: null,
          refreshToken: null,
          expiresAt: null,
          refreshTokenExpiresAt: null,
          user: null,
          isAuthenticated: false,
          locationGranted: false,
        });
      },
    }),
    {
      name: 'hana-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        // Recover from previously persisted placeholder users (id <= 0).
        const shouldRefreshUser =
          !!state.token &&
          state.isAuthenticated &&
          (!state.user || !hasValidUserId(state.user));

        if (shouldRefreshUser) {
          state.fetchUser().finally(() => state.setHydrated(true));
          return;
        }

        state.setHydrated(true);
      },
    },
  ),
);

// Register bridge functions — breaks the circular dependency with api/api.ts
setTokenGetter(() => useAuthStore.getState().token);
setLogoutFn(() => useAuthStore.getState().logout());
setRefreshTokenFn(() => useAuthStore.getState().refreshTokens());
