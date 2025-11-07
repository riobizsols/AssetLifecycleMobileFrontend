# Testing FCM Push Notifications on iOS Simulator (Free)

## ✅ What Works on Simulator (Free)

**iOS Simulator supports push notifications starting with iOS 16** (macOS 13+, Apple Silicon or T2 Mac).

### Prerequisites:
- ✅ macOS 13 or later
- ✅ Xcode 14 or later  
- ✅ Mac with Apple Silicon (M1/M2) or T2 Security Chip
- ✅ iOS 16+ Simulator

## ⚠️ Limitations with Free Developer Account

1. **FCM Token Generation**: May fail because it requires `aps-environment` entitlement
2. **Real APNs**: Cannot use real Apple Push Notification service
3. **Full FCM Integration**: Requires paid developer account for production

## 🧪 Testing Options

### Option 1: Test Notification Handling Logic (Recommended for Free Testing)

You can test how your app handles notifications without full FCM integration:

#### Step 1: Remove Push Notifications Capability (Temporarily)
1. In Xcode → Signing & Capabilities
2. Remove "Push Notifications" capability (click "-")
3. This avoids the Xcode error about Personal Teams

#### Step 2: Test with Simulator Push Command

```bash
# Create a test notification payload
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

# Send to simulator (replace with your bundle ID)
xcrun simctl push booted org.reactjs.native.example.AssetManagementApp /tmp/push_payload.json
```

#### Step 3: Test Your App's Notification Handlers

Your app's notification handling code will still work:
- `onMessage()` - Foreground notifications
- `onNotificationOpenedApp()` - Background notifications
- `getInitialNotification()` - App opened from notification

### Option 2: Mock FCM Service for Testing

Create a mock version that simulates FCM behavior:

```javascript
// For simulator testing only
if (__DEV__ && Platform.OS === 'ios') {
  // Mock FCM token for simulator
  const mockToken = 'simulator-mock-token-' + Date.now();
  // Use mock token for testing
}
```

### Option 3: Test on Android (Free)

Android doesn't require a paid developer account:
- FCM works fully on Android with free Google account
- Test all FCM features on Android devices/emulators
- Use Android testing to verify your backend integration

## 📱 Full FCM Testing (Requires Paid Account)

For complete FCM testing including:
- Real FCM token generation
- APNs integration
- Production-ready push notifications
- Testing on physical iOS devices

You need:
- ✅ Apple Developer Program membership ($99/year)
- ✅ Push Notifications capability enabled
- ✅ Valid provisioning profile with push entitlements

## 🔧 Quick Test Script

Create a script to test simulator notifications:

```bash
#!/bin/bash
# test-simulator-push.sh

BUNDLE_ID="org.reactjs.native.example.AssetManagementApp"
PAYLOAD='{"aps":{"alert":{"title":"Test","body":"Hello from simulator"},"sound":"default","badge":1},"data":{"type":"test"}}'

echo "$PAYLOAD" > /tmp/sim_push.json
xcrun simctl push booted "$BUNDLE_ID" /tmp/sim_push.json
echo "✅ Push notification sent to simulator"
```

Make it executable:
```bash
chmod +x test-simulator-push.sh
./test-simulator-push.sh
```

## 📝 Summary

| Feature | Free Account | Paid Account |
|---------|-------------|--------------|
| Simulator push notifications | ✅ Yes (iOS 16+) | ✅ Yes |
| FCM token generation | ⚠️ Limited | ✅ Full |
| Real APNs | ❌ No | ✅ Yes |
| Physical device testing | ❌ No | ✅ Yes |
| Production deployment | ❌ No | ✅ Yes |

## 🎯 Recommendation

1. **For Development**: Test notification handling logic on simulator (free)
2. **For Production**: Enroll in Apple Developer Program ($99/year)
3. **For Quick Testing**: Use Android devices (completely free)

## 🔗 Resources

- [Apple: Testing Push Notifications in Simulator](https://developer.apple.com/documentation/usernotifications/testing-push-notifications-with-the-simulator)
- [Firebase: iOS Setup Guide](https://firebase.google.com/docs/cloud-messaging/ios/client)

