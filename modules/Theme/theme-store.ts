import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'

/**
 * The app's colour mode (ARCHITECTURE.md §2 — client state, so a store).
 *
 * Deliberately NOT `Appearance.setColorScheme()`. On Android that maps to
 * `AppCompatDelegate.setDefaultNightMode()`, a system UI-mode configuration
 * change: native views are torn through it, and a MapView's surface does not
 * come back — the map went blank the moment anyone flipped the theme. Keeping
 * the mode in JS makes the toggle an ordinary re-render.
 *
 * The trade-off is that native chrome the app does not draw itself (system
 * dialogs, the keyboard) follows the OS rather than this toggle. `system`, the
 * default, keeps the two in agreement.
 */
interface ThemeState {
  mode: ThemeMode
  /** False until AsyncStorage has been read, so nothing flashes the wrong theme. */
  isHydrated: boolean
  setMode: (mode: ThemeMode) => void
  /** light → dark → system → light. */
  cycleMode: () => void
}

const NEXT_MODE: Record<ThemeMode, ThemeMode> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      isHydrated: false,

      setMode: (mode) => set({ mode }),

      cycleMode: () => set({ mode: NEXT_MODE[get().mode] }),
    }),
    {
      name: 'hana-theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only the choice is persisted; the flag below is per-launch.
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => () => {
        useThemeStore.setState({ isHydrated: true })
      },
    },
  ),
)
