# Fix: Push Notifications Capability Error

## Problem

You're getting this error:
```
Cannot create a iOS App Development provisioning profile for "org.reactjs.native.example.AssetManagementApp". 
Personal development teams, including "Rio Mac", do not support the Push Notifications capability.
```

## Solution

**Good News**: For iOS Simulator testing, you don't need the Push Notifications capability! The simulator push notifications work without it.

## Steps to Fix

### Step 1: Remove Push Notifications Capability in Xcode

1. **Open Xcode**
2. **Open your workspace**: `ios/AssetManagementApp.xcworkspace`
3. **Select your project** in the Project Navigator (left sidebar)
4. **Select the "AssetManagementApp" target**
5. **Go to "Signing & Capabilities" tab**
6. **Find "Push Notifications" capability** in the list
7. **Click the "-" (minus) button** to remove it

### Step 2: Verify Entitlements File

✅ **Already Fixed**: The `aps-environment` entitlement has been removed from `AssetManagementApp.entitlements`

### Step 3: Clean and Rebuild

```bash
# Clean build folder
cd ios
rm -rf build
cd ..

# Rebuild
npx react-native run-ios
```

Or in Xcode:
- **Product** → **Clean Build Folder** (Shift+Cmd+K)
- **Product** → **Run** (Cmd+R)

## Why This Works

- ✅ **Simulator push notifications** use `xcrun simctl push` which bypasses APNs
- ✅ **No capability needed** for simulator testing
- ✅ **Your notification handling code** still works perfectly
- ✅ **AppDelegate notification methods** still function

## What You Can Still Test

Even without the Push Notifications capability, you can test:

1. ✅ **Notification display** on simulator
2. ✅ **Foreground notifications** (`onMessage()`)
3. ✅ **Background notifications** (`onNotificationOpenedApp()`)
4. ✅ **App launch from notification** (`getInitialNotification()`)
5. ✅ **Notification tap handling**
6. ✅ **Data payload parsing**

## Limitations

- ❌ **Real FCM token generation** won't work (requires paid account)
- ❌ **Real APNs connection** won't work (requires paid account)
- ❌ **Physical device testing** with real push notifications (requires paid account)

But for **simulator testing**, everything works perfectly!

## For Production (Future)

When you're ready to test on real devices or deploy to production:

1. **Enroll in Apple Developer Program** ($99/year)
2. **Re-add Push Notifications capability** in Xcode
3. **Configure APNs** in Firebase Console
4. **Update entitlements** to include `aps-environment`

## Test After Fix

After removing the capability and rebuilding:

```bash
# Test notification
./scripts/test-simulator-push.sh "Test" "Hello from simulator"
```

The notification should appear without any provisioning errors!

---

**Status**: ✅ Entitlements file fixed
**Action Required**: Remove Push Notifications capability in Xcode Signing & Capabilities tab

