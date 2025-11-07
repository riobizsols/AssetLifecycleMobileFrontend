# iOS Simulator FCM Testing - Quick Start

## 🚀 Quick Test (3 Steps)

### 1. Start iOS Simulator
```bash
# Open Xcode → Window → Devices and Simulators
# Or run:
open -a Simulator
```

### 2. Run Your App
```bash
npx react-native run-ios
```

### 3. Send Test Notification
```bash
./scripts/test-simulator-push.sh "Test Title" "Test message"
```

That's it! The notification should appear in your simulator.

---

## 📋 Common Commands

```bash
# Send default test notification
./scripts/test-simulator-push.sh

# Send custom notification
./scripts/test-simulator-push.sh "Custom Title" "Custom body"

# List running simulators
xcrun simctl list devices | grep Booted

# Send notification manually (if script doesn't work)
xcrun simctl push booted org.reactjs.native.example.AssetManagementApp /tmp/push.json
```

---

## 🎯 Test Scenarios

### Test Foreground (App Open)
1. Keep app open
2. Run: `./scripts/test-simulator-push.sh "Foreground" "App is open"`
3. Check console logs

### Test Background (App Minimized)
1. Press `Cmd + Shift + H` (go to home)
2. Run: `./scripts/test-simulator-push.sh "Background" "App minimized"`
3. Tap notification when it appears

### Test App Closed
1. Swipe up to close app completely
2. Run: `./scripts/test-simulator-push.sh "Closed" "App was closed"`
3. Tap notification to launch app

---

## ⚠️ Important Notes

- ✅ Works on iOS 16+ Simulator
- ✅ Tests notification handling logic
- ❌ Does NOT test real FCM token generation
- ❌ Requires paid Apple Developer account for real devices

---

## 🔧 Troubleshooting

**Script not found?**
```bash
cd /Users/riobizsols/Desktop/NewProject
./scripts/test-simulator-push.sh
```

**No simulator running?**
```bash
open -a Simulator
```

**Wrong bundle ID?**
Check in Xcode: Target → General → Bundle Identifier

---

## 📖 Full Guide

See `IOS_SIMULATOR_FCM_TESTING_STEPS.md` for detailed instructions.

