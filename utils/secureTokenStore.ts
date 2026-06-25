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

// ── Read robustness ──────────────────────────────────────────────────────────
// On Android the Keystore-backed store can be momentarily unavailable right after
// a force-stop (the AES key isn't ready yet), so getItemAsync THROWS transiently.
// We must NOT treat that throw as "the vault is empty" — doing so upstream caused
// valid sessions to be wiped on reopen. Retry a few times, then surface the
// failure distinctly via SecureTokenReadError so callers can avoid destroying
// still-valid tokens.
const READ_MAX_ATTEMPTS = 3
const READ_RETRY_DELAY_MS = 150

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** Thrown by `read()` when the keychain is unreachable after all retries. */
export class SecureTokenReadError extends Error {
  constructor(public readonly cause?: unknown) {
    super('Secure token vault read failed')
    this.name = 'SecureTokenReadError'
  }
}

// Parse a raw vault string. Corrupt JSON is treated as empty (not a hardware
// failure) — the user just re-logs in rather than crashing.
const parseVault = (raw: string | null): VaultTokens => {
  if (!raw) return { ...EMPTY }
  try {
    const parsed = JSON.parse(raw) as Partial<VaultTokens>
    return {
      token: parsed.token ?? null,
      refreshToken: parsed.refreshToken ?? null,
      expiresAt: parsed.expiresAt ?? null,
      refreshTokenExpiresAt: parsed.refreshTokenExpiresAt ?? null,
    }
  } catch (error) {
    logger.warn(error, { code: 'TOKEN_VAULT_PARSE_FAILED' })
    return { ...EMPTY }
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

export const secureTokenStore = {
  /**
   * Read the persisted tokens. Returns an all-null object when the vault is
   * genuinely empty. Throws `SecureTokenReadError` when the keychain could not
   * be read after retries — callers MUST distinguish this from "empty" and must
   * NOT wipe the vault on a read failure.
   */
  async read(): Promise<VaultTokens> {
    // Web localStorage is synchronous and not subject to the Keystore race.
    if (isWeb) return parseVault(webGet())

    let lastError: unknown = null
    for (let attempt = 1; attempt <= READ_MAX_ATTEMPTS; attempt++) {
      try {
        // getItemAsync resolving (even to null) proves the keychain was
        // reachable: null = genuinely nothing stored, non-null = parse it.
        const raw = await SecureStore.getItemAsync(VAULT_KEY, SECURE_STORE_OPTIONS)
        return parseVault(raw)
      } catch (error) {
        // A throw is a transient hardware/Keystore error — retry, don't give up.
        lastError = error
        logger.warn(error, { code: 'TOKEN_VAULT_READ_RETRY', extra: { attempt } })
        if (attempt < READ_MAX_ATTEMPTS) await delay(READ_RETRY_DELAY_MS)
      }
    }

    logger.error('TOKEN_VAULT_READ_FAILED', lastError)
    throw new SecureTokenReadError(lastError)
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
