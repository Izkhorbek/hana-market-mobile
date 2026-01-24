 import { useTranslation } from 'react-i18next';

 
export function useTranslations() {
  const {t, i18n} = useTranslation();
  const locale = i18n.language;
  const changeLng = (lng: string) => {
    i18n.changeLanguage(lng); 
  };


  return {
    t,
    locale,
    changeLng,
    i18n,
  };
}
