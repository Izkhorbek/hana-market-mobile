import { logger } from '@/utils/logger'
import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Persistent "seen" flags for one-time user-guidance modals.
 * Non-sensitive UI state → AsyncStorage (tokens use SecureStore elsewhere).
 *
 * Failure policy: storage must NEVER block a screen. On a read error we treat
 * the guide as already seen (so a broken storage can't pop a modal repeatedly);
 * write errors are swallowed (worst case the modal shows again next time).
 */
export const GUIDANCE_KEYS = {
  listingGuideThing: 'listing_guide_seen_thing',
  listingGuideCar: 'listing_guide_seen_car',
  listingGuideWork: 'listing_guide_seen_work',
  homeWelcome: 'home_welcome_seen',
} as const

export type ListingGuideType = 'thing' | 'car' | 'work'

export const listingGuideKeyFor = (type: ListingGuideType): string => {
  switch (type) {
    case 'car':
      return GUIDANCE_KEYS.listingGuideCar
    case 'work':
      return GUIDANCE_KEYS.listingGuideWork
    case 'thing':
    default:
      return GUIDANCE_KEYS.listingGuideThing
  }
}

export const guidanceStorage = {
  /** Returns true if the flag is set. On a storage error, returns true (fail-closed: don't show). */
  async hasSeen(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(key)
      return value === 'true'
    } catch (error) {
      logger.warn(error, { code: 'GUIDANCE_STORAGE_READ', extra: { key } })
      return true
    }
  },

  /** Best-effort persist. Errors are logged and swallowed — never throws. */
  async markSeen(key: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, 'true')
    } catch (error) {
      logger.warn(error, { code: 'GUIDANCE_STORAGE_WRITE', extra: { key } })
    }
  },
}
