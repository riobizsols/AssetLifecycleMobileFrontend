# iOS Simulator Notification Troubleshooting Guide

## Issue: Simulator Not Receiving Notifications

If notifications aren't appearing on the iOS Simulator, follow these steps:

## ✅ Step 1: Verify Prerequisites

### Check iOS Version
```bash
# Your simulator must be iOS 16+ for push notifications
xcrun simctl list runtimes | grep -i "iOS"
```

**Required**: iOS 16.0 or later

### Check Simulator is Running
```bash
xcrun simctl list devices | grep Booted
```

You should see a booted simulator.

## ✅ Step 2: Verify App is Installed

```bash
# Check if app is installed
xcrun simctl get_app_container booted org.reactjs.native.example.AssetManagementApp
```

If this fails, install the app:
```bash
npx react-native run-ios
```

## ✅ Step 3: Request Notification Permission

**IMPORTANT**: The app must request notification permission first!

1. **Launch your app** on the simulator
2. **Check if permission dialog appears** - if not, your app needs to request permission
3. **Grant permission** when prompted

Your app should call:
```javascript
// This should be in FCMService.js
await messaging().requestPermission(); // iOS
```

## ✅ Step 4: Test Notification Manually

```bash
# Create test payload
cat > /tmp/test_notification.json << 'EOF'
{
  "aps": {
    "alert": {
      "title": "Test Notification",
      "body": "Testing push notification"
    },
    "sound": "default",
    "badge": 1
  },
  "data": {
    "type": "test"
  }
}
EOF

# Send to simulator
xcrun simctl push booted org.reactjs.native.example.AssetManagementApp /tmp/test_notification.json
```

**Expected output**: `Notification sent to 'org.reactjs.native.example.AssetManagementApp'`

## ✅ Step 5: Check AppDelegate Setup

The AppDelegate must have:
1. ✅ `UNUserNotificationCenterDelegate` protocol
2. ✅ `UNUserNotificationCenter.current().delegate = self`
3. ✅ Notification handling methods

**Status**: ✅ **FIXED** - AppDelegate has been updated with notification handling

## ✅ Step 6: Verify Info.plist Configuration

Check `ios/AssetManagementApp/Info.plist` has:
```xml
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
</array>
```

**Status**: ✅ **CONFIGURED** - Already present

## ✅ Step 7: Rebuild the App

After updating AppDelegate, you MUST rebuild:

```bash
# Clean build
cd ios
rm -rf build
cd ..

# Rebuild and run
npx react-native run-ios
```

Or in Xcode:
1. Product → Clean Build Folder (Shift+Cmd+K)
2. Product → Run (Cmd+R)

## ✅ Step 8: Test Different Scenarios

### Test 1: App in Foreground
1. Keep app open
2. Send notification
3. Should appear as banner at top

### Test 2: App in Background
1. Press `Cmd + Shift + H` (go to home)
2. Send notification
3. Should appear in notification center

### Test 3: App Closed
1. Swipe up to close app completely
2. Send notification
3. Tap notification to launch app

## 🔍 Common Issues & Solutions

### Issue 1: "Notification sent" but nothing appears

**Possible Causes**:
- ❌ Notification permission not granted
- ❌ App not running or crashed
- ❌ Wrong bundle ID

**Solutions**:
1. **Check permission**: Settings → Asset Management App → Notifications (should be ON)
2. **Restart app**: Close and reopen the app
3. **Verify bundle ID**: Check in Xcode (Target → General → Bundle Identifier)

### Issue 2: Permission dialog doesn't appear

**Solution**: Your app needs to request permission. Check `FCMService.js`:
```javascript
// Should be called on app start
await messaging().requestPermission();
```

### Issue 3: Notifications work but handlers don't fire

**Solution**: Check that:
1. FCMService is initialized
2. Message handlers are set up
3. Check console logs for errors

### Issue 4: "No booted simulator found"

**Solution**:
```bash
# List available simulators
xcrun simctl list devices

# Boot a simulator
xcrun simctl boot "iPhone 15"
# Or open Simulator app
open -a Simulator
```

### Issue 5: Wrong bundle ID error

**Solution**:
1. Find your actual bundle ID:
   ```bash
   grep -r "PRODUCT_BUNDLE_IDENTIFIER" ios/AssetManagementApp.xcodeproj/project.pbxproj
   ```
2. Update the test script with correct bundle ID
3. Or use the bundle ID directly in the command

### Issue 6: App crashes on notification

**Solution**:
1. Check Xcode console for crash logs
2. Verify AppDelegate methods are properly implemented
3. Check for any Swift syntax errors

## 🧪 Diagnostic Commands

```bash
# Check simulator status
xcrun simctl list devices | grep Booted

# Check installed apps
xcrun simctl listapps booted | grep -i asset

# Check iOS version
xcrun simctl list runtimes

# Test notification (replace BUNDLE_ID)
xcrun simctl push booted BUNDLE_ID /tmp/test_notification.json

# Check app container
xcrun simctl get_app_container booted org.reactjs.native.example.AssetManagementApp
```

## 📋 Checklist

Before testing, verify:
- [ ] iOS Simulator 16+ is running
- [ ] App is installed and has been opened at least once
- [ ] Notification permission has been granted
- [ ] AppDelegate has UNUserNotificationCenterDelegate
- [ ] Info.plist has UIBackgroundModes with remote-notification
- [ ] App has been rebuilt after AppDelegate changes
- [ ] Bundle ID matches in script and Xcode

## 🎯 Quick Test Sequence

```bash
# 1. Make sure simulator is running
open -a Simulator

# 2. Build and run app
npx react-native run-ios

# 3. Grant notification permission (when prompted)

# 4. Send test notification
./scripts/test-simulator-push.sh "Test" "Hello from simulator"

# 5. Check if notification appears
```

## 📝 Next Steps After Fix

Once notifications work:

1. ✅ Test foreground notifications
2. ✅ Test background notifications  
3. ✅ Test app launch from notification
4. ✅ Test notification tap handling
5. ✅ Test data payload parsing
6. ✅ Test navigation from notifications

## 🔗 Related Files

- `ios/AssetManagementApp/AppDelegate.swift` - Notification handling
- `ios/AssetManagementApp/Info.plist` - Background modes
- `services/FCMService.js` - FCM service setup
- `scripts/test-simulator-push.sh` - Test script

## 💡 Pro Tips

1. **Always rebuild** after changing native code (AppDelegate)
2. **Check console logs** for notification events
3. **Test on different iOS versions** if possible
4. **Use Xcode console** to see native logs
5. **Check Simulator → Device → Notification Settings** if needed

---

**Last Updated**: After AppDelegate notification handling fix

