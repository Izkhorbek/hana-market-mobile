import { useCallback } from 'react'
import { Appearance, ColorSchemeName } from 'react-native'

export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Hook for changing the app's color scheme/theme
 * 
 * @example
 * ```tsx
 * const { setTheme, currentTheme } = useChangeTheme();
 * 
 * // Set light theme
 * setTheme('light');
 * 
 * // Set dark theme
 * setTheme('dark');
 * 
 * // Follow system theme
 * setTheme('system');
 * ```
 */
export function useChangeTheme() {
  /**
   * Sets the color scheme for the entire app
   * @param theme - The theme to set ('light', 'dark', or 'system')
   */
  const setTheme = useCallback((theme: ThemeMode) => {
    if (theme === 'system') {
      // Reset to system default
      Appearance.setColorScheme(null)
    } else {
      // Set specific color scheme
      Appearance.setColorScheme(theme as ColorSchemeName)
    }
  }, [])

  /**
   * Toggles between light and dark theme
   */
  const toggleTheme = useCallback(() => {
    const currentScheme = Appearance.getColorScheme()
    const newScheme: ColorSchemeName = currentScheme === 'dark' ? 'light' : 'dark'
    Appearance.setColorScheme(newScheme)
  }, [])

  /**
   * Gets the current color scheme
   */
  const getCurrentTheme = useCallback((): ColorSchemeName => {
    return Appearance.getColorScheme()
  }, [])

  return {
    setTheme,
    toggleTheme,
    getCurrentTheme,
  }
}
