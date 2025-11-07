import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
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

      // Request notification permission
      const permissionGranted = await this.requestNotificationPermission();
      if (!permissionGranted) {
        console.log('❌ Notification permission not granted');
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
        // Get new FCM token (may return null for free accounts or missing entitlements)
        const token = await this.getFCMToken();
        if (!token) {
          // Error already logged in getFCMToken with appropriate level
          // App can still function, just without FCM
        }
      }

      // Set up message handlers (only if we have a token or on Android)
      if (this.fcmToken || Platform.OS === 'android') {
        this.setupMessageHandlers();
        this.setupTokenRefreshHandler();
      } else {
        console.log('⚠️ Skipping message handlers - no FCM token available');
      }

      // Load cached preferences
      await this.loadNotificationPreferences();

      this.isInitialized = true;
      
      if (this.fcmToken) {
        console.log('✅ FCM Service initialized successfully with token');
      } else {
        console.log('⚠️ FCM Service initialized but no token available');
        console.log('   App will continue to work, but push notifications are disabled');
      }
      
      return true;
    } catch (error) {
      console.error('❌ FCM initialization failed:', error);
      // Don't fail initialization completely - app can still work
      this.isInitialized = true;
      return true;
    }
  }

  async requestNotificationPermission() {
    try {
      if (Platform.OS === 'android') {
        // For Android 13+ (API 33+), we need to request POST_NOTIFICATIONS permission
        const checkResult = await check(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
        console.log('📱 Android notification permission status:', checkResult);

        if (checkResult === RESULTS.GRANTED) {
          console.log('✅ Android notification permission already granted');
          return true;
        }

        // UNAVAILABLE means permission doesn't exist (Android < 13), so proceed
        if (checkResult === RESULTS.UNAVAILABLE) {
          console.log('✅ Android < 13 detected - notification permission not required');
          return true;
        }

        // Blocked - user needs to enable in settings
        if (checkResult === RESULTS.BLOCKED) {
          Alert.alert(
            'Notification Permission Blocked',
            'Notification permission is blocked. Please enable it in your device settings (Settings > Apps > Asset Management App > Notifications) to receive push notifications.',
            [{ text: 'OK' }]
          );
          return false;
        }

        // Limited - proceed but might have limited functionality
        if (checkResult === RESULTS.LIMITED) {
          console.log('⚠️ Android notification permission is limited');
          return true;
        }

        // DENIED - request permission
        if (checkResult === RESULTS.DENIED) {
          console.log('🔔 Requesting Android notification permission...');
          const requestResult = await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
          console.log('📱 Android notification permission request result:', requestResult);

          if (requestResult === RESULTS.GRANTED) {
            console.log('✅ Android notification permission granted');
            return true;
          } else if (requestResult === RESULTS.BLOCKED) {
            Alert.alert(
              'Notification Permission Blocked',
              'Notification permission is blocked. Please enable it in your device settings to receive push notifications.',
              [{ text: 'OK' }]
            );
            return false;
          } else {
            console.log('❌ Android notification permission denied');
            Alert.alert(
              'Notification Permission Required',
              'Please enable notification permissions to receive push notifications. You can enable it later in Settings.',
              [{ text: 'OK' }]
            );
            // Allow app to continue, but notifications won't work
            return false;
          }
        }

        return false;
      } else {
        // For iOS, use Firebase's requestPermission
        const authStatus = await messaging().requestPermission();
        const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                       authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        
        if (enabled) {
          console.log('✅ iOS notification permission granted');
        } else {
          console.log('❌ iOS notification permission denied');
        }
        
        return enabled;
      }
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      // For Android, if there's an error (e.g., API < 33), we can still proceed
      // as POST_NOTIFICATIONS is only required for API 33+
      if (Platform.OS === 'android') {
        console.log('⚠️ Permission check failed, proceeding anyway (may be API < 33)');
        return true;
      }
      return false;
    }
  }

  async getFCMToken() {
    try {
      // On iOS, register device for remote messages before getting token
      if (Platform.OS === 'ios') {
        try {
          await messaging().registerDeviceForRemoteMessages();
          console.log('✅ iOS device registered for remote messages');
        } catch (registerError) {
          // If already registered, this will throw an error - that's okay
          if (registerError.code === 'messaging/already-registered') {
            console.log('✅ iOS device already registered for remote messages');
          } else if (registerError.code === 'messaging/unknown' && 
                     registerError.message?.includes('aps-environment')) {
            // Missing entitlement - likely free developer account
            console.log('ℹ️ Push notifications not available (missing aps-environment entitlement)');
            console.log('💡 This is normal for free Apple Developer accounts');
            console.log('💡 App will continue without push notifications');
            this.fcmToken = null;
            return null;
          } else {
            // Other registration errors - log but continue
            console.log('⚠️ Could not register device for remote messages:', registerError.message);
            // Continue anyway - might still work
          }
        }
      }

      this.fcmToken = await messaging().getToken();
      console.log('📱 FCM Token:', this.fcmToken);

      // Store token locally
      await authUtils.storeFCMToken(this.fcmToken);

      // Register token with backend
      await this.registerTokenWithBackend();

      return this.fcmToken;
    } catch (error) {
      // Handle specific iOS errors gracefully
      if (Platform.OS === 'ios') {
        // Check for entitlement errors (most common issue)
        if (error.code === 'messaging/unknown' && 
            error.message?.includes('aps-environment')) {
          console.log('ℹ️ Push notifications not available (aps-environment entitlement issue)');
          console.log('💡 This is normal for free Apple Developer accounts');
          console.log('💡 App will continue without push notifications');
          
          this.fcmToken = null;
          return null;
        }
        
        // Check if it's an APNs token error (free account limitation)
        if (error.code === 'messaging/unknown' && 
            (error.message?.includes('APNS token') || 
             error.message?.includes('No APNS token'))) {
          console.log('ℹ️ FCM Token unavailable: APNs token required');
          console.log('💡 This typically means using free Apple Developer account');
          console.log('💡 App will continue without push notifications');
          
          // Don't throw - allow app to continue without FCM token
          this.fcmToken = null;
          return null;
        }
        
        // Check for unregistered device error
        if (error.code === 'messaging/unregistered') {
          console.log('ℹ️ Device not registered for remote messages');
          console.log('💡 This may be due to missing entitlements or free developer account');
          console.log('💡 App will continue without push notifications');
          
          this.fcmToken = null;
          return null;
        }
      }
      
      // For other errors, log but don't crash
      console.log('⚠️ Could not get FCM token:', error.message || error);
      this.fcmToken = null;
      return null;
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
        // On iOS, ensure device is registered for remote messages
        if (Platform.OS === 'ios') {
          try {
            await messaging().registerDeviceForRemoteMessages();
          } catch (registerError) {
            // If already registered, that's fine - continue
            if (registerError.code === 'messaging/already-registered') {
              // Already registered, continue
            } else if (registerError.code === 'messaging/unknown' && 
                       registerError.message?.includes('aps-environment')) {
              // Missing entitlement - skip token refresh
              console.log('ℹ️ Skipping token refresh (push notifications not available)');
              return;
            } else {
              // Other errors - log but continue
              console.log('⚠️ Could not register device during token refresh:', registerError.message);
            }
          }
        }

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
    // Note: Background message handler is registered in index.js
    // It must be registered at the top level before AppRegistry.registerComponent

    // Handle foreground messages
    messaging().onMessage(async remoteMessage => {
      console.log('📨 Foreground message received:', remoteMessage);
      this.handleForegroundMessage(remoteMessage);
      // Note: Unread count is incremented in NotificationHandler component
      // which has access to NotificationContext
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

    // Don't show alert popup in foreground - badge will indicate new notification
    // Just log the notification for debugging
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

  // Get notification history with optional filters
  /**
   * Get notification history for current user
   * @param {Object} filters - Optional filters (notificationType, status, startDate, endDate, limit, offset)
   * @returns {Promise<Object>} Notification history object with userId and history array
   */
  async getNotificationHistory(filters = {}) {
    try {
      // Set default values for limit and offset if not provided
      const queryFilters = {
        limit: filters.limit || 50,
        offset: filters.offset || 0,
        ...filters,
      };

      const result = await FCMApiClient.getNotificationHistory(queryFilters);
      
      if (result && result.success) {
        console.log('✅ Notification history retrieved:', result.data?.history?.length || 0, 'items');
        return result.data; // Returns { userId, history: [...] }
      } else if (result && result.data) {
        // Handle case where response might not have success field
        return result.data;
      } else {
        throw new Error(result?.message || 'Failed to get notification history');
      }
    } catch (error) {
      console.error('❌ Error getting notification history:', error);

      // Return empty history if endpoint is not available
      return {
        userId: null,
        history: [],
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

  // Public method to manually request notification permission
  // Useful if user denied permission initially and wants to grant it later
  async requestPermissionManually() {
    return this.requestNotificationPermission();
  }

  // Check current notification permission status
  async checkNotificationPermission() {
    try {
      if (Platform.OS === 'android') {
        const result = await check(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
        return result === RESULTS.GRANTED;
      } else {
        const authStatus = await messaging().hasPermission();
        return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
               authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      }
    } catch (error) {
      console.error('❌ Error checking notification permission:', error);
      return false;
    }
  }
}

// Create singleton instance
const fcmService = new FCMService();

export default fcmService;
