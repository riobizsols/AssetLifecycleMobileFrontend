# 🔧 FCM Status Bar Notifications - Complete Troubleshooting Guide

## 🚨 **Issue: Notifications Not Appearing in Status Bar**

If you're not seeing notifications in the status bar, follow this comprehensive troubleshooting guide.

## 🔍 **Step 1: Use the Notification Troubleshooter**

I've created a **Notification Troubleshooter** component that will help diagnose the issue:

1. **Open your app**
2. **Navigate to "Notification Troubleshooter"** (new menu item)
3. **Click "Run Full Diagnostic"**
4. **Review the test results**

## 📱 **Step 2: Check Common Issues**

### **Issue 1: App is in Foreground**
**Problem**: When app is open, notifications show as alerts, not status bar notifications.

**Solution**: 
- **Close the app completely** (swipe up and swipe away)
- **Don't just minimize** (press home button)
- **Send test notification** while app is closed

### **Issue 2: Notification Permissions Not Granted**
**Problem**: Android 13+ requires explicit notification permission.

**Solution**:
1. **Open device Settings**
2. **Go to Apps** → **Asset Management App**
3. **Tap Notifications**
4. **Enable "Allow notifications"**
5. **Or use the troubleshooter** to request permissions

### **Issue 3: Do Not Disturb Mode**
**Problem**: Do Not Disturb blocks all notifications.

**Solution**:
1. **Check notification panel** for Do Not Disturb icon
2. **Disable Do Not Disturb** mode
3. **Or allow notifications** for your app in Do Not Disturb settings

### **Issue 4: Battery Optimization**
**Problem**: Battery optimization can block background notifications.

**Solution**:
1. **Open device Settings**
2. **Go to Battery** → **Battery Optimization**
3. **Find your app** and set to "Don't optimize"
4. **Or use troubleshooter** to open battery settings

### **Issue 5: Notification Channel Disabled**
**Problem**: Notification channel might be disabled.

**Solution**:
1. **Open device Settings**
2. **Go to Apps** → **Asset Management App** → **Notifications**
3. **Check "FCM Default Channel"** is enabled
4. **Enable all notification types**

## 🧪 **Step 3: Test Different Methods**

### **Method 1: Use Troubleshooter**
1. **Open "Notification Troubleshooter"**
2. **Click "Run Full Diagnostic"**
3. **Review results** and follow recommendations
4. **Click "Send Status Bar Test"**
5. **Close app completely** and check status bar

### **Method 2: Use Status Bar Tester**
1. **Open "Status Bar Tester"**
2. **Enter custom title and message**
3. **Click "Send Test Notification"**
4. **Close app completely** and check status bar

### **Method 3: Use Firebase Console**
1. **Go to Firebase Console**
2. **Navigate to Cloud Messaging**
3. **Click "Send your first message"**
4. **Enter title and message**
5. **Select your app**
6. **Send notification**
7. **Close app** and check status bar

## 🔧 **Step 4: Manual Checks**

### **Check 1: FCM Token**
```bash
# Check if FCM token is generated
adb logcat | grep "FCM Token"
```

### **Check 2: Notification Permissions**
```bash
# Check notification permissions
adb shell dumpsys notification | grep "AssetManagementApp"
```

### **Check 3: App State**
- **Make sure app is completely closed**
- **Not just minimized or in background**
- **Check recent apps** - app should not be there

## 🛠️ **Step 5: Advanced Troubleshooting**

### **Check Android Manifest**
Ensure these permissions are present:
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

### **Check FCM Service**
Ensure `MyFirebaseMessagingService.java` is properly configured:
- Service is declared in AndroidManifest.xml
- `onMessageReceived` method is implemented
- `sendNotification` method creates notifications

### **Check Notification Channel**
Ensure notification channel is created:
- Channel ID: "fcm_default_channel"
- Channel name: "FCM Default Channel"
- Importance: IMPORTANCE_DEFAULT

## 📊 **Step 6: Debug Information**

### **Check Logs**
```bash
# Monitor FCM logs
adb logcat | grep -E "(FCM|Firebase|Notification)"

# Monitor notification service
adb logcat | grep "MyFirebaseMessagingService"
```

### **Check Device Settings**
1. **Settings** → **Apps** → **Asset Management App**
2. **Notifications** → **All notifications** (should be ON)
3. **Battery** → **Battery optimization** (should be OFF)
4. **Sound** → **Do not disturb** (should be OFF)

## 🎯 **Step 7: Test Scenarios**

### **Scenario 1: App Closed**
1. **Close app completely**
2. **Send test notification**
3. **Check status bar** for notification
4. **Tap notification** to open app

### **Scenario 2: App in Background**
1. **Minimize app** (don't close)
2. **Send test notification**
3. **Check status bar** for notification
4. **Tap notification** to bring app to foreground

### **Scenario 3: App in Foreground**
1. **Keep app open**
2. **Send test notification**
3. **Should show alert dialog** (not status bar)
4. **This is expected behavior**

## 🚀 **Step 8: Quick Fixes**

### **Fix 1: Restart App**
1. **Force close** the app
2. **Clear app data** (if needed)
3. **Restart** the app
4. **Test notifications**

### **Fix 2: Restart Device**
1. **Restart** your Android device
2. **Open app** and test notifications
3. **Check status bar** for notifications

### **Fix 3: Reinstall App**
1. **Uninstall** the app
2. **Reinstall** from development build
3. **Grant permissions** when prompted
4. **Test notifications**

## 📋 **Step 9: Verification Checklist**

- [ ] **Notification permissions granted**
- [ ] **Do Not Disturb disabled**
- [ ] **Battery optimization disabled**
- [ ] **App completely closed**
- [ ] **FCM token generated**
- [ ] **Backend server running**
- [ ] **Test notification sent**
- [ ] **Status bar checked**

## 🎉 **Expected Results**

### **When Working Correctly:**
- ✅ **Status bar shows notification** with your title and message
- ✅ **Notification has app icon**
- ✅ **Sound and vibration** work (if enabled)
- ✅ **Tapping notification** opens the app
- ✅ **App opens to MainActivity**

### **When Not Working:**
- ❌ **No notification in status bar**
- ❌ **Alert dialog appears instead** (app in foreground)
- ❌ **Permission denied** errors
- ❌ **FCM token not generated**

## 🔧 **Use the Troubleshooter**

The **Notification Troubleshooter** component will:
- ✅ **Check permissions** automatically
- ✅ **Test FCM token** generation
- ✅ **Send test notifications**
- ✅ **Provide specific recommendations**
- ✅ **Open device settings** for you

**Navigate to "Notification Troubleshooter" in your app to get started!**

---

**🎯 Follow these steps systematically to resolve status bar notification issues!**
