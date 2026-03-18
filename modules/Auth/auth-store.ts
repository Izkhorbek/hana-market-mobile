import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { setLogoutFn, setTokenGetter } from '@/api/auth-bridge'
import { authApi as localAuthApi, userApi as localUserApi } from './api'

// ── Types ──
export interface User {
  id: number
  username: string | null
  first_name: string | null
  last_name: string | null
  bio: string | null
  email: string | null
  phone_number: string | null
  profile_image_url: string | null
  latitude?: number | null
  longitude?: number | null
  search_radius_km?: number | null
  address_name?: string | null
  is_verified?: boolean
  status?: string | null
  is_blocked?: boolean
}

interface AuthState {
  // State
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isHydrated: boolean
  locationGranted: boolean

  // Actions
  setHydrated: (hydrated: boolean) => void
  register: (phoneNumber: string) => Promise<void>
  login: (phoneNumber: string) => Promise<void>
  fetchUser: () => Promise<void>
  updateLocation: (
    latitude: number,
    longitude: number,
    searchRadiusKm?: number,
    addressName?: string,
  ) => Promise<void>
  setLocationGranted: (granted: boolean) => void
  logout: () => void
}

// ── Store ──

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      token: null,
      user: null,
      isAuthenticated: false,
      isHydrated: false,
      locationGranted: false,

      setHydrated: (hydrated) => set({ isHydrated: hydrated }),

      register: async (phoneNumber) => {
        const response = await localAuthApi.register(phoneNumber)

        const token = response.headers['x-access-token']
        const userData = response.data?.data

        if (token) {
          set({
            token: token,
            isAuthenticated: true,
            user: userData ?? {
              id: 0,
              username: null,
              first_name: null,
              last_name: null,
              bio: null,
              email: null,
              phone_number: phoneNumber,
              profile_image_url: null,
            }
          })
        }
      },

      login: async (phoneNumber) => {
        const response = await localAuthApi.login(phoneNumber)
        const token = response.headers['x-access-token']
        const userData = response.data?.data

        if (token) {
          set({
            token: token,
            isAuthenticated: true,
            user: userData ?? {
              id: 0,
              username: null,
              first_name: null,
              last_name: null,
              bio: null,
              email: null,
              phone_number: phoneNumber,
              profile_image_url: null,
            }
          })
        }
      },

      fetchUser: async () => {
        try {
          const response = await localUserApi.getUser()
          set({ user: response.data.data })
        } catch {
          // Token may be expired — log out
          get().logout()
        }
      },

      updateLocation: async (latitude, longitude, searchRadiusKm, addressName) => {
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

      logout: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          locationGranted: false,
        }),
    }),
    {
      name: 'hana-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    },
  ),
)

// Register bridge functions — breaks the circular dependency with api/api.ts
setTokenGetter(() => useAuthStore.getState().token)
setLogoutFn(() => useAuthStore.getState().logout())
