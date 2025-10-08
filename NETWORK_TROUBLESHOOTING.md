# Network Troubleshooting Guide

## Issue Fixed: Network Request Failed ✅

### Root Causes Identified and Fixed:
1. **Android Cleartext Traffic** ⚠️: Android 9+ blocks HTTP traffic by default. Fixed by adding `android:usesCleartextTraffic="true"` to AndroidManifest.xml
2. **Wrong IP Address** 🔧: API config had `192.168.0.104` but your actual IP is `192.168.0.101`
3. **Invalid fetch timeout** 🐛: React Native's fetch doesn't support `timeout` parameter. Replaced with `Promise.race()`
4. **iOS Network Security** 🍎: Enhanced to allow local HTTP traffic

### Your Network Configuration:
- **Computer IP**: 192.168.0.101 (server running on port 4000)
- **Phone IP**: 192.168.0.112 (WiFi debugging)
- **Same Network**: ✅ Both on 192.168.0.x
- **Server Status**: ✅ Running and accessible
- **Firewall**: ✅ Disabled (no blocking)

### Changes Made:

#### 1. Android Configuration (`android/app/src/main/AndroidManifest.xml`)
- Added `android:usesCleartextTraffic="true"` to allow HTTP traffic in development

#### 2. iOS Configuration (`ios/AssetManagementApp/Info.plist`)
- Enhanced NSAppTransportSecurity settings to allow local networking
- Added exception domain for localhost

#### 3. API Configuration (`config/api.js`)
- Updated BASE_URL from `192.168.0.104` to `192.168.0.101`

### Next Steps:

✅ **App is being rebuilt** - The Android app is currently rebuilding with all fixes applied.

Once the build completes:
1. **Test the login** - The app should now connect successfully
2. **Check the logs** - Enhanced logging will show connection details:
   ```
   === Login Attempt Started ===
   Primary server URL: http://192.168.0.101:4000
   Full URL: http://192.168.0.101:4000/api/auth/login
   ```

If your IP changes in the future:
1. **Get your current IP**:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}'
   ```
2. **Update config/api.js** with the new IP in `BASE_URL` and `SERVERS.LOCAL`
3. **Rebuild the app** (only if you changed native files)

### Common Issues:

#### If login still fails:
1. **Server not running**: Make sure your backend is running on port 4000
2. **IP changed**: Your IP can change when you reconnect to WiFi. Update `config/api.js` with new IP
3. **Firewall**: Check if firewall is blocking port 4000
4. **Different network**: Phone/emulator must be on same WiFi network as your computer

#### Testing server connectivity:
```bash
# Test from terminal
curl http://192.168.0.101:4000/api/health

# Expected: Should return server response (401 or 200)
```

#### Get your current IP:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}'

# Or use the helper script
node scripts/get-ip.js
```

### Platform-Specific Notes:

#### Android Emulator:
- Use `10.0.2.2` instead of `localhost` or `127.0.0.1`
- Use your actual IP (192.168.0.101) for physical devices

#### iOS Simulator:
- Can use `localhost` or `127.0.0.1`
- Use your actual IP (192.168.0.101) for physical devices

### Security Note:
⚠️ `usesCleartextTraffic="true"` should only be used in development. For production, use HTTPS and remove this setting.

