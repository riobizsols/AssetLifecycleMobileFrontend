import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';
import { API_CONFIG, getApiHeaders } from '../config/api';

class FCMApiClient {
  constructor() {
    this.baseURL = `${API_CONFIG.BASE_URL}/api`; // Use existing API configuration
    this.authToken = null;
  }

  // Initialize with authentication token
  async initialize() {
    try {
      // Use existing auth system instead of separate authToken
      console.log('FCM API Client initialized with base URL:', this.baseURL);
    } catch (error) {
      console.error('Error initializing FCM API client:', error);
    }
  }

  // Update authentication token
  async setAuthToken(token) {
    // Use existing auth system
    console.log('FCM API Client: Auth token updated');
  }

  // Clear authentication token
  async clearAuthToken() {
    // Use existing auth system
    console.log('FCM API Client: Auth token cleared');
  }

  // Get request headers using existing API configuration
  async getHeaders() {
    try {
      return await getApiHeaders();
    } catch (error) {
      console.error('Error getting API headers:', error);
      return {
        'Content-Type': 'application/json',
      };
    }
  }

  // Make HTTP request with error handling
  async makeRequest(endpoint, method = 'GET', body = null) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers = await this.getHeaders();
      
      const options = {
        method,
        headers,
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      console.log(`FCM API Request: ${method} ${url}`, body);
      console.log('FCM API Headers:', headers);

      const response = await fetch(url, options);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      console.log(`FCM API Response: ${method} ${url}`, data);
      return data;
    } catch (error) {
      console.error(`FCM API Error: ${method} ${endpoint}`, error);
      throw error;
    }
  }

  // Get device information
  async getDeviceInfo() {
    try {
      const model = await DeviceInfo.getModel();
      const osVersion = await DeviceInfo.getSystemVersion();
      const manufacturer = await DeviceInfo.getManufacturer();
      const appVersion = await DeviceInfo.getVersion();

      return {
        model,
        osVersion,
        manufacturer,
        appVersion,
      };
    } catch (error) {
      console.error('Error getting device info:', error);
      return {
        model: 'Unknown',
        osVersion: Platform.Version.toString(),
        manufacturer: 'Unknown',
        appVersion: '1.0.0',
      };
    }
  }

  // 1. Register Device Token
  async registerToken(deviceToken) {
    try {
      const deviceInfo = await this.getDeviceInfo();
      
      const requestBody = {
        deviceToken,
        deviceType: 'mobile',
        platform: Platform.OS,
        appVersion: deviceInfo.appVersion,
        deviceInfo: {
          model: deviceInfo.model,
          osVersion: deviceInfo.osVersion,
          manufacturer: deviceInfo.manufacturer,
        },
      };

      return await this.makeRequest('/fcm/register-token', 'POST', requestBody);
    } catch (error) {
      console.error('Error registering device token:', error);
      throw error;
    }
  }

  // 2. Unregister Device Token
  async unregisterToken(deviceToken) {
    try {
      const requestBody = {
        deviceToken,
      };

      return await this.makeRequest('/fcm/unregister-token', 'POST', requestBody);
    } catch (error) {
      console.error('Error unregistering device token:', error);
      throw error;
    }
  }

  // 3. Get User Device Tokens
  async getDeviceTokens(platform = null) {
    try {
      let endpoint = '/fcm/device-tokens';
      if (platform) {
        endpoint += `?platform=${platform}`;
      }

      return await this.makeRequest(endpoint, 'GET');
    } catch (error) {
      console.error('Error getting device tokens:', error);
      throw error;
    }
  }

  // 4. Update Notification Preferences
  async updateNotificationPreferences(notificationType, preferences) {
    try {
      const requestBody = {
        notificationType,
        preferences,
      };

      return await this.makeRequest('/fcm/preferences', 'PUT', requestBody);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  // 5. Get Notification Preferences
  async getNotificationPreferences() {
    try {
      return await this.makeRequest('/fcm/preferences', 'GET');
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      throw error;
    }
  }

  // 6. Send Test Notification
  async sendTestNotification(title, body, data = {}) {
    try {
      const requestBody = {
        title,
        body,
        data: {
          type: 'test',
          ...data,
        },
      };

      return await this.makeRequest('/fcm/test-notification', 'POST', requestBody);
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }

  // Batch update multiple notification preferences
  async updateMultiplePreferences(preferencesArray) {
    try {
      const promises = preferencesArray.map(({ notificationType, preferences }) =>
        this.updateNotificationPreferences(notificationType, preferences)
      );

      const results = await Promise.allSettled(promises);
      
      return {
        success: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length,
        results,
      };
    } catch (error) {
      console.error('Error updating multiple preferences:', error);
      throw error;
    }
  }

  // Get notification history (if backend supports it)
  async getNotificationHistory(limit = 50, offset = 0) {
    try {
      return await this.makeRequest(`/fcm/notification-history?limit=${limit}&offset=${offset}`, 'GET');
    } catch (error) {
      console.error('Error getting notification history:', error);
      
      // If the endpoint doesn't exist, return mock data
      if (error.message.includes('Cannot GET') || error.message.includes('404')) {
        console.log('Notification history endpoint not available, returning mock data');
        return {
          success: true,
          message: 'Notification history endpoint not implemented',
          data: {
            notifications: [],
            total: 0,
            limit: limit,
            offset: offset,
            note: 'This endpoint is not implemented on the backend yet'
          }
        };
      }
      
      throw error;
    }
  }
}

export default new FCMApiClient();
