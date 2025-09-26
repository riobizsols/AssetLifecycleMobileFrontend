import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authUtils } from '../utils/auth';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        // First try to get user's language from auth utils (from login API)
        const userLanguage = await authUtils.getUserLanguage();
        
        if (userLanguage && userLanguage !== currentLanguage) {
          console.log('Setting language from user data:', userLanguage);
          setCurrentLanguage(userLanguage);
          await i18n.changeLanguage(userLanguage);
        } else {
          // Fallback to stored language preference
          const savedLanguage = await AsyncStorage.getItem('user-language');
          if (savedLanguage && savedLanguage !== currentLanguage) {
            console.log('Setting language from saved preference:', savedLanguage);
            setCurrentLanguage(savedLanguage);
            await i18n.changeLanguage(savedLanguage);
          }
        }
      } catch (error) {
        console.error('Error loading saved language:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedLanguage();
  }, []);

  // Listen for changes in user language preference
  useEffect(() => {
    const checkUserLanguage = async () => {
      try {
        const userLanguage = await authUtils.getUserLanguage();
        if (userLanguage && userLanguage !== currentLanguage) {
          console.log('User language changed, updating to:', userLanguage);
          setCurrentLanguage(userLanguage);
          await i18n.changeLanguage(userLanguage);
        }
      } catch (error) {
        console.error('Error checking user language:', error);
      }
    };

    // Check every 2 seconds for user language changes (e.g., after login)
    const interval = setInterval(checkUserLanguage, 2000);
    
    return () => clearInterval(interval);
  }, [currentLanguage]);

  const changeLanguage = async (languageCode) => {
    try {
      await i18n.changeLanguage(languageCode);
      await AsyncStorage.setItem('user-language', languageCode);
      setCurrentLanguage(languageCode);
    } catch (error) {
      console.error('Error changing language:', error);
      throw error;
    }
  };

  const getAvailableLanguages = () => {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    ];
  };

  const getCurrentLanguageInfo = () => {
    const languages = getAvailableLanguages();
    return languages.find(lang => lang.code === currentLanguage) || languages[0];
  };

  const value = {
    currentLanguage,
    changeLanguage,
    getAvailableLanguages,
    getCurrentLanguageInfo,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
