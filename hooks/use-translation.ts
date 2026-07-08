 import { useTranslation } from 'react-i18next'
import { persistLanguage } from '@/constants/localization'


export function useTranslations() {
  const {t, i18n} = useTranslation()
  const locale = i18n.language
  const changeLng = (lng: string) => {
    i18n.changeLanguage(lng)
    // Persist so the choice survives an app kill/relaunch (see localization.ts).
    void persistLanguage(lng)
  }


  return {
    t,
    locale,
    changeLng,
    i18n,
  }
}
