# 🚀 FCM Backend Integration Guide

## 📋 Overview

This guide provides comprehensive instructions for integrating Firebase Cloud Messaging (FCM) with your backend APIs in your React Native Asset Management app. The implementation includes all 6 backend endpoints and provides a complete notification system.

## 🏗️ Architecture

### Components Created:
1. **FCMApiClient** - Handles all backend API calls
2. **Enhanced FCMService** - Manages FCM operations and backend integration
3. **NotificationContext** - React Context for state management
4. **NotificationSettingsScreen** - User interface for managing preferences
5. **FCMTestComponent** - Comprehensive testing and debugging tools

## 📱 Implementation Details

### 1. FCM API Client (`services/FCMApiClient.js`)

**Features:**
- Handles all 6 backend endpoints
- Automatic authentication token management
- Device information collection
- Error handling and retry logic
- Request/response logging

**Endpoints Implemented:**
- `POST /api/fcm/register-token` - Register device token
- `POST /api/fcm/unregister-token` - Unregister device token
- `GET /api/fcm/device-tokens` - Get user device tokens
- `PUT /api/fcm/preferences` - Update notification preferences
- `GET /api/fcm/preferences` - Get notification preferences
- `POST /api/fcm/test-notification` - Send test notification

### 2. Enhanced FCM Service (`services/FCMService.js`)

**Features:**
- Backend integration with all API endpoints
- Token management and registration
- Notification preference caching
- User login/logout handling
- Topic subscription management
- Message handling (foreground, background, taps)

**Key Methods:**
```javascript
// Backend Integration
await FCMService.registerTokenWithServer();
await FCMService.unregisterTokenFromServer();
await FCMService.getNotificationPreferences();
await FCMService.updateNotificationPreference(type, preferences);
await FCMService.sendTestNotification(title, body, data);

// User Lifecycle
await FCMService.handleUserLogin();
await FCMService.handleUserLogout();
await FCMService.setAuthToken(token);
```

### 3. Notification Context (`context/NotificationContext.js`)

**Features:**
- Centralized state management
- React Context for app-wide access
- Loading states and error handling
- Automatic data synchronization
- Preference management

**Usage:**
```javascript
import { useNotification } from '../context/NotificationContext';

const MyComponent = () => {
  const {
    fcmToken,
    isRegistered,
    preferences,
    loadPreferences,
    updatePreference,
    sendTestNotification,
  } = useNotification();
  
  // Use notification features
};
```

### 4. Notification Settings Screen (`screens/NotificationSettingsScreen.js`)

**Features:**
- Complete notification preference management
- FCM status display
- Token registration/unregistration
- Global enable/disable controls
- Test notification functionality
- Real-time status updates

**Navigation:**
```javascript
// Navigate to notification settings
navigation.navigate('NotificationSettings');
```

### 5. FCM Test Component (`components/FCMTestComponent.js`)

**Features:**
- Comprehensive testing interface
- Token management and copying
- Test notification sending
- Preference management
- Device token viewing
- Notification history
- Data refresh capabilities

**Navigation:**
```javascript
// Navigate to FCM test component
navigation.navigate('FCMTest');
```

## 🔧 Configuration

### 1. Backend URL Configuration

Update the API base URL in `services/FCMApiClient.js`:

```javascript
// Update this line with your actual backend URL
this.baseURL = 'http://your-backend-url.com/api';
// For development: 'http://localhost:5000/api'
```

### 2. Authentication Integration

The FCM service automatically handles authentication tokens:

```javascript
// Set authentication token when user logs in
await FCMService.setAuthToken(userAuthToken);

// Clear token when user logs out
await FCMService.clearAuthToken();
```

### 3. User Lifecycle Integration

Integrate with your authentication system:

```javascript
// In your login handler
const handleUserLogin = async (userData) => {
  // Your existing login logic
  await FCMService.setAuthToken(userData.token);
  await FCMService.handleUserLogin();
};

// In your logout handler
const handleUserLogout = async () => {
  await FCMService.handleUserLogout();
  // Your existing logout logic
};
```

## 📊 Notification Types Supported

The system supports all backend notification types:

- `asset_created` - New asset created
- `asset_updated` - Asset information updated
- `asset_deleted` - Asset deleted
- `maintenance_due` - Maintenance due
- `maintenance_completed` - Maintenance completed
- `workflow_approval` - Workflow approval required
- `workflow_escalated` - Workflow escalated
- `breakdown_reported` - Asset breakdown reported
- `user_assigned` - User assigned to asset
- `test_notification` - Test notifications

## 🎯 Usage Examples

### 1. Basic FCM Setup

```javascript
import { useNotification } from '../context/NotificationContext';

const MyComponent = () => {
  const { fcmToken, isRegistered, loadPreferences } = useNotification();
  
  useEffect(() => {
    loadPreferences();
  }, []);
  
  return (
    <View>
      <Text>FCM Token: {fcmToken}</Text>
      <Text>Registered: {isRegistered ? 'Yes' : 'No'}</Text>
    </View>
  );
};
```

### 2. Sending Test Notifications

```javascript
const { sendTestNotification } = useNotification();

const handleSendTest = async () => {
  try {
    const result = await sendTestNotification(
      'Test Title',
      'Test message body',
      { type: 'test', customData: 'value' }
    );
    console.log('Notification sent:', result);
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
};
```

### 3. Managing Notification Preferences

```javascript
const { updatePreference, preferences } = useNotification();

const handleTogglePreference = async (type) => {
  const currentPreference = preferences[type] || { isEnabled: true };
  await updatePreference(type, {
    isEnabled: !currentPreference.isEnabled,
    pushEnabled: !currentPreference.isEnabled,
  });
};
```

### 4. Checking Notification Status

```javascript
const { isNotificationEnabled } = useNotification();

const shouldShowNotification = (type) => {
  return isNotificationEnabled(type);
};
```

## 🧪 Testing

### 1. Using the FCM Test Component

1. Navigate to the FCM Test screen
2. Register your FCM token with the server
3. Configure notification preferences
4. Send test notifications
5. Check device tokens and history

### 2. Manual Testing

1. **Token Registration:**
   ```javascript
   await FCMService.registerTokenWithServer();
   ```

2. **Preference Management:**
   ```javascript
   await FCMService.updateNotificationPreference('asset_created', {
     isEnabled: true,
     pushEnabled: true,
     emailEnabled: false,
   });
   ```

3. **Test Notifications:**
   ```javascript
   await FCMService.sendTestNotification(
     'Test Title',
     'Test Body',
     { type: 'test' }
   );
   ```

## 🔍 Debugging

### 1. Console Logs

The system provides comprehensive logging:

```javascript
// FCM API requests and responses
console.log('FCM API Request:', method, url, body);
console.log('FCM API Response:', data);

// Token management
console.log('FCM Token:', token);
console.log('Token registered with server successfully');

// Error handling
console.error('FCM API Error:', error);
```

### 2. Status Checking

```javascript
// Check FCM status
const { fcmToken, isRegistered, preferences } = useNotification();
console.log('FCM Status:', { fcmToken, isRegistered, preferences });
```

### 3. Network Debugging

Enable network debugging in your app to see API calls:

```javascript
// Add to your app for debugging
if (__DEV__) {
  console.log('FCM API Base URL:', FCMApiClient.baseURL);
}
```

## 🚀 Production Considerations

### 1. Error Handling

The system includes comprehensive error handling:

- Network errors with retry logic
- API errors with user-friendly messages
- Token refresh handling
- Graceful degradation

### 2. Performance

- Cached notification preferences
- Optimized API calls
- Background message handling
- Efficient state management

### 3. Security

- Secure token storage
- Authentication integration
- API request validation
- Error message sanitization

## 📱 Navigation Integration

### 1. Add Navigation Buttons

```javascript
// In your HomeScreen or main navigation
<TouchableOpacity onPress={() => navigation.navigate('NotificationSettings')}>
  <Text>Notification Settings</Text>
</TouchableOpacity>

<TouchableOpacity onPress={() => navigation.navigate('FCMTest')}>
  <Text>FCM Test</Text>
</TouchableOpacity>
```

### 2. Deep Linking

Handle notification taps with deep linking:

```javascript
// In your notification handler
const handleNotificationTap = (remoteMessage) => {
  const { data } = remoteMessage;
  
  if (data.screen) {
    navigation.navigate(data.screen, data.params);
  }
};
```

## 🔧 Troubleshooting

### Common Issues:

1. **Token not registering:**
   - Check authentication token
   - Verify backend URL
   - Check network connectivity

2. **Notifications not received:**
   - Verify FCM token
   - Check notification preferences
   - Test with Firebase Console

3. **API errors:**
   - Check backend server status
   - Verify API endpoints
   - Check authentication

### Debug Steps:

1. Check console logs for errors
2. Verify FCM token generation
3. Test API endpoints manually
4. Check notification preferences
5. Test with Firebase Console

## 📚 API Reference

### FCM Service Methods:

```javascript
// Token Management
await FCMService.registerTokenWithServer();
await FCMService.unregisterTokenFromServer();
await FCMService.getToken();

// Preferences
await FCMService.getNotificationPreferences();
await FCMService.updateNotificationPreference(type, preferences);
await FCMService.updateMultiplePreferences(preferencesArray);

// Notifications
await FCMService.sendTestNotification(title, body, data);
await FCMService.getNotificationHistory(limit, offset);

// User Lifecycle
await FCMService.handleUserLogin();
await FCMService.handleUserLogout();
await FCMService.setAuthToken(token);
await FCMService.clearAuthToken();

// Status Checking
FCMService.isNotificationEnabled(type);
FCMService.getNotificationPreference(type);
```

### Context Methods:

```javascript
const {
  // State
  fcmToken,
  isRegistered,
  preferences,
  deviceTokens,
  notificationHistory,
  
  // Actions
  loadPreferences,
  updatePreference,
  updateMultiplePreferences,
  loadDeviceTokens,
  loadNotificationHistory,
  sendTestNotification,
  registerToken,
  unregisterToken,
  setAuthToken,
  clearAuthToken,
  handleUserLogin,
  handleUserLogout,
  isNotificationEnabled,
  getNotificationPreference,
  getAllNotificationTypes,
} = useNotification();
```

## 🎉 Success Criteria

Your FCM integration is successful when:

- ✅ FCM tokens are generated and registered
- ✅ All 6 backend API endpoints are working
- ✅ Notification preferences are managed
- ✅ Test notifications are sent and received
- ✅ User authentication is integrated
- ✅ Error handling works gracefully
- ✅ Performance is optimized
- ✅ Code is well-documented

## 🚀 Next Steps

1. **Update Backend URL** in `FCMApiClient.js`
2. **Test API Integration** using the FCM Test component
3. **Integrate Authentication** with your login system
4. **Configure Notification Preferences** for your users
5. **Test End-to-End** notification flow
6. **Deploy to Production** with proper error handling

---

**Note:** This implementation provides a complete FCM backend integration with all the features you requested. The system is production-ready and includes comprehensive testing and debugging tools.
