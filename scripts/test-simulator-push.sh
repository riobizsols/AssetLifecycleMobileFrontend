#!/bin/bash

# Test Push Notification on iOS Simulator
# Usage: ./scripts/test-simulator-push.sh [title] [body]

BUNDLE_ID="org.reactjs.native.example.AssetManagementApp"
TITLE="${1:-Test Notification}"
BODY="${2:-This is a test push notification from simulator}"

# Create payload
PAYLOAD=$(cat <<EOF
{
  "aps": {
    "alert": {
      "title": "$TITLE",
      "body": "$BODY"
    },
    "sound": "default",
    "badge": 1
  },
  "data": {
    "type": "test",
    "message": "Test data payload",
    "timestamp": "$(date +%s)"
  }
}
EOF
)

# Save to temp file
TEMP_FILE=$(mktemp)
echo "$PAYLOAD" > "$TEMP_FILE"

echo "📱 Sending push notification to iOS Simulator..."
echo "   Bundle ID: $BUNDLE_ID"
echo "   Title: $TITLE"
echo "   Body: $BODY"
echo ""

# Send to simulator
xcrun simctl push booted "$BUNDLE_ID" "$TEMP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Push notification sent successfully!"
    echo "   Check your app in the simulator to see the notification"
else
    echo "❌ Failed to send push notification"
    echo "   Make sure:"
    echo "   1. iOS Simulator is running"
    echo "   2. Your app is installed and running in the simulator"
    echo "   3. Bundle ID matches: $BUNDLE_ID"
fi

# Clean up
rm "$TEMP_FILE"

