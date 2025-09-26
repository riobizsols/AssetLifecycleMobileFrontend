import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceLanguage } from '../utils/deviceLanguage';

// Translation resources
import en from '../locales/en.json';
import de from '../locales/de.json';
import es from '../locales/es.json';
import pt from '../locales/pt.json';

const LANGUAGE_DETECTOR = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      // First, try to get the stored language preference
      const storedLanguage = await AsyncStorage.getItem('user-language');
      if (storedLanguage) {
        callback(storedLanguage);
        return;
      }

      // If no stored preference, detect from device locale
      // Using a fallback approach for Expo managed workflow
      const deviceLanguage = getDeviceLanguage();
      const supportedLanguages = ['en', 'de', 'es', 'pt'];
      
      if (supportedLanguages.includes(deviceLanguage)) {
        callback(deviceLanguage);
      } else {
        callback('en'); // Default to English
      }
    } catch (error) {
      console.error('Error detecting language:', error);
      callback('en'); // Default to English on error
    }
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      await AsyncStorage.setItem('user-language', language);
    } catch (error) {
      console.error('Error caching language:', error);
    }
  },
};


i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
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
  });

export default i18n;
