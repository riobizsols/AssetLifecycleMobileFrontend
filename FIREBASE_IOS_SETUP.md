# Firebase iOS Setup Guide

This guide will help you complete the Firebase setup for your iOS app.

## Prerequisites

✅ Firebase pods are already installed via `@react-native-firebase/app` and `@react-native-firebase/messaging`
✅ Firebase initialization has been added to `AppDelegate.swift`
✅ Info.plist has been updated with background modes for push notifications

## Step 1: Add iOS App to Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **assetlifecyclemanagement**
3. Click on the iOS icon (or "Add app" if you don't see it)
4. Enter your iOS bundle ID (check in Xcode: `AssetManagementApp.xcodeproj` → Target → General → Bundle Identifier)
   - Typically it's something like: `com.yourcompany.AssetManagementApp`
   - **IMPORTANT**: Make sure this matches exactly with your Xcode project bundle ID
5. Enter an App nickname (optional): "Asset Management iOS"
6. Enter App Store ID (optional, leave blank if not published)
7. Click **"Register app"**

## Step 2: Download GoogleService-Info.plist

1. After registering, Firebase will provide a download button for `GoogleService-Info.plist`
2. **Download** the file
3. **IMPORTANT**: Place the file in the following location:
   ```
   ios/AssetManagementApp/GoogleService-Info.plist
   ```
4. In Xcode:
   - Open `AssetManagementApp.xcworkspace` (NOT the .xcodeproj file)
   - Right-click on the `AssetManagementApp` folder in the Project Navigator
   - Select "Add Files to AssetManagementApp..."
   - Select the `GoogleService-Info.plist` file
   - **IMPORTANT**: Check "Copy items if needed" and ensure "AssetManagementApp" target is selected
   - Click "Add"

## Step 3: Verify Bundle ID Match

Make sure the bundle ID in `GoogleService-Info.plist` matches your Xcode project:
- In Xcode: Target → General → Bundle Identifier
- In `GoogleService-Info.plist`: Check the `BUNDLE_ID` value

## Step 4: Configure Push Notifications (APNs)

For Firebase Cloud Messaging to work on iOS, you need to configure Apple Push Notification service (APNs):

### Option A: Automatic (Recommended - Uses APNs Authentication Key)

1. In Firebase Console → Project Settings → Cloud Messaging → iOS app configuration
2. Upload your APNs Authentication Key (.p8 file) OR
3. Upload your APNs Certificates (.p12 files)

### Option B: Manual (Using Xcode)

1. In Xcode, go to your Target → Signing & Capabilities
2. Add "Push Notifications" capability
3. Add "Background Modes" capability and check "Remote notifications"

### Getting APNs Key/Certificate:

1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/authkeys/list)
2. Create a new Key with "Apple Push Notifications service (APNs)" enabled
3. Download the .p8 key file (you can only download it once!)
4. Note the Key ID
5. Upload to Firebase Console → Project Settings → Cloud Messaging

## Step 5: Install Pods

After adding `GoogleService-Info.plist`, run:

```bash
cd ios
pod install
```

## Step 6: Build and Test

1. Clean your build folder in Xcode: Product → Clean Build Folder (Shift+Cmd+K)
2. Build and run your app
3. Test Firebase functionality

## Verification

To verify Firebase is working:

1. Check that `FirebaseApp.configure()` is called in `AppDelegate.swift` ✅ (Already done)
2. Verify `GoogleService-Info.plist` is included in your Xcode project ✅ (You need to add this)
3. Check that the file is added to the correct target in Xcode
4. Test push notifications from Firebase Console

## Troubleshooting

### Error: "GoogleService-Info.plist not found"
- Make sure the file is in `ios/AssetManagementApp/GoogleService-Info.plist`
- Verify it's added to the Xcode project and target
- Check the file is included in "Copy Bundle Resources" build phase

### Error: "Bundle ID mismatch"
- Verify the bundle ID in Xcode matches the one in `GoogleService-Info.plist`
- Re-download `GoogleService-Info.plist` if bundle ID changed

### Push Notifications Not Working
- Verify APNs configuration in Firebase Console
- Check that "Push Notifications" capability is enabled in Xcode
- Verify `UIBackgroundModes` includes `remote-notification` in Info.plist ✅ (Already done)

## Next Steps

After completing this setup:
1. Test Firebase Cloud Messaging
2. Test other Firebase features you're using
3. Deploy to TestFlight or App Store when ready

