# 🔧 Network Request Failed - Troubleshooting Guide

## 🚨 Issue: `[TypeError: Network request failed]`

This error occurs when the app cannot connect to the backend server. Here's how to fix it:

## ✅ **What I Fixed:**

### 1. **Updated IP Address**
- **Old IP**: `192.168.0.110:4000` (incorrect)
- **New IP**: `192.168.29.150:4000` (current)
- Updated both `BASE_URL` and `FALLBACK_URLS` in `config/api.js`

### 2. **Network Configuration**
- Primary server: `http://192.168.29.150:4000`
- Fallback servers: Multiple options for different scenarios
- Android emulator support: `http://10.0.2.2:4000`

## 🔍 **Root Causes of Network Request Failed:**

### 1. **Wrong IP Address**
- App trying to connect to wrong IP
- Network interface changed
- WiFi network switched

### 2. **Backend Server Not Running**
- Server not started
- Server crashed
- Port blocked by firewall

### 3. **Network Issues**
- Device and computer on different networks
- Firewall blocking connections
- Router blocking local connections

## 🧪 **How to Test the Fix:**

### 1. **Check Your Backend Server**
Make sure your backend server is running on port 4000:

```bash
# Check if something is running on port 4000
lsof -i :4000

# Or check with netstat
netstat -an | grep 4000
```

### 2. **Test Server Connection**
```bash
# Test from your computer
curl http://192.168.29.150:4000/api/health

# Or test with a simple request
curl http://192.168.29.150:4000/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

### 3. **Test from Your Device**
Make sure your Android device can reach your computer:
- Both devices on same WiFi network
- No firewall blocking port 4000
- Router allows local connections

## 🔧 **Common Solutions:**

### Solution 1: Start Your Backend Server
```bash
# Navigate to your backend project
cd /path/to/your/backend

# Start the server
npm start
# or
node server.js
# or
python app.py
```

### Solution 2: Check Firewall Settings
```bash
# On macOS, check if firewall is blocking
sudo pfctl -sr | grep 4000

# Temporarily disable firewall for testing
sudo pfctl -d
```

### Solution 3: Use FCM Debug Component
1. Navigate to `FCMDebug` screen in your app
2. Tap "Test API Connection"
3. Check if server is reachable

### Solution 4: Test Different URLs
If the main URL doesn't work, try these fallback URLs:
- `http://192.168.29.150:4000` (your current IP)
- `http://10.0.2.2:4000` (Android emulator)
- `http://localhost:4000` (localhost)
- `http://103.27.234.248:5000` (production)

## 📱 **Testing Steps:**

### 1. **Test Login**
- Try logging in with valid credentials
- Check console for network logs
- Should connect to `http://192.168.29.150:4000`

### 2. **Test API Endpoints**
- Use the FCM Debug component
- Test different server URLs
- Check response times and errors

### 3. **Test Network Connectivity**
```bash
# From your computer, test if server is accessible
ping 192.168.29.150
telnet 192.168.29.150 4000
```

## 🚨 **Emergency Debugging:**

### 1. **Check Console Logs**
Look for these log messages:
```
Primary server URL: http://192.168.29.150:4000
Login endpoint: /api/auth/login
Full URL: http://192.168.29.150:4000/api/auth/login
```

### 2. **Test Server Manually**
```bash
# Test your login endpoint directly
curl -v -X POST http://192.168.29.150:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

### 3. **Check Network Configuration**
```bash
# Get your current IP
node scripts/get-ip.js

# Check if port 4000 is open
lsof -i :4000
```

## 📊 **Expected Behavior After Fix:**

### ✅ **Success Case:**
```
Primary server URL: http://192.168.29.150:4000
Login endpoint: /api/auth/login
Response received: { status: 200, statusText: 'OK', contentType: 'application/json' }
Login successful, token stored
```

### ❌ **Error Cases:**
```
// Server not running
Network connection failed. Please check your internet connection.

// Wrong IP address
Network request failed

// Firewall blocking
Connection refused
```

## 🔧 **Additional Improvements:**

### 1. **Enhanced Error Handling**
- Better network error messages
- Automatic fallback server detection
- Connection timeout handling

### 2. **Network Diagnostics**
- IP address detection
- Server connectivity testing
- Multiple fallback URLs

### 3. **Debug Tools**
- FCM Debug component for testing
- Server status checker
- Network configuration validation

## 🎯 **Success Criteria:**

Your network is working correctly when:

- ✅ No "Network request failed" errors
- ✅ Successful login with valid credentials
- ✅ API calls complete successfully
- ✅ Server responds on `http://192.168.29.150:4000`
- ✅ Fallback servers work if needed

## 📞 **If Issues Persist:**

1. **Check your backend server** - Make sure it's running on port 4000
2. **Verify IP address** - Run `node scripts/get-ip.js` to get current IP
3. **Test server manually** - Use curl to test the server directly
4. **Check firewall** - Make sure port 4000 is not blocked
5. **Use FCM Debug component** - Test API connectivity from the app

## 🔄 **Quick Fix Commands:**

```bash
# Get current IP address
node scripts/get-ip.js

# Test server connection
curl http://192.168.29.150:4000/api/health

# Check if port is open
lsof -i :4000

# Restart React Native app
npx react-native run-android
```

---

**Note**: The network request failed error should now be resolved with the correct IP address configuration. Make sure your backend server is running on port 4000!
