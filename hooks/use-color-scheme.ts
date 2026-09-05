import { useThemeStore } from '@/modules/Theme/theme-store'
import { useColorScheme as useSystemColorScheme } from 'react-native'

/**
 * The colour scheme every themed hook and component reads.
 *
 * Resolves the app's own mode (`modules/Theme/theme-store`) against the OS
 * scheme: `system` follows the device, `light`/`dark` win over it. Reading the
 * OS value is fine — it is *setting* it (`Appearance.setColorScheme`) that
 * triggers an Android UI-mode configuration change and blanks native views.
 *
 * RN 0.86 widened the OS value with `'unspecified'`; anything that is not dark
 * resolves to light, because the palettes only have the two.
 */
export function useColorScheme(): 'light' | 'dark' {
  const mode = useThemeStore((s) => s.mode)
  const systemScheme = useSystemColorScheme()

  if (mode === 'light' || mode === 'dark') return mode
  return systemScheme === 'dark' ? 'dark' : 'light'
}
