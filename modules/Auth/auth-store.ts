import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { authApi, userApi } from './api'

// ── Types ──

export interface User {
  id: number
  username: string | null 
  first_name: string | null
  last_name: string | null
  bio: string | null
  phone_number: string | null
  profile_image_url: string | null
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
        const response = await authApi.register(phoneNumber)
        const { token, user } = response.data

        set({
          token: token ?? null,
          user: user ?? null,
          isAuthenticated: !!token,
        })
      },

      login: async (phoneNumber) => {
        const response = await authApi.login(phoneNumber)
        const { token, user } = response.data

        set({
          token: token ?? null,
          user: user ?? null,
          isAuthenticated: !!token,
        })
      },

      fetchUser: async () => {
        try {
          const response = await userApi.getUser()
          set({ user: response.data })
        } catch {
          // Token may be expired — log out
          get().logout()
        }
      },

      updateLocation: async (latitude, longitude, searchRadiusKm, addressName) => {
        await userApi.updateLocation({
          latitude,
          longitude,
          search_radius_km: searchRadiusKm,
          address_name: addressName,
        })
        set({ locationGranted: true })
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
