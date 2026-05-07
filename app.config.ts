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
 *   Expo automatically prefers `app.config.ts` over `app.json` when both
 *   exist. We import the JSON below and only override the bits we care about,
 *   so editing static fields (icons, splash, etc.) in `app.json` keeps working.
 */

import type { ConfigContext, ExpoConfig } from 'expo/config';
import baseConfig from './app.json';

export default ({ config }: ConfigContext): ExpoConfig => {
  // `baseConfig.expo` is the same object you'd see in app.json. We merge it
  // with anything Expo CLI passes in (config) and our overrides.
  const json = (baseConfig as { expo: ExpoConfig }).expo;

  const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';
  const sentryOrg = process.env.EXPO_PUBLIC_SENTRY_ORG ?? '';
  const sentryProject = process.env.EXPO_PUBLIC_SENTRY_PROJECT ?? '';
  const sentryEnableInDev =
    process.env.EXPO_PUBLIC_SENTRY_ENABLE_IN_DEV === '1';

  const googleMapsKeyAndroid = process.env.GOOGLE_MAPS_API_KEY_ANDROID ?? '';
  const googleMapsKeyIos = process.env.GOOGLE_MAPS_API_KEY_IOS ?? '';

  const appEnv =
    process.env.APP_ENV ??
    (process.env.NODE_ENV === 'production' ? 'production' : 'development');
  const isProduction = appEnv === 'production';

  // Network security / certificate pinning. Hostname is derived from the API
  // URL so we never have to keep two env vars in sync.
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
  let apiHost = '';
  try {
    if (apiUrl) apiHost = new URL(apiUrl).hostname;
  } catch {
    apiHost = '';
  }
  const apiPinSha256 = process.env.API_PIN_SHA256 ?? '';
  const apiBackupPinSha256 = process.env.API_BACKUP_PIN_SHA256 ?? '';

  // Only register the Sentry build-time plugin when org/project are configured
  // — otherwise EAS will fail trying to upload source maps with empty creds.
  const sentryPlugin: any[] = [];
  if (sentryOrg && sentryProject) {
    sentryPlugin.push([
      '@sentry/react-native/expo',
      {
        organization: sentryOrg,
        project: sentryProject,
        // SENTRY_AUTH_TOKEN is read from the environment by the plugin itself
        // during EAS builds. Never put it in this file.
      },
    ]);
  }

  // Inject Google Maps keys from env. Without these, react-native-maps shows a
  // blank tile grid on release builds. Falling back to empty string lets
  // local "no map needed" workflows still build.
  const android: ExpoConfig['android'] = {
    ...(json.android ?? {}),
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'READ_MEDIA_IMAGES',
      'INTERNET',
    ],
    config: {
      ...(json.android?.config ?? {}),
      ...(googleMapsKeyAndroid
        ? { googleMaps: { apiKey: googleMapsKeyAndroid } }
        : {}),
    },
  };

  const ios: ExpoConfig['ios'] = {
    ...(json.ios ?? {}),
    ...(googleMapsKeyIos
      ? { config: { ...(json.ios?.config ?? {}), googleMapsApiKey: googleMapsKeyIos } }
      : {}),
    infoPlist: {
      ...(json.ios?.infoPlist ?? {}),
      // App Store reviewers REQUIRE these strings for every permission the
      // binary can request. Without them, iOS will hard-crash on first use.
      NSLocationWhenInUseUsageDescription:
        'Hana Market uses your location to show nearby products and to set the location of items you post.',
      NSCameraUsageDescription:
        'Hana Market uses the camera so you can take photos of products you want to sell.',
      NSPhotoLibraryUsageDescription:
        'Hana Market needs access to your photos so you can attach them to product listings and chats.',
      NSPhotoLibraryAddUsageDescription:
        'Hana Market saves images you download from chats to your photo library.',
      // Block plaintext networking in production iOS builds.
      ...(isProduction
        ? { NSAppTransportSecurity: { NSAllowsArbitraryLoads: false } }
        : {}),
    },
  };

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
        'https://hanamarket.uz/privacy',
      termsUrl:
        process.env.EXPO_PUBLIC_TERMS_URL ?? 'https://hanamarket.uz/terms',
      supportEmail:
        process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? 'support@hanamarket.uz',
    },
  };
};
