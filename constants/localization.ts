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

i18next.use(initReactI18next).init({
	compatibilityJSON: 'v4',
	lng: 'uz',
	fallbackLng: 'uz',
	resources: languageResources,
})

export default i18next
