import Constants from 'expo-constants'

/**
 * Single source of truth for support-contact info shown to users (deleted
 * account, error fallbacks, etc.). Do NOT hardcode these anywhere else.
 *
 * `supportEmail` is already wired through `app.config.ts` → `extra.supportEmail`
 * (env-overridable via EXPO_PUBLIC_SUPPORT_EMAIL). Telegram has no env wiring
 * yet, so it lives here as a constant — matching how GlobalErrorBoundary
 * already references the same handle.
 */
const extra = Constants.expoConfig?.extra ?? {}

export const SUPPORT_EMAIL: string =
  (typeof extra.supportEmail === 'string' && extra.supportEmail) ||
  'hanamarketuz@gmail.com'

export const SUPPORT_TELEGRAM_HANDLE = '@hana_market_admin'
export const SUPPORT_TELEGRAM_URL = 'https://t.me/hana_market_admin'
