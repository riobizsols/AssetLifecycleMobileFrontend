# iOS Push Notifications Setup Guide

## ✅ What's Been Done

1. **Entitlements File Created**: `AssetManagementApp.entitlements` with `aps-environment` entitlement
2. **Project Configuration Updated**: Entitlements file added to Xcode project
3. **Build Settings Updated**: `CODE_SIGN_ENTITLEMENTS` configured for Debug and Release

## ⚠️ CRITICAL: Apple Developer Program Required

**Push Notifications require a paid Apple Developer Program membership ($99/year).**

Free "Personal Team" accounts **cannot** use Push Notifications. If you see this error in Xcode:
> "Personal development teams do not support the Push Notifications capability"

You must enroll in the [Apple Developer Program](https://developer.apple.com/programs/) to use push notifications on real devices.

### ✅ FREE Testing Option: iOS Simulator

**Good news!** You can test push notifications on **iOS Simulator for FREE** (iOS 16+, macOS 13+, Apple Silicon/T2 Mac):

1. Remove Push Notifications capability in Xcode (to avoid errors)
2. Test notification handling using simulator push commands
3. See `IOS_SIMULATOR_FCM_TESTING.md` for detailed instructions

**Note:** Full FCM token generation still requires a paid account, but you can test your app's notification handling logic.

### Enroll in Apple Developer Program (for real devices):
1. Go to https://developer.apple.com/programs/
2. Click "Enroll" and complete the enrollment process
3. After enrollment, your team will be upgraded and you can enable Push Notifications

---

## ⚠️ Important: Additional Steps Required in Xcode

**Note:** These steps only work if you have a paid Apple Developer Program membership.

The entitlements file has been created and added to the project, but you **MUST** complete these steps in Xcode:

### Step 1: Enable Push Notifications Capability

1. Open `ios/AssetManagementApp.xcworkspace` in Xcode (NOT the .xcodeproj file)
2. Select the **AssetManagementApp** project in the Project Navigator
3. Select the **AssetManagementApp** target
4. Go to the **Signing & Capabilities** tab
5. Click the **+ Capability** button
6. Add **Push Notifications** capability
   - This will automatically configure the entitlements properly

### Step 2: Verify Entitlements File

1. In Xcode, check that `AssetManagementApp.entitlements` appears in the Project Navigator
2. Open the file and verify it contains:
   ```xml
   <key>aps-environment</key>
   <string>development</string>
   ```
   - For **production builds**, change `development` to `production`

### Step 3: Configure Provisioning Profile

Your provisioning profile must support Push Notifications:

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Select your **App ID** (org.reactjs.native.example.AssetManagementApp)
4. Enable **Push Notifications** capability
5. Regenerate your provisioning profile if needed
6. Download and install the updated profile in Xcode

### Step 4: Clean and Rebuild

1. In Xcode: **Product → Clean Build Folder** (Shift+Cmd+K)
2. **Product → Build** (Cmd+B)
3. Run the app

## 📝 Notes

- **Development vs Production**: 
  - Use `development` for development/testing
  - Use `production` for App Store/TestFlight builds
  
- **Automatic Configuration**: When you add the Push Notifications capability in Xcode, it may automatically update the entitlements file. That's fine - the file we created will serve as a template.

- **Provisioning Profile**: Make sure your provisioning profile includes Push Notifications. If you're using automatic signing, Xcode will handle this, but you may need to enable it in the Apple Developer Portal first.

## 🔍 Troubleshooting

### Error: "no valid aps-environment entitlement"
- ✅ **Fixed**: Entitlements file created and configured
- Make sure you've added Push Notifications capability in Xcode
- Verify the entitlements file is in the project

### Error: "Provisioning profile doesn't support Push Notifications"
- Enable Push Notifications in Apple Developer Portal for your App ID
- Regenerate and download the provisioning profile
- In Xcode, go to Signing & Capabilities → Download Manual Profiles

### Error: "Invalid aps-environment value"
- Check that the entitlements file has either `development` or `production`
- Make sure the value matches your build configuration

## ✅ Verification

After completing the steps above, you should be able to:
1. Register device for remote messages without errors
2. Get FCM token successfully
3. Receive push notifications

The error `[messaging/unknown] no valid "aps-environment" entitlement string found` should be resolved!

