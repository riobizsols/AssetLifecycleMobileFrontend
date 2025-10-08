import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceLanguage } from '../utils/deviceLanguage';

// Translation resources
import en from '../locales/en.json';
import de from '../locales/de.json';
import es from '../locales/es.json';
import pt from '../locales/pt.json';

// Initialize i18n synchronously to avoid React 19 suspense issues
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    lng: 'en', // Set default language synchronously
    fallbackLng: 'en',
    debug: __DEV__,
    resources: {
      en: {
        translation: en,
      },
      de: {
        translation: de,
      },
      es: {
        translation: es,
      },
      pt: {
        translation: pt,
      },
    },
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    react: {
      useSuspense: false, // Disable suspense for React 19 compatibility
    },
  });

export default i18n;
