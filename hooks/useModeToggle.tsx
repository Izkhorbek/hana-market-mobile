import { useColorScheme } from '@/hooks/use-color-scheme'
import { type ThemeMode, useThemeStore } from '@/modules/Theme/theme-store'

interface UseModeToggleReturn {
  /** Whether the resolved theme is dark right now. */
  isDark: boolean
  /** The user's choice, which may be 'system'. */
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  /** The resolved scheme, after 'system' is applied. */
  currentMode: 'light' | 'dark'
  /** light → dark → system → light. */
  toggleMode: () => void
}

/**
 * The colour-mode control. Reads and writes `modules/Theme/theme-store`, which
 * is shared and persisted — the mode no longer lives in component state, so two
 * screens can't disagree about it and it survives a restart.
 */
export function useModeToggle(): UseModeToggleReturn {
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)
  const cycleMode = useThemeStore((s) => s.cycleMode)
  const colorScheme = useColorScheme()

  return {
    isDark: colorScheme === 'dark',
    mode,
    setMode,
    currentMode: colorScheme,
    toggleMode: cycleMode,
  }
}
