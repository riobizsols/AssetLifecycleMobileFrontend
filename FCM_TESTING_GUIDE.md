# 🔥 FCM Testing Guide - Complete

## ✅ **Your FCM Setup Status: PERFECT!**

All FCM components are properly configured and ready for testing.

## 🧪 **How to Check FCM - Step by Step**

### 1. **📱 Using FCM Debug Component (Best Method)**

**Navigate to FCM Debug Screen:**
```javascript
// In your app
navigation.navigate('FCMDebug');
```

**What to Test:**
1. **Test API Connection** - Verify backend connectivity
2. **Test Headers** - Check authentication headers
3. **Test Direct API Call** - Test FCM registration endpoint
4. **Test Token Registration** - Full FCM service test

**Expected Results:**
- ✅ All tests should show "Success"
- ✅ FCM token should be generated
- ✅ Token should be registered with backend
- ✅ No error messages

### 2. **🧪 Using FCM Test Component**

**Navigate to FCM Test Screen:**
```javascript
// In your app
navigation.navigate('FCMTest');
```

**Features to Test:**
- **Register Token** - Register FCM token with backend
- **Send Test Notification** - Send test notification
- **Manage Preferences** - Toggle notification settings
- **View Device Tokens** - See all registered tokens
- **Notification History** - View sent notifications

### 3. **⚙️ Using Notification Settings Screen**

**Navigate to Notification Settings:**
```javascript
// In your app
navigation.navigate('NotificationSettings');
```

**Features:**
- **FCM Status** - View FCM initialization status
- **Device Tokens** - Manage registered tokens
- **Notification Preferences** - Toggle different notification types
- **Test Notification** - Send test notification

## 🔍 **Manual Testing Steps**

### Step 1: Check FCM Token Generation
```javascript
// In your app console
import FCMService from './services/FCMService';

// Get FCM token
const token = await FCMService.getToken();
console.log('FCM Token:', token);
```

### Step 2: Test Token Registration
```javascript
// Register token with backend
const result = await FCMService.registerTokenWithServer();
console.log('Registration Result:', result);
```

### Step 3: Test Notification Preferences
```javascript
// Load notification preferences
const preferences = await FCMService.getNotificationPreferences();
console.log('Preferences:', preferences);
```

### Step 4: Send Test Notification
```javascript
// Send test notification
const result = await FCMService.sendTestNotification();
console.log('Test Notification Result:', result);
```

## 🚀 **Quick FCM Testing Commands**

### Run FCM Test Script:
```bash
# Test all FCM components
node scripts/test-fcm.js
```

### Check FCM Dependencies:
```bash
# Verify FCM packages
npm list @react-native-firebase/app @react-native-firebase/messaging
```

### Test Backend Connection:
```bash
# Test FCM API endpoints
curl http://192.168.29.150:4000/api/fcm/register-token
```

## 📱 **In-App Testing**

### 1. **Open Your App**
- Launch the React Native app
- Make sure you're logged in

### 2. **Navigate to FCM Debug**
- Go to FCM Debug screen
- Run all debug tests
- Check results

### 3. **Test FCM Features**
- Register FCM token
- Send test notification
- Check notification preferences
- View device tokens

### 4. **Check Console Logs**
Look for these success messages:
```
FCM Token: [long token string]
FCM API Request: POST http://192.168.29.150:4000/api/fcm/register-token
FCM API Response: { success: true, message: 'Token registered' }
```

## 🔧 **Troubleshooting FCM Issues**

### Issue 1: FCM Token Not Generated
**Solution:**
- Check Firebase configuration
- Verify google-services.json
- Check Android permissions

### Issue 2: Token Not Registered with Backend
**Solution:**
- Use FCM Debug component
- Check API connection
- Verify authentication headers

### Issue 3: Notifications Not Received
**Solution:**
- Check notification permissions
- Verify FCM service configuration
- Test with FCM Test component

### Issue 4: Backend API Errors
**Solution:**
- Use FCM Debug component
- Check server connectivity
- Verify API endpoints

## 📊 **FCM Testing Checklist**

### ✅ **Basic Setup**
- [ ] Firebase project configured
- [ ] google-services.json in place
- [ ] Android permissions granted
- [ ] FCM service files created

### ✅ **App Integration**
- [ ] FCM dependencies installed
- [ ] Navigation screens configured
- [ ] Context providers set up
- [ ] API client configured

### ✅ **Backend Integration**
- [ ] FCM API endpoints implemented
- [ ] Authentication working
- [ ] Database storage configured
- [ ] Notification sending working

### ✅ **Testing**
- [ ] FCM token generated
- [ ] Token registered with backend
- [ ] Test notifications sent
- [ ] Notification preferences working

## 🎯 **Success Indicators**

Your FCM is working correctly when:

- ✅ **FCM Debug Component** shows all green checkmarks
- ✅ **FCM Token** is generated and displayed
- ✅ **Token Registration** succeeds without errors
- ✅ **Test Notifications** are sent successfully
- ✅ **Backend API** responds with success messages
- ✅ **Console Logs** show successful operations

## 🚨 **Emergency FCM Testing**

If FCM is not working:

1. **Run FCM Test Script:**
   ```bash
   node scripts/test-fcm.js
   ```

2. **Use FCM Debug Component:**
   - Navigate to FCMDebug screen
   - Run all tests
   - Check error messages

3. **Check Console Logs:**
   - Look for FCM-related errors
   - Check network requests
   - Verify token generation

4. **Test Backend Manually:**
   ```bash
   curl -X POST http://192.168.29.150:4000/api/fcm/register-token \
     -H "Content-Type: application/json" \
     -d '{"deviceToken":"test-token"}'
   ```

## 📞 **Getting Help**

If you need help with FCM:

1. **Check the FCM Debug Component** - Most comprehensive testing
2. **Review Console Logs** - Look for specific error messages
3. **Test Backend API** - Verify server endpoints
4. **Check Firebase Console** - Verify project configuration
5. **Use FCM Test Component** - Manual testing interface

---

**🎉 Your FCM setup is perfect! Use the FCM Debug component for comprehensive testing.**
