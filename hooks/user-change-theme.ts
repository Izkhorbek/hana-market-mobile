import { useColorScheme } from '@/hooks/use-color-scheme'
import { type ThemeMode, useThemeStore } from '@/modules/Theme/theme-store'
import { useCallback } from 'react'

export type { ThemeMode }

/**
 * Imperative wrapper around the colour-mode store.
 *
 * @example
 * ```tsx
 * const { setTheme, getCurrentTheme } = useChangeTheme();
 * setTheme('dark');    // force dark
 * setTheme('system');  // follow the device
 * ```
 */
export function useChangeTheme() {
  const setMode = useThemeStore((s) => s.setMode)
  const colorScheme = useColorScheme()

  /** Sets the colour mode ('light', 'dark' or 'system'). */
  const setTheme = useCallback((theme: ThemeMode) => setMode(theme), [setMode])

  /** Flips between light and dark, dropping out of 'system'. */
  const toggleTheme = useCallback(
    () => setMode(colorScheme === 'dark' ? 'light' : 'dark'),
    [colorScheme, setMode],
  )

  /** The resolved scheme, after 'system' is applied. */
  const getCurrentTheme = useCallback((): 'light' | 'dark' => colorScheme, [colorScheme])

  return {
    setTheme,
    toggleTheme,
    getCurrentTheme,
  }
}
