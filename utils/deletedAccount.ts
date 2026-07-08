import { isAxiosError } from 'axios'
import { Alert, Linking } from 'react-native'

import i18n from '@/constants/localization'
import {
  SUPPORT_EMAIL,
  SUPPORT_TELEGRAM_HANDLE,
  SUPPORT_TELEGRAM_URL,
} from '@/constants/support'

/**
 * Deleted-account handling — isolated so the detection heuristic lives in ONE
 * place. The backend returns a controlled 403 (message like "This account has
 * been deleted. Please contact support.") when a deleted account tries to
 * request/verify an OTP or when an authenticated call is made by a
 * since-deleted account.
 *
 * NOTE: this module intentionally does NOT import the auth store, so it is safe
 * to import from `api/api.ts` (which must stay off the store to avoid the
 * circular dependency — see api/auth-bridge.ts).
 */

// Preferred signal: a stable backend error code. The backend does not send one
// today, but if it starts to, detection upgrades automatically with no UI
// changes and no reliance on message text.
const DELETED_ACCOUNT_CODE = 'ACCOUNT_DELETED'

// Fallback signal: the current message text. Scoped to ACCOUNT deletion so it
// can never collide with the blocked-user 403 (which says "blocked") or an
// unrelated "deleted" 403 (e.g. a deleted product).
const DELETED_ACCOUNT_PATTERNS = [
  /account has been deleted/i,
  /account was deleted/i,
  /account is deleted/i,
  /deleted account/i,
]

/**
 * True only for the deleted-account 403. Returns false for every other error,
 * including the blocked-user 403 and any network error (no response).
 */
export const isDeletedAccountError = (error: unknown): boolean => {
  if (!isAxiosError(error)) return false
  const res = error.response
  if (!res || res.status !== 403) return false

  const data = res.data as
    | { code?: string; error_code?: string; message?: string; errors?: string[] }
    | undefined
  if (
    data?.code === DELETED_ACCOUNT_CODE ||
    data?.error_code === DELETED_ACCOUNT_CODE
  ) {
    return true
  }

  const message = String(data?.message ?? data?.errors?.[0] ?? '')
  return DELETED_ACCOUNT_PATTERNS.some((re) => re.test(message))
}

// Guard so concurrent deleted-account 403s (or the login + interceptor paths
// firing together) never spam more than one alert at a time.
let alertVisible = false

/**
 * Show the localized deleted-account warning with clickable support contacts.
 * Safe to call from anywhere (store handler or a screen catch) — it dedupes and
 * never throws (Linking failures are swallowed).
 */
export const showDeletedAccountAlert = (): void => {
  if (alertVisible) return
  alertVisible = true

  const dismiss = () => {
    alertVisible = false
  }

  // Contacts are shown in the body (always visible) AND as tappable buttons.
  const body = `${i18n.t('alert.account_deleted_message')}\n\n${SUPPORT_EMAIL}\n${SUPPORT_TELEGRAM_HANDLE}`

  Alert.alert(
    i18n.t('alert.account_deleted_title'),
    body,
    [
      {
        text: i18n.t('alert.contact_email'),
        onPress: () => {
          Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {})
          dismiss()
        },
      },
      {
        text: i18n.t('alert.contact_telegram'),
        onPress: () => {
          Linking.openURL(SUPPORT_TELEGRAM_URL).catch(() => {})
          dismiss()
        },
      },
      { text: i18n.t('common.ok'), style: 'cancel', onPress: dismiss },
    ],
    { onDismiss: dismiss },
  )
}
