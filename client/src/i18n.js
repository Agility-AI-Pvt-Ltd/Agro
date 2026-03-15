import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslations from './i18n/en.json';
import hiTranslations from './i18n/hi.json';

const resources = {
  en: { translation: enTranslations },
  hi: { translation: hiTranslations }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('i18nextLng') || 'en',
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
