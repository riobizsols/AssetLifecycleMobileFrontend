import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import FCMApiClient from './FCMApiClient';
import { authUtils } from '../utils/auth';

class FCMService {
  constructor() {
    this.fcmToken = null;
    this.isInitialized = false;
    this.isRegistered = false;
    this.notificationPreferences = {};
  }

  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    try {
      console.log('🔧 Initializing FCM Service...');

      // Initialize API client
      await FCMApiClient.initialize();

      // Request permission
      const authStatus = await messaging().requestPermission();
      const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('❌ FCM permission not granted');
        return false;
      }

      // Check for existing stored token first
      const storedToken = await authUtils.getFCMToken();
      const isTokenValid = await authUtils.isFCMTokenValid();

      if (storedToken && isTokenValid) {
        console.log('📱 Using stored FCM token');
        this.fcmToken = storedToken;
        this.isRegistered = await authUtils.getFCMTokenRegistered();
      } else {
        // Get new FCM token
        await this.getFCMToken();
      }

      // Set up message handlers
      this.setupMessageHandlers();

      // Set up token refresh handler
      this.setupTokenRefreshHandler();

      // Load cached preferences
      await this.loadNotificationPreferences();

      this.isInitialized = true;
      console.log('✅ FCM Service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ FCM initialization failed:', error);
      return false;
    }
  }

  async getFCMToken() {
    try {
      this.fcmToken = await messaging().getToken();
      console.log('📱 FCM Token:', this.fcmToken);

      // Store token locally
      await authUtils.storeFCMToken(this.fcmToken);

      // Register token with backend
      await this.registerTokenWithBackend();

      return this.fcmToken;
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      throw error;
    }
  }

  async registerTokenWithBackend() {
    try {
      const userToken = await authUtils.getToken();
      if (!userToken || !this.fcmToken) {
        console.log('⚠️ User token or FCM token not available');
        return;
      }

      const result = await FCMApiClient.registerToken(this.fcmToken);
      this.isRegistered = true;

      // Store registration status
      await authUtils.storeFCMTokenRegistered(true);

      console.log('✅ FCM token registered with backend');
      return result;
    } catch (error) {
      console.error('❌ Error registering FCM token:', error);
      this.isRegistered = false;
      await authUtils.storeFCMTokenRegistered(false);
      throw error;
    }
  }

  // Set up token refresh handler
  setupTokenRefreshHandler() {
    // Listen for token refresh
    messaging().onTokenRefresh(async (newToken) => {
      console.log('🔄 FCM token refreshed:', newToken);

      try {
        // Update current token
        this.fcmToken = newToken;

        // Store the new token
        await authUtils.storeFCMToken(newToken);

        // If token was previously registered, re-register with new token
        const wasRegistered = await authUtils.getFCMTokenRegistered();
        if (wasRegistered) {
          console.log('🔄 Re-registering refreshed token with server');
          await this.registerTokenWithBackend();
        }

        console.log('✅ Token refresh handled successfully');
      } catch (error) {
        console.error('❌ Error handling token refresh:', error);
      }
    });
  }

  setupMessageHandlers() {
    // Handle background messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('📨 Message handled in the background!', remoteMessage);
      // Handle background message here
    });

    // Handle foreground messages
    messaging().onMessage(async remoteMessage => {
      console.log('📨 Foreground message received:', remoteMessage);
      this.handleForegroundMessage(remoteMessage);
    });

    // Handle notification tap when app is in background/quit
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('👆 Notification tapped:', remoteMessage);
      this.handleNotificationTap(remoteMessage);
    });

    // Handle app opened from notification
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        console.log('👆 App opened from notification:', remoteMessage);
        this.handleNotificationTap(remoteMessage);
      }
    });
  }

  handleForegroundMessage(remoteMessage) {
    const { notification, data } = remoteMessage;

    console.log('🔔 In-app notification:', {
      title: notification?.title,
      body: notification?.body,
      data: data,
    });

    // Show alert for foreground messages
    if (notification) {
      Alert.alert(
        notification.title || 'New Message',
        notification.body || 'You have a new message',
        [{ text: 'OK' }]
      );
    }
  }

  handleNotificationTap(remoteMessage) {
    const { data } = remoteMessage;

    console.log('🧭 Handling notification tap:', data);

    // Navigate based on notification type
    if (data?.notification_type === 'workflow_approval') {
      // Navigate to maintenance approval screen
      console.log('Navigate to maintenance approval');
    } else if (data?.notification_type === 'breakdown_approval') {
      // Navigate to breakdown approval screen
      console.log('Navigate to breakdown approval');
    } else if (data?.type === 'asset_created') {
      console.log('Navigate to asset details');
    } else if (data?.type === 'maintenance_due') {
      console.log('Navigate to maintenance screen');
    } else if (data?.type === 'breakdown_reported') {
      console.log('Navigate to breakdown screen');
    }

    // You can implement navigation logic here using navigation service
    // Example: navigationService.navigate(data.screen, data.params);
  }

  async sendTestNotification() {
    try {
      const userToken = await authUtils.getToken();
      if (!userToken) {
        throw new Error('User not authenticated');
      }

      const result = await FCMApiClient.sendTestNotification(
        'Test Notification',
        'This will appear on your device!',
        { type: 'test' }
      );

      console.log('✅ Test notification sent');
      return result;
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      throw error;
    }
  }

  async subscribeToTopic(topic) {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`✅ Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error('❌ Error subscribing to topic:', error);
    }
  }

  async unsubscribeFromTopic(topic) {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`✅ Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error('❌ Error unsubscribing from topic:', error);
    }
  }

  // Register token with backend server (legacy method)
  async registerTokenWithServer() {
    return this.registerTokenWithBackend();
  }

  // Unregister token from backend server
  async unregisterTokenFromServer() {
    try {
      if (!this.fcmToken) {
        console.log('⚠️ No FCM token to unregister');
        return;
      }

      const result = await FCMApiClient.unregisterToken(this.fcmToken);
      this.isRegistered = false;

      // Store registration status
      await authUtils.storeFCMTokenRegistered(false);

      console.log('✅ Token unregistered from server successfully');
      return result;
    } catch (error) {
      console.error('❌ Error unregistering token from server:', error);
      throw error;
    }
  }

  // Get user's device tokens
  async getUserDeviceTokens(platform = null) {
    try {
      const result = await FCMApiClient.getDeviceTokens(platform);
      return result.data.tokens;
    } catch (error) {
      console.error('❌ Error getting user device tokens:', error);
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
      console.error('❌ Error loading notification preferences:', error);
    }
  }

  // Save notification preferences to cache
  async saveNotificationPreferences() {
    try {
      await AsyncStorage.setItem('notificationPreferences', JSON.stringify(this.notificationPreferences));
    } catch (error) {
      console.error('❌ Error saving notification preferences:', error);
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
      console.error('❌ Error getting notification preferences:', error);
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
      console.error('❌ Error updating notification preference:', error);
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
      console.error('❌ Error updating multiple preferences:', error);
      throw error;
    }
  }

  // Get notification history
  async getNotificationHistory(limit = 50, offset = 0) {
    try {
      const result = await FCMApiClient.getNotificationHistory(limit, offset);
      return result.data;
    } catch (error) {
      console.error('❌ Error getting notification history:', error);

      // Return empty history if endpoint is not available
      return {
        notifications: [],
        total: 0,
        limit: limit,
        offset: offset,
        note: 'Notification history endpoint not implemented on backend',
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
      if (this.fcmToken && !this.isRegistered) {
        await this.registerTokenWithBackend();
      }
    } catch (error) {
      console.error('❌ Error handling user login:', error);
    }
  }

  // Handle user logout - unregister token
  async handleUserLogout() {
    try {
      if (this.isRegistered) {
        await this.unregisterTokenFromServer();
      }
      await this.clearAuthToken();

      // Clear FCM token from storage
      await authUtils.removeFCMToken();

      // Reset local state
      this.fcmToken = null;
      this.isRegistered = false;

      console.log('✅ FCM logout handled successfully');
    } catch (error) {
      console.error('❌ Error handling user logout:', error);
    }
  }

  // Legacy method for backward compatibility
  async getToken() {
    return this.getFCMToken();
  }

  // Legacy method for backward compatibility
  async sendTokenToServer(token, userId) {
    return this.registerTokenWithBackend();
  }
}

// Create singleton instance
const fcmService = new FCMService();

export default fcmService;
