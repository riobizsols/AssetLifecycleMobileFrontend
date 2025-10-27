import messaging, { getMessaging, getToken, onMessage, onTokenRefresh } from '@react-native-firebase/messaging';
import { Platform, Alert } from 'react-native';
import FCMApiClient from './FCMApiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

class FCMService {
  constructor() {
    this.initialized = false;
    this.currentToken = null;
    this.isRegistered = false;
    this.notificationPreferences = {};
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize API client
      await FCMApiClient.initialize();

      // Request permission for iOS (Android doesn't need explicit permission)
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.log('FCM permission not granted');
          return;
        }
      }

      // Get FCM token
      const token = await this.getToken();
      this.currentToken = token;
      console.log('FCM Token:', token);

      // Set up message handlers
      this.setupMessageHandlers();

      // Load cached preferences
      await this.loadNotificationPreferences();

      this.initialized = true;
      console.log('FCM Service initialized successfully');
    } catch (error) {
      console.error('FCM initialization error:', error);
    }
  }

  async getToken() {
    try {
      const messagingInstance = getMessaging();
      const token = await getToken(messagingInstance);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  setupMessageHandlers() {
    const messagingInstance = getMessaging();
    
    // Handle background messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
      // Handle background message here
    });

    // Handle foreground messages
    onMessage(messagingInstance, async remoteMessage => {
      console.log('A new FCM message arrived!', remoteMessage);
      
      // Show local notification or alert
      if (remoteMessage.notification) {
        Alert.alert(
          remoteMessage.notification.title || 'New Message',
          remoteMessage.notification.body || 'You have a new message',
          [{ text: 'OK' }]
        );
      }
    });

    // Handle notification tap when app is in background/quit
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification caused app to open from background state:', remoteMessage);
      // Handle notification tap
      this.handleNotificationTap(remoteMessage);
    });

    // Handle notification tap when app is completely quit
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', remoteMessage);
          // Handle notification tap
          this.handleNotificationTap(remoteMessage);
        }
      });
  }

  handleNotificationTap(remoteMessage) {
    // Handle navigation based on notification data
    const { data } = remoteMessage;
    
    if (data) {
      // Navigate to specific screen based on notification data
      console.log('Notification data:', data);
      
      // Example: Navigate to specific screen
      // if (data.screen) {
      //   // Navigate to the specified screen
      //   navigationService.navigate(data.screen, data.params);
      // }
    }
  }

  async subscribeToTopic(topic) {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error('Error subscribing to topic:', error);
    }
  }

  async unsubscribeFromTopic(topic) {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
    }
  }

  // Register token with backend server
  async registerTokenWithServer() {
    try {
      if (!this.currentToken) {
        throw new Error('No FCM token available');
      }

      const result = await FCMApiClient.registerToken(this.currentToken);
      this.isRegistered = true;
      console.log('Token registered with server successfully:', result);
      return result;
    } catch (error) {
      console.error('Error registering token with server:', error);
      this.isRegistered = false;
      throw error;
    }
  }

  // Unregister token from backend server
  async unregisterTokenFromServer() {
    try {
      if (!this.currentToken) {
        console.log('No FCM token to unregister');
        return;
      }

      const result = await FCMApiClient.unregisterToken(this.currentToken);
      this.isRegistered = false;
      console.log('Token unregistered from server successfully:', result);
      return result;
    } catch (error) {
      console.error('Error unregistering token from server:', error);
      throw error;
    }
  }

  // Get user's device tokens
  async getUserDeviceTokens(platform = null) {
    try {
      const result = await FCMApiClient.getDeviceTokens(platform);
      return result.data.tokens;
    } catch (error) {
      console.error('Error getting user device tokens:', error);
      throw error;
    }
  }

  // Load notification preferences from cache
  async loadNotificationPreferences() {
    try {
      const cached = await AsyncStorage.getItem('notificationPreferences');
      if (cached) {
        this.notificationPreferences = JSON.parse(cached);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  }

  // Save notification preferences to cache
  async saveNotificationPreferences() {
    try {
      await AsyncStorage.setItem('notificationPreferences', JSON.stringify(this.notificationPreferences));
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  }

  // Get notification preferences from server
  async getNotificationPreferences() {
    try {
      const result = await FCMApiClient.getNotificationPreferences();
      this.notificationPreferences = result.data.preferences.reduce((acc, pref) => {
        acc[pref.notificationType] = pref;
        return acc;
      }, {});
      
      await this.saveNotificationPreferences();
      return result.data.preferences;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      throw error;
    }
  }

  // Update notification preference
  async updateNotificationPreference(notificationType, preferences) {
    try {
      const result = await FCMApiClient.updateNotificationPreferences(notificationType, preferences);
      
      // Update local cache
      this.notificationPreferences[notificationType] = {
        ...this.notificationPreferences[notificationType],
        ...preferences,
      };
      
      await this.saveNotificationPreferences();
      return result;
    } catch (error) {
      console.error('Error updating notification preference:', error);
      throw error;
    }
  }

  // Update multiple notification preferences
  async updateMultiplePreferences(preferencesArray) {
    try {
      const result = await FCMApiClient.updateMultiplePreferences(preferencesArray);
      
      // Update local cache
      preferencesArray.forEach(({ notificationType, preferences }) => {
        this.notificationPreferences[notificationType] = {
          ...this.notificationPreferences[notificationType],
          ...preferences,
        };
      });
      
      await this.saveNotificationPreferences();
      return result;
    } catch (error) {
      console.error('Error updating multiple preferences:', error);
      throw error;
    }
  }

  // Send test notification
  async sendTestNotification(title, body, data = {}) {
    try {
      const result = await FCMApiClient.sendTestNotification(title, body, data);
      return result;
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }

  // Get notification history
  async getNotificationHistory(limit = 50, offset = 0) {
    try {
      const result = await FCMApiClient.getNotificationHistory(limit, offset);
      return result.data;
    } catch (error) {
      console.error('Error getting notification history:', error);
      
      // Return empty history if endpoint is not available
      return {
        notifications: [],
        total: 0,
        limit: limit,
        offset: offset,
        note: 'Notification history endpoint not implemented on backend'
      };
    }
  }

  // Check if notification type is enabled
  isNotificationEnabled(notificationType) {
    const preference = this.notificationPreferences[notificationType];
    return preference ? preference.isEnabled && preference.pushEnabled : true;
  }

  // Get preference for specific notification type
  getNotificationPreference(notificationType) {
    return this.notificationPreferences[notificationType] || {
      isEnabled: true,
      emailEnabled: true,
      pushEnabled: true,
    };
  }

  // Set authentication token
  async setAuthToken(token) {
    await FCMApiClient.setAuthToken(token);
  }

  // Clear authentication token
  async clearAuthToken() {
    await FCMApiClient.clearAuthToken();
    this.isRegistered = false;
  }

  // Handle user login - register token
  async handleUserLogin() {
    try {
      if (this.currentToken && !this.isRegistered) {
        await this.registerTokenWithServer();
      }
    } catch (error) {
      console.error('Error handling user login:', error);
    }
  }

  // Handle user logout - unregister token
  async handleUserLogout() {
    try {
      if (this.isRegistered) {
        await this.unregisterTokenFromServer();
      }
      await this.clearAuthToken();
    } catch (error) {
      console.error('Error handling user logout:', error);
    }
  }

  // Legacy method for backward compatibility
  async sendTokenToServer(token, userId) {
    return this.registerTokenWithServer();
  }
}

export default new FCMService();
