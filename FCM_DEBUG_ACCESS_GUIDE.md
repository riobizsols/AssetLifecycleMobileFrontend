# 🔥 FCM Debug Screen Access Guide

## ✅ **FCM Debug Screen is Now Available!**

I've successfully added the FCM Debug screen to your app navigation. Here's how to access it:

## 📱 **How to Access FCM Debug Screen:**

### **Method 1: Through Home Screen Navigation (Recommended)**

1. **Open your React Native app**
2. **Login with your credentials**
3. **On the Home Screen**, you should now see these new menu items:
   - 🐛 **FCM Debug** - Comprehensive FCM testing
   - 🔔 **FCM Test** - FCM functionality testing
   - ⚙️ **Notification Settings** - Notification preferences

4. **Tap on "FCM Debug"** to open the debug screen

### **Method 2: Direct Navigation (Programmatic)**

If you need to navigate directly in code:
```javascript
// Navigate to FCM Debug screen
navigation.navigate('FCMDebug');

// Navigate to FCM Test screen
navigation.navigate('FCMTest');

// Navigate to Notification Settings
navigation.navigate('NotificationSettings');
```

## 🧪 **What You Can Test in FCM Debug Screen:**

### **1. API Connection Test**
- Tests if backend server is reachable
- Verifies network connectivity
- Shows server response status

### **2. Headers Test**
- Checks authentication headers
- Verifies API configuration
- Shows request headers

### **3. Direct API Call Test**
- Tests FCM registration endpoint directly
- Bypasses app-level logic
- Shows raw API response

### **4. Token Registration Test**
- Full FCM service integration test
- Tests complete token registration flow
- Shows end-to-end functionality

## 🔧 **FCM Debug Features:**

### **Debug Information Display:**
- **API Configuration** - Shows base URL and endpoints
- **FCM Token** - Displays current FCM token
- **Test Results** - Shows success/error status
- **Error Details** - Detailed error information

### **Testing Buttons:**
- **Test API Connection** - Server connectivity
- **Test Headers** - Authentication verification
- **Test Direct API Call** - Endpoint testing
- **Test Token Registration** - Full integration test

### **Results Display:**
- ✅ **Success indicators** for working features
- ❌ **Error messages** for failed tests
- 📊 **Detailed logs** for debugging
- 🔍 **Step-by-step results**

## 🎯 **Expected Results:**

When you open the FCM Debug screen, you should see:

1. **API Configuration Section:**
   - Base URL: `http://192.168.29.150:4000/api`
   - API Config Base: `http://192.168.29.150:4000`

2. **FCM Token Section:**
   - Token displayed (long string starting with letters/numbers)
   - Refresh Token button

3. **Debug Tests Section:**
   - Four test buttons for different scenarios
   - Loading indicators during tests
   - Results display after tests

## 🚨 **Troubleshooting:**

### **If FCM Debug Screen Doesn't Appear:**

1. **Check Navigation Menu:**
   - Look for "FCM Debug" in the home screen menu
   - Should appear as a menu item with bug icon

2. **Restart the App:**
   - Close and reopen the app
   - The navigation changes require a fresh start

3. **Check Console Logs:**
   - Look for navigation loading messages
   - Verify mock data is being used

### **If Tests Fail:**

1. **Check Backend Server:**
   - Make sure your server is running on port 4000
   - Test with: `curl http://192.168.29.150:4000/api/health`

2. **Check Network:**
   - Ensure device and computer are on same network
   - Verify IP address is correct

3. **Check Authentication:**
   - Make sure you're logged in
   - Verify auth token is valid

## 📊 **Navigation Configuration:**

The FCM screens are now configured in:

- **Mock Navigation Data** - Added FCM menu items
- **Navigation Service** - Added screen mappings
- **App.js** - Screen routes configured
- **HomeScreen** - Dynamic menu generation

## 🎉 **Success Indicators:**

Your FCM Debug screen is working when:

- ✅ **FCM Debug appears in home screen menu**
- ✅ **Tapping opens the debug screen**
- ✅ **All test buttons are functional**
- ✅ **API connection test passes**
- ✅ **FCM token is displayed**
- ✅ **No error messages**

## 🔄 **Quick Access:**

For quick testing, you can also use:

```bash
# Run FCM test script
node scripts/test-fcm.js

# Test backend connection
curl http://192.168.29.150:4000/api/health
```

---

**🎯 The FCM Debug screen is now accessible through the home screen navigation menu!**
