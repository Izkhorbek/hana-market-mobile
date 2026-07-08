import AsyncStorage from '@react-native-async-storage/async-storage'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../locales/en.json'
import ru from '../locales/ru.json'
import uz from '../locales/uz.json'

// Set the key-value pairs for the different languages you want to support.
export const languageResources = {
	en: { translation: en },
	ru: { translation: ru },
	uz: { translation: uz },
}

// The app language is a DEVICE/APP preference (not user-scoped): it lives under
// its own top-level AsyncStorage key, separate from the auth persist blob, so
// it survives logout. Logout never wipes AsyncStorage broadly, so nothing
// clears this key implicitly.
export const LANGUAGE_STORAGE_KEY = 'hana-app-language'
export const SUPPORTED_LANGUAGES = ['uz', 'ru', 'en'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]
const DEFAULT_LANGUAGE: SupportedLanguage = 'uz'

const isSupportedLanguage = (lng: string | null): lng is SupportedLanguage =>
	!!lng && (SUPPORTED_LANGUAGES as readonly string[]).includes(lng)

i18next.use(initReactI18next).init({
	compatibilityJSON: 'v4',
	// Synchronous init starts on the default; the persisted choice is applied by
	// restorePersistedLanguage() below as soon as AsyncStorage resolves.
	lng: DEFAULT_LANGUAGE,
	fallbackLng: DEFAULT_LANGUAGE,
	resources: languageResources,
})

/**
 * Persist the selected language so it survives an app kill/relaunch (and
 * logout). Non-fatal on failure — the choice still applies for this session.
 */
export const persistLanguage = async (lng: string): Promise<void> => {
	try {
		await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng)
	} catch {
		// Ignore write failures; language is still applied in memory.
	}
}

/**
 * Restore the persisted language. `i18next.init` is synchronous and cannot
 * await AsyncStorage, so we begin on the default and switch here once the
 * stored value is read. No-op (no re-render) when the stored value already
 * equals the current language, and falls back to the default for a
 * missing/unsupported value. Kicked off on import (this module is imported at
 * the top of app/_layout.tsx, before the tree renders).
 */
export const restorePersistedLanguage = async (): Promise<void> => {
	try {
		const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
		if (isSupportedLanguage(saved) && saved !== i18next.language) {
			await i18next.changeLanguage(saved)
		}
	} catch {
		// Ignore — keep the default language.
	}
}

void restorePersistedLanguage()

export default i18next
