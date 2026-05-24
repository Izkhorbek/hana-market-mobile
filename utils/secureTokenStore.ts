/**
 * Secure token vault.
 *
 * Persists the four auth tokens to OS-level encrypted storage:
 *   • iOS  → Keychain (kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly)
 *   • Android → Keystore-backed EncryptedSharedPreferences
 *   • Web → localStorage (best effort — browsers have no real keychain)
 *
 * Why not put the whole zustand auth blob here?
 *   SecureStore values are limited (~2KB on Android in practice). The user
 *   profile can be larger, and we don't need to hide it. So we split:
 *     - tokens → vault (this file)
 *     - everything else → AsyncStorage via zustand `persist`
 *
 * Why one combined JSON blob, not 4 separate keys?
 *   Atomic writes. We never want a state where access token is rotated but
 *   the matching refresh token isn't (would brick the session).
 *
 * Sync access?
 *   No — SecureStore is async on every platform. Callers (the axios
 *   interceptor) MUST read tokens from in-memory zustand state, not from
 *   here. This vault is the *persistence* layer only.
 */

import { logger } from '@/utils/logger'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const VAULT_KEY = 'hana.auth.tokens.v1'

export interface VaultTokens {
  token: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  refreshTokenExpiresAt: string | null;
}

const EMPTY: VaultTokens = {
  token: null,
  refreshToken: null,
  expiresAt: null,
  refreshTokenExpiresAt: null,
}

// ── Platform-specific accessibility options ────────────────────────────────
// AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: readable in background after first
// unlock post-boot (needed for push handlers, background fetch). Not synced
// to iCloud / not restored to a different device.
const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
}

// ── Web fallback (SecureStore unavailable on web) ───────────────────────────
const isWeb = Platform.OS === 'web'

const webGet = (): string | null => {
  try {
    return typeof window !== 'undefined'
      ? window.localStorage.getItem(VAULT_KEY)
      : null
  } catch (error) {
      logger.warn(error, { code: 'TOKEN_VAULT_WEB_GET_FAILED' })
      return null
    }
}

const webSet = (value: string) => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(VAULT_KEY, value)
    }
  } catch (error) {
    logger.warn(error, { code: 'TOKEN_VAULT_WEB_SET_FAILED' })
  }
}

const webDelete = () => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(VAULT_KEY)
    }
  } catch (error) {
    logger.warn(error, { code: 'TOKEN_VAULT_WEB_DELETE_FAILED' }) 
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

export const secureTokenStore = {
  /** Read the persisted tokens. Returns an all-null object if nothing stored. */
  async read(): Promise<VaultTokens> {
    try {
      const raw = isWeb
        ? webGet()
        : await SecureStore.getItemAsync(VAULT_KEY, SECURE_STORE_OPTIONS)
      if (!raw) return { ...EMPTY }
      const parsed = JSON.parse(raw) as Partial<VaultTokens>
      return {
        token: parsed.token ?? null,
        refreshToken: parsed.refreshToken ?? null,
        expiresAt: parsed.expiresAt ?? null,
        refreshTokenExpiresAt: parsed.refreshTokenExpiresAt ?? null,
      }
    } catch (error) {
      // Corrupt JSON or hardware error — treat as empty so the user just has
      // to log in again rather than crashing the app.
      logger.warn(error, { code: 'TOKEN_VAULT_READ_FAILED' })
      return { ...EMPTY }
    }
  },

  /** Atomically persist all four token fields. */
  async write(tokens: VaultTokens): Promise<void> {
    try {
      const value = JSON.stringify(tokens)
      if (isWeb) {
        webSet(value)
      } else {
        await SecureStore.setItemAsync(VAULT_KEY, value, SECURE_STORE_OPTIONS)
      }
    } catch (error) {
      logger.error('TOKEN_VAULT_WRITE_FAILED', error)
    }
  },

  /** Wipe the vault — called on logout. */
  async clear(): Promise<void> {
    try {
      if (isWeb) {
        webDelete()
      } else {
        await SecureStore.deleteItemAsync(VAULT_KEY, SECURE_STORE_OPTIONS)
      }
    } catch (error) {
      logger.warn(error, { code: 'TOKEN_VAULT_CLEAR_FAILED' })
    }
  },
}

export default secureTokenStore
