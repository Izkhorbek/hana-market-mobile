import * as Application from 'expo-application'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

/**
 * Safe app version / build detection for the version-check gate.
 *
 * Why expo-application (not Constants alone): production builds use
 * `appVersionSource: "remote"` + `autoIncrement: true` (see eas.json), so the
 * real native build number is assigned by EAS at build time and does NOT match
 * the stale value in app.json. `Application.nativeBuildVersion` reads the true
 * value baked into the binary at runtime; Constants is only a dev/Expo-Go
 * fallback where the native module may be unavailable.
 */

/** Semantic app version, e.g. "1.0.3". Falls back to the config value, then 0.0.0. */
export function getAppVersion(): string {
  return (
    Application.nativeApplicationVersion ??
    Constants.expoConfig?.version ??
    '0.0.0'
  )
}

/**
 * Native build number as an integer (Android versionCode / iOS CFBundleVersion),
 * or `undefined` if it can't be resolved as a number. Callers should omit the
 * `build` query param when this is undefined rather than sending NaN.
 */
export function getAppBuild(): number | undefined {
  const raw =
    Application.nativeBuildVersion ??
    (Platform.OS === 'ios'
      ? Constants.expoConfig?.ios?.buildNumber
      : Constants.expoConfig?.android?.versionCode)

  if (raw == null) return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

/** Platform string in the shape the version-check endpoint expects. */
export function getAppPlatform(): 'android' | 'ios' {
  return Platform.OS === 'ios' ? 'ios' : 'android'
}
