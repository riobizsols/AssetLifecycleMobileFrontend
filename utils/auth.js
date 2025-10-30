import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';
const USER_LANGUAGE_KEY = 'user_language';
const FCM_TOKEN_KEY = 'fcm_token';
const FCM_TOKEN_REGISTERED_KEY = 'fcm_token_registered';

export const authUtils = {
  // Store authentication token
  storeToken: async (token) => {
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      return true;
    } catch (error) {
      console.error('Error storing token:', error);
      return false;
    }
  },

  // Get stored authentication token
  getToken: async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  // Remove authentication token (logout)
  removeToken: async () => {
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_DATA_KEY);
      // Keep language preference on logout
      return true;
    } catch (error) {
      console.error('Error removing token:', error);
      return false;
    }
  },

  // Store user data
  storeUserData: async (userData) => {
    try {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      // Store user's language preference if provided
      if (userData.language_code) {
        await AsyncStorage.setItem(USER_LANGUAGE_KEY, userData.language_code);
      }
      return true;
    } catch (error) {
      console.error('Error storing user data:', error);
      return false;
    }
  },

  // Get stored user data
  getUserData: async () => {
    try {
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      return !!token;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  },

  // Get user's language preference
  getUserLanguage: async () => {
    try {
      const language = await AsyncStorage.getItem(USER_LANGUAGE_KEY);
      return language || 'en'; // Default to English
    } catch (error) {
      console.error('Error getting user language:', error);
      return 'en';
    }
  },

  // Clear all authentication data
  clearAuthData: async () => {
    try {
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
      return true;
    } catch (error) {
      console.error('Error clearing auth data:', error);
      return false;
    }
  },

  // FCM Token Management
  // Store FCM token
  storeFCMToken: async (fcmToken) => {
    try {
      await AsyncStorage.setItem(FCM_TOKEN_KEY, fcmToken);
      console.log('FCM token stored successfully');
      return true;
    } catch (error) {
      console.error('Error storing FCM token:', error);
      return false;
    }
  },

  // Get stored FCM token
  getFCMToken: async () => {
    try {
      const fcmToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      return fcmToken;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  },

  // Remove FCM token (logout)
  removeFCMToken: async () => {
    try {
      await AsyncStorage.removeItem(FCM_TOKEN_KEY);
      await AsyncStorage.removeItem(FCM_TOKEN_REGISTERED_KEY);
      console.log('FCM token removed successfully');
      return true;
    } catch (error) {
      console.error('Error removing FCM token:', error);
      return false;
    }
  },

  // Store FCM token registration status
  storeFCMTokenRegistered: async (isRegistered) => {
    try {
      await AsyncStorage.setItem(FCM_TOKEN_REGISTERED_KEY, JSON.stringify(isRegistered));
      return true;
    } catch (error) {
      console.error('Error storing FCM token registration status:', error);
      return false;
    }
  },

  // Get FCM token registration status
  getFCMTokenRegistered: async () => {
    try {
      const registered = await AsyncStorage.getItem(FCM_TOKEN_REGISTERED_KEY);
      return registered ? JSON.parse(registered) : false;
    } catch (error) {
      console.error('Error getting FCM token registration status:', error);
      return false;
    }
  },

  // Check if FCM token is valid and not expired
  isFCMTokenValid: async () => {
    try {
      const fcmToken = await authUtils.getFCMToken();
      if (!fcmToken) return false;
      
      // Basic token validation - FCM tokens are typically long strings
      // You can add more sophisticated validation here if needed
      return fcmToken.length > 50;
    } catch (error) {
      console.error('Error validating FCM token:', error);
      return false;
    }
  },

  // Clear all stored data (complete logout)
  clearAllData: async () => {
    try {
      await AsyncStorage.multiRemove([
        AUTH_TOKEN_KEY,
        USER_DATA_KEY,
        FCM_TOKEN_KEY,
        FCM_TOKEN_REGISTERED_KEY,
        // Keep language preference
      ]);
      console.log('All user data cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  },
}; 