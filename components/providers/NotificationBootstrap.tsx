// eslint-disable-next-line import/no-restricted-paths -- TODO(arch): route through a hook (ARCHITECTURE.md §1)
import { notificationService } from '@/api/services/notification.service'
import { useAuthStore } from '@/modules/Auth/auth-store'
import { NotificationType } from '@/types'
import { logger } from '@/utils/logger'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'

// ─── Foreground display behaviour ────────────────────────────────────────────
// Show alert + sound + badge even while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

// ─── Navigation helper ────────────────────────────────────────────────────────
// FCM data fields are always serialised as strings (Dictionary<string,string>
// in C#), so `related_id` arrives as e.g. "42" not 42. We type it as
// string | number to accept both and always parse before use.
type NotificationData = {
  type?: string
  /** FCM delivers this as a string; APNS may deliver it as a number. */
  related_id?: string | number
  /** Extra fields forwarded verbatim from the backend payload. */
  extra_data?: Record<string, string> | string
}

/** Parse related_id to a positive integer, return null on failure. */
function parseRelatedId(raw: string | number | undefined): number | null {
  if (raw == null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

function navigateFromNotification(data: NotificationData | null | undefined) {
  if (!data) return
  const { type } = data
  const id = parseRelatedId(data.related_id)

  switch (type) {
    case NotificationType.NewMessage:
    case NotificationType.NewChatRoom:
      if (id !== null) router.push(`/chat/${id}` as any)
      break
    case NotificationType.ProductLiked:
    case NotificationType.ProductSold:
    case NotificationType.ProductExpired:
    case NotificationType.NewProduct:
      if (id !== null) router.push(`/product/${id}` as any)
      break
    default:
      break
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
/**
 * Null-rendering bootstrap component — mirrors ChatBootstrap.
 * Mounted once in _layout.tsx inside QueryClientProvider + ThemeProvider.
 *
 * Responsibilities:
 *  1. On login  → request permission, create Android channel, get native
 *     FCM/APNS device token, register with backend.
 *  2. On logout → deactivate token with backend (best-effort), remove listeners.
 *  3. Foreground display handled by setNotificationHandler above.
 *  4. Foreground tap  → navigateFromNotification.
 *  5. Cold-start tap  → navigateFromNotification from getLastNotificationResponseAsync.
 */
export function NotificationBootstrap() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const deviceTokenRef = useRef<string | null>(null)
  const foregroundListenerRef = useRef<Notifications.EventSubscription | null>(null)
  const tapListenerRef = useRef<Notifications.EventSubscription | null>(null)

  // ── Cold-start: app was killed and opened via notification tap ─────────────
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return
        navigateFromNotification(
          response.notification.request.content.data as NotificationData,
        )
      })
      .catch(() => {})
  }, [])

  // ── Auth-scoped lifecycle ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      // Deactivate push token so backend stops sending after logout.
      if (deviceTokenRef.current) {
        notificationService
          .deactivateToken({ device_token: deviceTokenRef.current })
          .catch(() => {})
        deviceTokenRef.current = null
      }

      foregroundListenerRef.current?.remove()
      tapListenerRef.current?.remove()
      foregroundListenerRef.current = null
      tapListenerRef.current = null
      return
    }

    let cancelled = false

    async function setup() {
      try {
        // Push notifications require a physical device.
        if (!Device.isDevice) {
          logger.warn('Push notifications unavailable on simulators.', {
            code: 'PUSH_SIMULATOR',
          })
          return
        }

        // ── Permission ─────────────────────────────────────────────────────
        const { status: existing } = await Notifications.getPermissionsAsync()
        let finalStatus = existing
        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync()
          finalStatus = status
        }
        if (finalStatus !== 'granted') {
          logger.warn('Push notification permission denied.', {
            code: 'PUSH_PERMISSION_DENIED',
          })
          return
        }

        // ── Android notification channel ───────────────────────────────────
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#02A348',
            sound: 'default',
          })
        }

        // ── Native device token ────────────────────────────────────────────
        // Returns FCM token on Android, APNS token on iOS.
        // The backend sends push notifications directly via FCM/APNS.
        const tokenResult = await Notifications.getDevicePushTokenAsync()
        const deviceToken: string = tokenResult.data

        if (!deviceToken || cancelled) return

        deviceTokenRef.current = deviceToken

        // ── Register with backend ──────────────────────────────────────────
        await notificationService.registerToken({
          device_token: deviceToken,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
        })
      } catch (err) {
        logger.warn(err, { code: 'PUSH_SETUP_FAILED' })
      }
    }

    setup()

    // ── Foreground: notification received while app is open ────────────────
    foregroundListenerRef.current =
      Notifications.addNotificationReceivedListener((_notification) => {
        // Display is already handled by setNotificationHandler.
        // Future: invalidate unread-count React Query here.
      })

    // ── Tap: notification tapped (foreground or background) ───────────────
    tapListenerRef.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        navigateFromNotification(
          response.notification.request.content.data as NotificationData,
        )
      })

    return () => {
      cancelled = true
      foregroundListenerRef.current?.remove()
      tapListenerRef.current?.remove()
      foregroundListenerRef.current = null
      tapListenerRef.current = null
    }
  }, [isAuthenticated])

  return null
}
