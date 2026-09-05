import * as NavigationBar from 'expo-navigation-bar'
import { useEffect } from 'react'
import { useColorScheme } from '@/hooks/use-color-scheme'

/** Keeps the Android navigation bar readable against the active theme. */
export function useThemeNavigationBar() {
  const colorScheme = useColorScheme()

  useEffect(() => {
    // SDK 57 replaced setButtonStyleAsync() with setStyle(), and the naming
    // flipped: the style describes the BAR, not its buttons. A dark bar is the
    // one with light (white) icons, which is what a dark theme wants.
    NavigationBar.setStyle(colorScheme === 'dark' ? 'dark' : 'light')
  }, [colorScheme])
}
