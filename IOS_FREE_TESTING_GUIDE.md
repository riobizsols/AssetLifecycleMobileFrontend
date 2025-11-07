# iOS Free Testing Guide

## Can You Test iOS Apps for Free?

**Yes!** You can test iOS apps for free using your personal Apple ID, but with some limitations compared to Android.

## Free Testing Limitations

✅ **What you CAN do:**
- Test on your own iPhone/iPad (up to 10 devices per year)
- Build and install apps directly
- Test all app features
- Use Xcode for free

❌ **Limitations:**
- Apps expire after **7 days** (need to reinstall weekly)
- Only **3 apps** can be installed at once
- Can only install on devices you physically have access to
- No TestFlight distribution
- No easy sharing with team members

## Setup Steps (Free Apple ID)

### 1. Open Xcode Project

```bash
cd ios
open AssetManagementApp.xcworkspace
```

**Important:** Open the `.xcworkspace` file, NOT the `.xcodeproj` file!

### 2. Configure Signing in Xcode

1. In Xcode, select the **AssetManagementApp** project in the left sidebar
2. Select the **AssetManagementApp** target
3. Go to **Signing & Capabilities** tab
4. Check **"Automatically manage signing"**
5. Select your **Team** (your Apple ID)
   - If you don't see your Apple ID, click "Add Account..." and sign in
6. Xcode will automatically create a provisioning profile

### 3. Update Bundle Identifier (Optional but Recommended)

The current bundle ID is: `org.reactjs.native.example.AssetManagementApp`

You should change it to something unique like:
- `com.yourname.assetmanagement`
- `com.yourcompany.assetmanagement`

**To change it:**
1. In Xcode, go to **Signing & Capabilities**
2. Change **Bundle Identifier** to your unique ID
3. Xcode will update automatically

### 4. Connect Your iPhone/iPad

1. Connect your device via USB
2. Unlock your device
3. Trust the computer if prompted
4. In Xcode, select your device from the device dropdown (top toolbar)

### 5. Build and Run

**Option A: Using Xcode**
1. Select your device from the device dropdown
2. Click the **Play** button (▶️) or press `Cmd + R`
3. First time: Go to **Settings > General > VPN & Device Management** on your iPhone
4. Trust your developer certificate

**Option B: Using Command Line**

```bash
# From project root
npm run ios -- --device

# Or specify device
npx react-native run-ios --device "Your iPhone Name"
```

### 6. Handle 7-Day Expiration

When the app expires after 7 days:
1. Reconnect your device
2. Rebuild and reinstall (same steps as above)
3. Or use Xcode: **Product > Clean Build Folder** then rebuild

## Troubleshooting

### "No devices found"
- Make sure device is unlocked
- Trust the computer on your device
- Check USB cable connection
- Restart Xcode

### "Signing for AssetManagementApp requires a development team"
- Make sure you're signed in to Xcode with your Apple ID
- Go to **Xcode > Settings > Accounts**
- Add your Apple ID if not present
- Select your team in Signing & Capabilities

### "App installation failed"
- Check device storage space
- Make sure device is not locked
- Try cleaning build: **Product > Clean Build Folder**

### "Untrusted Developer"
- On your iPhone: **Settings > General > VPN & Device Management**
- Find your Apple ID under "Developer App"
- Tap **Trust** and confirm

## Comparison: Free vs Paid

| Feature | Free (Apple ID) | Paid ($99/year) |
|---------|----------------|-----------------|
| Test on own device | ✅ | ✅ |
| App expiration | ❌ (7 days) | ✅ (No expiration) |
| TestFlight | ❌ | ✅ |
| Team distribution | ❌ | ✅ |
| Ad Hoc builds | ❌ | ✅ |
| App Store submission | ❌ | ✅ |
| Device limit | 10/year | Unlimited |

## For Team Testing (Free Option)

If you want to share with your team for free:
1. Each team member needs to build on their own device
2. Or physically connect each device to your Mac and install
3. Each person needs their own Apple ID

**Better option for teams:** Consider the $99/year Apple Developer account for TestFlight, which makes distribution much easier.

## Quick Start Commands

```bash
# Install dependencies
cd ios && pod install && cd ..

# Open in Xcode
cd ios && open AssetManagementApp.xcworkspace

# Build and run on connected device
npm run ios -- --device
```

## Next Steps

Once you're comfortable with free testing, you might want to:
1. Get Apple Developer account ($99/year) for TestFlight
2. Set up CI/CD for automated builds
3. Configure proper bundle identifier for production

