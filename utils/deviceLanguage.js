import { Platform } from 'react-native';
import { getLocales } from 'react-native-localize';

/**
 * Get device language using React Native Localize
 * This works with React Native CLI
 */
export const getDeviceLanguage = () => {
  try {
    // Get the device's locale using React Native Localize
    const locales = getLocales();
    
    if (locales && locales.length > 0) {
      // Extract language code from locale (e.g., 'en-US' -> 'en')
      const languageCode = locales[0].languageCode.toLowerCase();
      
      // Check if the language is supported
      if (isLanguageSupported(languageCode)) {
        return languageCode;
      }
    }
    
    // Default to English if not supported
    return 'en';
  } catch (error) {
    console.error('Error getting device language:', error);
    return 'en';
  }
};

/**
 * Check if a language is supported by the app
 */
export const isLanguageSupported = (languageCode) => {
  const supportedLanguages = ['en', 'de'];
  return supportedLanguages.includes(languageCode);
};

/**
 * Get the best matching language from device preferences
 * This is a placeholder for more sophisticated language detection
 */
export const getBestLanguageMatch = (preferredLanguages = []) => {
  const supportedLanguages = ['en', 'de'];
  
  // Find the first supported language from the preferred list
  for (const lang of preferredLanguages) {
    if (supportedLanguages.includes(lang)) {
      return lang;
    }
  }
  
  // Return default if no match found
  return 'en';
};
