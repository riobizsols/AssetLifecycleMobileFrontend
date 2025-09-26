import { Platform } from 'react-native';
import * as Localization from 'expo-localization';

/**
 * Get device language using Expo Localization
 * This works with Expo managed workflow
 */
export const getDeviceLanguage = () => {
  try {
    // Get the device's locale using Expo Localization
    const locale = Localization.locale;
    
    // Extract language code from locale (e.g., 'en-US' -> 'en')
    const languageCode = locale.split('-')[0].toLowerCase();
    
    // Check if the language is supported
    if (isLanguageSupported(languageCode)) {
      return languageCode;
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
