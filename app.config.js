/**
 * Dynamic Expo config.
 *
 * Why this file exists:
 *   `app.json` is static JSON and cannot read environment variables. We need
 *   the Sentry DSN (and a few other runtime values) to come from `.env` so
 *   that:
 *     • secrets aren't committed to source control,
 *     • CI / EAS can inject per-environment values,
 *     • dev/staging/prod can use different Sentry projects.
 *
 *   Expo automatically prefers `app.config.js` over `app.json` when both
 *   exist. We import the JSON below and only override the bits we care about,
 *   so editing static fields (icons, splash, etc.) in `app.json` keeps working.
 *
 *   NOTE: this file is intentionally plain CommonJS JavaScript (not
 *   TypeScript). EAS reads the Expo config on the build server before any
 *   TypeScript transpilation is guaranteed to be available; a `.ts` config
 *   with type-only syntax (e.g. `import type { … }`) fails there with
 *   `Unexpected token '{'`. Keeping this file as `.js`/CommonJS makes it
 *   parseable by any Node runtime, on the builder and locally, without a
 *   transpile step. Do not reintroduce TypeScript-only syntax here.
 */

const baseConfig = require('./app.json')

module.exports = ({ config }) => {
  // `baseConfig.expo` is the same object you'd see in app.json. We merge it
  // with anything Expo CLI passes in (config) and our overrides.
  const json = baseConfig.expo

  const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN ?? ''
  const sentryOrg = process.env.EXPO_PUBLIC_SENTRY_ORG ?? ''
  const sentryProject = process.env.EXPO_PUBLIC_SENTRY_PROJECT ?? ''
  const sentryEnableInDev =
    process.env.EXPO_PUBLIC_SENTRY_ENABLE_IN_DEV === '1'

  const googleMapsKeyAndroid = process.env.GOOGLE_MAPS_API_KEY_ANDROID ?? ''
  const googleMapsKeyIos = process.env.GOOGLE_MAPS_API_KEY_IOS ?? ''

  const appEnv =
    process.env.APP_ENV ??
    (process.env.NODE_ENV === 'production' ? 'production' : 'development')
  const isProduction = appEnv === 'production'

  // Network security / certificate pinning. Hostname is derived from the API
  // URL so we never have to keep two env vars in sync.
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? ''
  let apiHost = ''
  let apiProtocol = ''
  try {
    if (apiUrl) {
      const parsedApiUrl = new URL(apiUrl)
      apiHost = parsedApiUrl.hostname
      apiProtocol = parsedApiUrl.protocol
    }
  } catch {
    apiHost = ''
    apiProtocol = ''
  }
  const apiPinSha256 = process.env.API_PIN_SHA256 ?? ''
  const apiBackupPinSha256 = process.env.API_BACKUP_PIN_SHA256 ?? ''

  // ── iOS production build validation ────────────────────────────────────
  // Fail fast with an actionable message when a *production iOS* EAS build is
  // missing config that would otherwise silently ship a broken binary (blank
  // Google Maps tiles, an unreachable API). Gated on EAS_BUILD_PLATFORM ===
  // 'ios' so Android builds, previews, local dev, and `expo config` are never
  // affected. Never logs secret values — only the *names* of missing vars.
  const isIosProductionBuild =
    isProduction && process.env.EAS_BUILD_PLATFORM === 'ios'
  if (isIosProductionBuild) {
    const missing = []
    if (!apiUrl) missing.push('EXPO_PUBLIC_API_URL')
    if (!googleMapsKeyIos) missing.push('GOOGLE_MAPS_API_KEY_IOS')
    if (missing.length > 0) {
      throw new Error(
        `iOS production build is missing required environment variables: ${missing.join(
          ', ',
        )}. Set them for the production environment before building ` +
          '(e.g. `eas env:create --environment production --name <NAME> --value <value>`).',
      )
    }
    if (apiUrl && !/^https:\/\//i.test(apiUrl)) {
      throw new Error(
        'EXPO_PUBLIC_API_URL must use HTTPS for iOS production builds.',
      )
    }
  }

  // Only register the Sentry build-time plugin when org/project are configured
  // — otherwise EAS will fail trying to upload source maps with empty creds.
  const sentryPlugin = []
  if (sentryOrg && sentryProject) {
    sentryPlugin.push([
      '@sentry/react-native/expo',
      {
        organization: sentryOrg,
        project: sentryProject,
        // SENTRY_AUTH_TOKEN is read from the environment by the plugin itself
        // during EAS builds. Never put it in this file.
      },
    ])
  }

  // Inject Google Maps keys from env. Without these, react-native-maps shows a
  // blank tile grid on release builds. Falling back to empty string lets
  // local "no map needed" workflows still build.
  const android = {
    ...(json.android ?? {}),
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'CAMERA',
      'READ_MEDIA_IMAGES',
      'INTERNET',
    ],
    config: {
      ...(json.android?.config ?? {}),
      ...(googleMapsKeyAndroid
        ? { googleMaps: { apiKey: googleMapsKeyAndroid } }
        : {}),
    },
  }

  const ios = {
    ...(json.ios ?? {}),
    ...(googleMapsKeyIos
      ? { config: { ...(json.ios?.config ?? {}), googleMapsApiKey: googleMapsKeyIos } }
      : {}),
    infoPlist: {
      ...(json.ios?.infoPlist ?? {}),
      // App Store reviewers REQUIRE a usage string for every permission the
      // binary can actually request; without them iOS hard-crashes on first
      // use. We declare ONLY permissions the app truly uses:
      //   • Location — expo-location (nearby products + item post location)
      //   • Photos   — expo-image-picker launchImageLibraryAsync (read/select)
      // The image picker is gallery-only (no camera path exists) and the app
      // never writes to the photo library, so NSCameraUsageDescription and
      // NSPhotoLibraryAddUsageDescription are intentionally omitted. Re-add
      // the matching string here if a camera or save-to-library feature is
      // introduced later.
      NSLocationWhenInUseUsageDescription:
        'Hana Market uses your location to show nearby products and to set the location of items you post.',
      NSPhotoLibraryUsageDescription:
        'Hana Market needs access to your photos so you can attach them to product listings and chats.',
      // Export compliance: the app uses only standard HTTPS/TLS (exempt
      // encryption). Declaring this lets TestFlight and App Store review skip
      // the "Missing Compliance" prompt on every uploaded build.
      ITSAppUsesNonExemptEncryption: false,
      // Block plaintext networking in production iOS builds.
      ...(isProduction
        ? { NSAppTransportSecurity: { NSAllowsArbitraryLoads: false } }
        : {}),
    },
  }

  return {
    ...config,
    ...json,
    ios,
    android,
    plugins: [
      ...(json.plugins ?? []),
      ...sentryPlugin,
      [
        './plugins/with-network-security',
        {
          apiHost,
          apiProtocol,
          pinSha256: apiPinSha256,
          backupPinSha256: apiBackupPinSha256,
          // Allow plain HTTP to RFC1918 / localhost in non-prod builds so the
          // app can still reach a dev backend.
          allowDevCleartext: !isProduction,
        },
      ],
    ],
    extra: {
      ...(json.extra ?? {}),
      sentryDsn,
      sentryEnableInDev,
      appEnv,
      // Public URLs to legal pages — referenced from the in-app Settings
      // screen and the App Store / Play Store listings. Override per
      // environment via env vars; defaults point to production.
      privacyPolicyUrl:
        process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ??
        'https://hana.uz/privacy-policy',
      termsUrl:
        process.env.EXPO_PUBLIC_TERMS_URL ?? 'https://hana.uz/terms-of-service',
      supportEmail:
        process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? 'hanamarketuz@gmail.com',
    },
  }
}
