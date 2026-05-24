import { AppLimits } from '@/constants/appLimits'
import * as Location from 'expo-location'
import { Alert, Linking } from 'react-native'

export type Coords = {
  latitude: number;
  longitude: number;
};

export type LocationErrorCode =
  | 'PERMISSION_DENIED'
  | 'PERMISSION_BLOCKED'
  | 'SERVICES_DISABLED'
  | 'TIMEOUT'
  | 'UNAVAILABLE'
  | 'OUT_OF_REGION'
  | 'UNKNOWN';

export type LocationResult =
  | { ok: true; coords: Coords }
  | { ok: false; code: LocationErrorCode; message: string };

/**
 * Approximate bounding box for the Republic of Uzbekistan.
 * Source: country-level extent (lat 37.18 → 45.59, lon 55.99 → 73.13)
 * with a small safety margin so border villages are not falsely rejected.
 */
export const UZBEKISTAN_BBOX = {
  minLat: 37.0,
  maxLat: 45.7,
  minLng: 55.9,
  maxLng: 73.2,
} as const

/** True if the given coordinates fall inside the Uzbekistan bbox. */
export function isWithinUzbekistan(coords: Coords): boolean {
  const { latitude: lat, longitude: lng } = coords
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
  return (
    lat >= AppLimits.Location.MIN_LATITUDE &&
    lat <= AppLimits.Location.MAX_LATITUDE &&
    lng >= AppLimits.Location.MIN_LONGITUDE &&
    lng <= AppLimits.Location.MAX_LONGITUDE
  )
}

export type GetCurrentLocationOptions = {
  /** Hard timeout for the GPS fix. Defaults to 15s. */
  timeoutMs?: number;
  /** Desired accuracy. Defaults to `Location.Accuracy.Balanced`. */
  accuracy?: Location.LocationAccuracy;
};

const DEFAULT_TIMEOUT_MS = 15000

/**
 * Resolve the device's current GPS coordinates safely.
 *
 * Never throws — always resolves with a discriminated `LocationResult`.
 * Handles: location services disabled, permission denied / permanently blocked,
 * GPS timeout, generic unavailability.
 *
 * Reusable from any screen, hook, or async handler (e.g. RHF submit).
 */
export async function getCurrentLocationSafe(
  options: GetCurrentLocationOptions = {},
): Promise<LocationResult> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, accuracy = Location.Accuracy.Balanced } =
    options

  try {
    // 1. Device-level location services
    const servicesEnabled = await Location.hasServicesEnabledAsync()
    if (!servicesEnabled) {
      return {
        ok: false,
        code: 'SERVICES_DISABLED',
        message: 'Location services are disabled on this device.',
      }
    }

    // 2. App-level foreground permission
    let { status, canAskAgain } =
      await Location.getForegroundPermissionsAsync()

    if (status !== 'granted' && canAskAgain) {
      const requested = await Location.requestForegroundPermissionsAsync()
      status = requested.status
      canAskAgain = requested.canAskAgain
    }

    if (status !== 'granted') {
      return {
        ok: false,
        code: canAskAgain ? 'PERMISSION_DENIED' : 'PERMISSION_BLOCKED',
        message: 'Location permission was not granted.',
      }
    }

    // 3. Get position, raced against timeout
    const position = await Promise.race<
      Location.LocationObject | { __timeout: true }
    >([
      Location.getCurrentPositionAsync({ accuracy }),
      new Promise<{ __timeout: true }>((resolve) =>
        setTimeout(() => resolve({ __timeout: true }), timeoutMs),
      ),
    ])

    if ('__timeout' in position) {
      return {
        ok: false,
        code: 'TIMEOUT',
        message: 'Timed out while getting your location.',
      }
    }

    const coords: Coords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    }

    // Temporary override: skip the Uzbekistan region check and allow all coordinates through.
    //  const coords: Coords = {
    //   latitude: 41.311081, // Tashkent city center
    //   longitude: 69.240562, // Tashkent city center
    // }

    if (!isWithinUzbekistan(coords)) {
      return {
        ok: false,
        code: 'OUT_OF_REGION',
        message:
          'Your current location is outside the supported service region (Uzbekistan).',
      }
    }

    return { ok: true, coords }
  } catch (error: any) {
    return {
      ok: false,
      code: 'UNAVAILABLE',
      message: error?.message ?? 'Unable to retrieve location.',
    }
  }
}

type Translator = (key: string, options?: any) => string;

const i18nKeyFor: Record<
  Exclude<LocationErrorCode, 'UNKNOWN'>,
  { title: string; message: string }
> = {
  PERMISSION_DENIED: {
    title: 'post.location.permission_denied_title',
    message: 'post.location.permission_denied_message',
  },
  PERMISSION_BLOCKED: {
    title: 'post.location.permission_blocked_title',
    message: 'post.location.permission_blocked_message',
  },
  SERVICES_DISABLED: {
    title: 'post.location.services_disabled_title',
    message: 'post.location.services_disabled_message',
  },
  TIMEOUT: {
    title: 'post.location.timeout_title',
    message: 'post.location.timeout_message',
  },
  UNAVAILABLE: {
    title: 'post.location.unavailable_title',
    message: 'post.location.unavailable_message',
  },
  OUT_OF_REGION: {
    title: 'post.location.out_of_region_title',
    message: 'post.location.out_of_region_message',
  },
}

/**
 * Show a localized, user-friendly alert for a failed `LocationResult`.
 * For permission-blocked / services-disabled cases, also offers an
 * "Open Settings" button that deep-links into the OS settings app.
 */
export function showLocationErrorAlert(
  result: Extract<LocationResult, { ok: false }>,
  t: Translator,
): void {
  const code: Exclude<LocationErrorCode, 'UNKNOWN'> =
    result.code === 'UNKNOWN' ? 'UNAVAILABLE' : result.code

  const { title, message } = i18nKeyFor[code]

  const showsOpenSettings =
    code === 'PERMISSION_BLOCKED' || code === 'SERVICES_DISABLED'

  const buttons = showsOpenSettings
    ? [
        { text: t('common.cancel'), style: 'cancel' as const },
        {
          text: t('post.location.open_settings'),
          onPress: () => {
            Linking.openSettings().catch(() => {
              /* noop — user may have killed the activity */
            })
          },
        },
      ]
    : [{ text: t('common.ok') }]

  Alert.alert(t(title), t(message), buttons)
}
