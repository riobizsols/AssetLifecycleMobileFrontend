# 🔧 FCM Token Storage Troubleshooting Guide

## 🚨 Issue: Device Token Not Stored in Database

If your FCM device token is not being stored in the database, follow this comprehensive troubleshooting guide.

## 🔍 Step 1: Check API Configuration

### 1.1 Verify Backend URL
The FCM API client now uses your existing API configuration. Check if the URL is correct:

```javascript
// In services/FCMApiClient.js
this.baseURL = `${API_CONFIG.BASE_URL}/api`;
```

**Expected URLs:**
- Development: `http://192.168.0.110:4000/api` (or your network IP)
- Production: `http://103.27.234.248:5000/api`

### 1.2 Test API Connection
Use the FCM Debug component to test the connection:

1. Navigate to `FCMDebug` screen in your app
2. Tap "Test API Connection"
3. Check if the connection is successful

## 🔍 Step 2: Check Authentication

### 2.1 Verify Auth Token
The FCM API uses your existing authentication system. Check if you're logged in:

```javascript
// Check if user is authenticated
import { authUtils } from '../utils/auth';
const isAuthenticated = await authUtils.isAuthenticated();
console.log('User authenticated:', isAuthenticated);
```

### 2.2 Test Headers
Use the FCM Debug component to test headers:

1. Navigate to `FCMDebug` screen
2. Tap "Test Headers"
3. Verify the Authorization header is present

## 🔍 Step 3: Check Backend Endpoints

### 3.1 Verify FCM Endpoints Exist
Make sure your backend has these endpoints:

- `POST /api/fcm/register-token`
- `POST /api/fcm/unregister-token`
- `GET /api/fcm/device-tokens`
- `PUT /api/fcm/preferences`
- `GET /api/fcm/preferences`
- `POST /api/fcm/test-notification`

### 3.2 Test Direct API Call
Use the FCM Debug component to test the direct API call:

1. Navigate to `FCMDebug` screen
2. Tap "Test Direct API Call"
3. Check the response for errors

## 🔍 Step 4: Check FCM Token Generation

### 4.1 Verify FCM Token
Check if the FCM token is being generated:

```javascript
// In your app
const token = await FCMService.getToken();
console.log('FCM Token:', token);
```

### 4.2 Test Token Registration
Use the FCM Debug component to test token registration:

1. Navigate to `FCMDebug` screen
2. Tap "Test Token Registration"
3. Check if the token is successfully registered

## 🔍 Step 5: Check Network Connectivity

### 5.1 Test Network Connection
Make sure your device can reach the backend server:

```bash
# Test from your device/emulator
ping 192.168.0.110  # Replace with your server IP
```

### 5.2 Check Firewall Settings
Ensure your backend server is accessible from the mobile device:

- Check firewall settings
- Verify port 4000 is open
- Test with a simple HTTP request

## 🔍 Step 6: Check Backend Logs

### 6.1 Monitor Backend Logs
Check your backend server logs for:

- Incoming FCM registration requests
- Authentication errors
- Database connection issues
- API endpoint errors

### 6.2 Check Database
Verify the database connection and table structure:

```sql
-- Check if FCM tokens table exists
SHOW TABLES LIKE '%fcm%';

-- Check if tokens are being inserted
SELECT * FROM fcm_tokens ORDER BY created_at DESC LIMIT 10;
```

## 🔍 Step 7: Debug with FCM Debug Component

### 7.1 Use the Debug Component
The FCM Debug component provides comprehensive testing:

1. **Navigate to FCMDebug screen**
2. **Test API Connection** - Verify backend is reachable
3. **Test Headers** - Verify authentication headers
4. **Test Direct API Call** - Test FCM registration endpoint
5. **Test Token Registration** - Full FCM service test

### 7.2 Check Test Results
Look for these common issues in the test results:

- **Connection Error**: Backend server not running
- **Authentication Error**: Invalid or missing auth token
- **Endpoint Error**: FCM endpoints not implemented
- **Network Error**: Connectivity issues

## 🔧 Common Solutions

### Solution 1: Fix API URL
If the API URL is wrong, update it in `config/api.js`:

```javascript
// Update BASE_URL in config/api.js
BASE_URL: 'http://YOUR_SERVER_IP:4000',
```

### Solution 2: Fix Authentication
If authentication is failing, ensure the user is logged in:

```javascript
// In your login handler
await FCMService.setAuthToken(userToken);
await FCMService.handleUserLogin();
```

### Solution 3: Fix Backend Endpoints
If FCM endpoints don't exist, implement them in your backend:

```javascript
// Example FCM registration endpoint
app.post('/api/fcm/register-token', async (req, res) => {
  try {
    const { deviceToken, deviceType, platform, appVersion, deviceInfo } = req.body;
    
    // Store token in database
    const result = await db.query(
      'INSERT INTO fcm_tokens (device_token, device_type, platform, app_version, device_info, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [deviceToken, deviceType, platform, appVersion, JSON.stringify(deviceInfo), req.user.id]
    );
    
    res.json({
      success: true,
      message: 'Device token registered successfully',
      data: { tokenId: result.insertId }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### Solution 4: Fix Database Issues
If database storage is failing, check:

- Database connection
- Table structure
- User permissions
- SQL syntax

## 🧪 Testing Steps

### 1. Test API Connection
```javascript
// Test basic connectivity
fetch('http://YOUR_SERVER_IP:4000/api/health')
  .then(response => response.json())
  .then(data => console.log('API Response:', data))
  .catch(error => console.error('API Error:', error));
```

### 2. Test FCM Registration
```javascript
// Test FCM token registration
const token = await FCMService.getToken();
const result = await FCMService.registerTokenWithServer();
console.log('Registration Result:', result);
```

### 3. Test Database
```sql
-- Check if token was stored
SELECT * FROM fcm_tokens WHERE device_token = 'YOUR_FCM_TOKEN';
```

## 📱 Using the Debug Component

### Navigation
```javascript
// Navigate to FCM Debug screen
navigation.navigate('FCMDebug');
```

### Test Sequence
1. **Test API Connection** - Verify backend is running
2. **Test Headers** - Verify authentication
3. **Test Direct API Call** - Test FCM endpoint
4. **Test Token Registration** - Full integration test

### Expected Results
- ✅ API Connection: Should return success
- ✅ Headers: Should include Authorization header
- ✅ Direct API Call: Should register token successfully
- ✅ Token Registration: Should complete without errors

## 🚨 Emergency Fixes

### Quick Fix 1: Restart Backend
```bash
# Restart your backend server
cd your-backend-directory
npm start
```

### Quick Fix 2: Clear App Data
```javascript
// Clear app data and re-login
await AsyncStorage.clear();
// Re-login and try again
```

### Quick Fix 3: Check Network
```bash
# Test network connectivity
ping YOUR_SERVER_IP
telnet YOUR_SERVER_IP 4000
```

## 📞 Support

If you're still having issues:

1. **Check the FCM Debug component results**
2. **Verify backend server is running**
3. **Check database connectivity**
4. **Test with a simple API call first**
5. **Review backend logs for errors**

## 🎯 Success Criteria

Your FCM token storage is working when:

- ✅ FCM token is generated
- ✅ API connection is successful
- ✅ Authentication headers are present
- ✅ Backend endpoint responds successfully
- ✅ Token is stored in database
- ✅ No errors in console logs

---

**Note**: Use the FCM Debug component to systematically test each part of the FCM integration and identify where the issue is occurring.
