# Network Connectivity Troubleshooting Guide

## Problem: "Network request failed" Error

If you're getting a "Network request failed" error when trying to login, follow these steps:

### 1. Check Your Backend Server

**Make sure your backend server is running:**
```bash
# Check if something is running on port 4000
lsof -i :4000

# Or try to connect to the server
curl http://192.168.29.188:4000/api/health
```

**If the server is not running, start it:**
```bash
# Navigate to your backend project directory
cd /path/to/your/backend

# Start the server (adjust based on your backend framework)
npm start
# or
node server.js
# or
python app.py
```

### 2. Verify IP Address

**Get your current IP address:**
```bash
# Run the provided script
node scripts/get-ip.js

# Or manually check
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Update the API configuration if needed:**
- Open `config/api.js`
- Update `BASE_URL` with your current IP address
- The format should be: `http://YOUR_IP:4000`

### 3. Network Configuration

**For Physical Devices:**
- Ensure your phone and computer are on the same WiFi network
- Check if your firewall is blocking port 4000
- Try disabling firewall temporarily for testing

**For Emulators:**
- **Android Emulator**: Use `http://10.0.2.2:4000`
- **iOS Simulator**: Use `http://localhost:4000`

### 4. Test Server Connectivity

**Use the Server Status Checker:**
1. Navigate to the Server Status screen in your app
2. Tap "Refresh Server Status" to check all servers
3. Tap "Find Working Server" to automatically detect a working server

**Manual Testing:**
```bash
# Test from your computer
curl http://192.168.29.188:4000/api/health

# Test from your phone (if you have terminal access)
curl http://192.168.29.188:4000/api/health
```

### 5. Common Solutions

**Solution 1: Update IP Address**
```javascript
// In config/api.js
BASE_URL: 'http://192.168.29.188:4000', // Use your actual IP
```

**Solution 2: Use Localhost for Simulator**
```javascript
// In config/api.js
BASE_URL: 'http://localhost:4000', // For iOS simulator
// or
BASE_URL: 'http://10.0.2.2:4000', // For Android emulator
```

**Solution 3: Enable CORS on Backend**
Make sure your backend server allows requests from your app's origin.

**Solution 4: Check Network Permissions**
Ensure your React Native app has network permissions in the manifest files.

### 6. Debugging Tools

**Server Status Checker Component:**
- Navigate to `ServerStatus` screen in your app
- Shows real-time status of all configured servers
- Automatically finds working servers

**Console Logs:**
- Check the React Native debugger console
- Look for network request logs
- Verify the exact error messages

**Network Tab:**
- Use browser developer tools if testing on web
- Check if requests are being sent
- Verify response status codes

### 7. Environment-Specific Issues

**Development Environment:**
- Use your computer's IP address
- Ensure backend is running on port 4000
- Check firewall settings

**Production Environment:**
- Use your production server URL
- Ensure SSL certificates are valid
- Check server availability

### 8. Quick Fix Checklist

- [ ] Backend server is running on port 4000
- [ ] IP address in config is correct
- [ ] Device and computer are on same network
- [ ] Firewall allows connections on port 4000
- [ ] Backend has proper CORS configuration
- [ ] Network permissions are enabled in app

### 9. Emergency Fallback

If nothing works, you can temporarily use a mock server or local storage for development:

```javascript
// In config/api.js - Emergency fallback
BASE_URL: 'http://localhost:4000', // Try localhost
// or
BASE_URL: 'http://10.0.2.2:4000', // Try Android emulator IP
```

### 10. Getting Help

If you're still having issues:
1. Check the console logs for specific error messages
2. Use the Server Status Checker to identify the problem
3. Verify your backend server logs
4. Test with a simple curl command first
5. Ensure your network configuration is correct

---

**Remember:** The most common cause is that the backend server is not running or the IP address has changed. Always start by checking if your server is running and verifying the IP address.
