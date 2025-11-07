# Step-by-Step Guide: Testing FCM Push Notifications on iOS Simulator

## Prerequisites Check

Before starting, verify you have:
- ✅ macOS 13 or later
- ✅ Xcode 14 or later
- ✅ Mac with Apple Silicon (M1/M2/M3) or T2 Security Chip
- ✅ iOS 16+ Simulator
- ✅ Your React Native app with FCM already integrated

## Step 1: Verify iOS Simulator is Running

1. Open Xcode
2. Go to **Window** → **Devices and Simulators** (or press `Cmd + Shift + 2`)
3. Start an iOS Simulator (iOS 16 or later)
   - If no simulator is running, click **+** to add one
   - Select an iPhone model with iOS 16+ (e.g., iPhone 14, iPhone 15)

## Step 2: Build and Run Your App on Simulator

```bash
# Navigate to your project directory
cd /Users/riobizsols/Desktop/NewProject

# Run the app on iOS simulator
npx react-native run-ios
```

Or use Xcode:
1. Open `ios/AssetManagementApp.xcworkspace` in Xcode
2. Select a simulator from the device dropdown
3. Press `Cmd + R` to build and run

## Step 3: Verify Your Bundle ID

Your bundle ID should be: `org.reactjs.native.example.AssetManagementApp`

To verify:
1. Open Xcode
2. Select your project in the navigator
3. Select the **AssetManagementApp** target
4. Go to **General** tab
5. Check **Bundle Identifier**

## Step 4: Test Push Notification Using Simulator Command

### Option A: Use the Provided Script (Easiest)

```bash
# Make sure the script is executable
chmod +x scripts/test-simulator-push.sh

# Run with default message
./scripts/test-simulator-push.sh

# Or with custom title and body
./scripts/test-simulator-push.sh "Custom Title" "Custom message body"
```

### Option B: Manual Command

```bash
# Create a test payload file
cat > /tmp/push_payload.json << 'EOF'
{
  "aps": {
    "alert": {
      "title": "Test Notification",
      "body": "This is a test push notification"
    },
    "sound": "default",
    "badge": 1
  },
  "data": {
    "type": "test",
    "message": "Test data payload"
  }
}
EOF

# Send to simulator
xcrun simctl push booted org.reactjs.native.example.AssetManagementApp /tmp/push_payload.json
```

## Step 5: Test Different Notification Scenarios

### Test 1: Foreground Notification (App is Open)

1. Keep your app open and in the foreground
2. Run the test script:
   ```bash
   ./scripts/test-simulator-push.sh "Foreground Test" "App is open"
   ```
3. Check your app's console logs - you should see:
   ```
   📨 Foreground message received: {...}
   ```
4. Your app's `onMessage()` handler should be triggered

### Test 2: Background Notification (App in Background)

1. Press `Cmd + Shift + H` to go to home screen (or swipe up)
2. Run the test script:
   ```bash
   ./scripts/test-simulator-push.sh "Background Test" "App is in background"
   ```
3. You should see the notification banner appear
4. Tap the notification
5. Your app should open and `onNotificationOpenedApp()` should be triggered

### Test 3: App Closed (Terminated)

1. Swipe up from the bottom to open app switcher
2. Swipe up on your app to close it completely
3. Run the test script:
   ```bash
   ./scripts/test-simulator-push.sh "App Closed Test" "App was terminated"
   ```
4. Tap the notification
5. Your app should launch and `getInitialNotification()` should be triggered

## Step 6: Test with FCM Data Payload

Create a more realistic FCM payload:

```bash
cat > /tmp/fcm_payload.json << 'EOF'
{
  "aps": {
    "alert": {
      "title": "Work Order Approval",
      "body": "New work order requires your approval"
    },
    "sound": "default",
    "badge": 1
  },
  "data": {
    "notification_type": "workflow_approval",
    "work_order_id": "12345",
    "screen": "MaintenanceApproval",
    "params": "{\"workOrderId\":\"12345\"}"
  }
}
EOF

xcrun simctl push booted org.reactjs.native.example.AssetManagementApp /tmp/fcm_payload.json
```

## Step 7: Verify Notification Handling in Your App

Check your app's console output for:

1. **Foreground messages**: Should log `📨 Foreground message received`
2. **Notification taps**: Should log `👆 Notification tapped` or `👆 App opened from notification`
3. **Navigation**: Your app should navigate based on `data.notification_type`

## Step 8: Test Multiple Notifications

Send multiple notifications to test badge counts:

```bash
# Send 3 notifications
for i in {1..3}; do
  ./scripts/test-simulator-push.sh "Notification $i" "This is notification number $i"
  sleep 2
done
```

## Troubleshooting

### Issue: "No such file or directory" when running script

**Solution**: Make sure you're in the project root directory:
```bash
cd /Users/riobizsols/Desktop/NewProject
./scripts/test-simulator-push.sh
```

### Issue: "No booted simulator found"

**Solution**: 
1. Open Xcode
2. Start a simulator: **Window** → **Devices and Simulators**
3. Or run: `xcrun simctl boot "iPhone 15"` (replace with your simulator name)

### Issue: "Bundle ID mismatch"

**Solution**: 
1. Check your actual bundle ID in Xcode
2. Update the script with the correct bundle ID:
   ```bash
   # Find your bundle ID
   grep -r "PRODUCT_BUNDLE_IDENTIFIER" ios/AssetManagementApp.xcodeproj/project.pbxproj
   ```

### Issue: Notification not appearing

**Solutions**:
1. Make sure your app is installed and has been opened at least once
2. Check that notification permission was granted (should see permission dialog on first launch)
3. Verify `UIBackgroundModes` includes `remote-notification` in `Info.plist` ✅ (Already configured)
4. Make sure the simulator is running iOS 16+

### Issue: Notification appears but handlers don't fire

**Solutions**:
1. Check that FCMService is initialized in your app
2. Verify message handlers are set up in `FCMService.js`
3. Check console logs for any errors
4. Make sure your app is listening for notifications (not just displaying them)

## Advanced Testing

### Test with Custom Sound

```bash
cat > /tmp/custom_sound.json << 'EOF'
{
  "aps": {
    "alert": {
      "title": "Custom Sound Test",
      "body": "This notification has a custom sound"
    },
    "sound": "default",
    "badge": 1
  }
}
EOF

xcrun simctl push booted org.reactjs.native.example.AssetManagementApp /tmp/custom_sound.json
```

### Test Silent Notification (Data Only)

```bash
cat > /tmp/silent_notification.json << 'EOF'
{
  "aps": {
    "content-available": 1
  },
  "data": {
    "type": "silent_update",
    "message": "This is a silent data notification"
  }
}
EOF

xcrun simctl push booted org.reactjs.native.example.AssetManagementApp /tmp/silent_notification.json
```

## Quick Reference Commands

```bash
# List all simulators
xcrun simctl list devices

# Boot a specific simulator
xcrun simctl boot "iPhone 15"

# Get booted simulator UDID
xcrun simctl list devices | grep Booted

# Send notification (replace BUNDLE_ID with your actual bundle ID)
xcrun simctl push booted BUNDLE_ID /path/to/payload.json

# Check if app is installed
xcrun simctl listapps booted | grep -i asset
```

## Limitations to Remember

⚠️ **Important Notes**:

1. **FCM Token Generation**: May not work on simulator with free Apple Developer account
   - The simulator push command bypasses FCM/APNs
   - It directly sends notifications to the simulator
   - This is perfect for testing notification handling logic

2. **Real FCM Integration**: Requires:
   - Paid Apple Developer Program ($99/year) for real devices
   - APNs certificate/key configured in Firebase Console
   - Push Notifications capability enabled in Xcode

3. **What Works on Simulator**:
   - ✅ Notification display (iOS 16+)
   - ✅ Foreground message handling
   - ✅ Background notification handling
   - ✅ Notification tap handling
   - ✅ App launch from notification

4. **What Doesn't Work on Simulator (Free Account)**:
   - ❌ Real FCM token generation
   - ❌ Real APNs connection
   - ❌ Production push notifications

## Next Steps

After testing on simulator:

1. **For Production**: Enroll in Apple Developer Program
2. **For Real Device Testing**: Configure APNs in Firebase Console
3. **For Android Testing**: Test full FCM features on Android (completely free)

## Summary

✅ **You can test**:
- Notification display and appearance
- Foreground notification handling
- Background notification handling  
- Notification tap navigation
- App launch from notification
- Data payload parsing

❌ **You cannot test** (without paid account):
- Real FCM token generation
- Real APNs delivery
- Production push notification flow

The simulator testing is perfect for developing and testing your notification handling logic before deploying to real devices!

