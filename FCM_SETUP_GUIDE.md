# Firebase FCM Integration Guide for Android

## Overview
This guide provides step-by-step instructions for integrating Firebase Cloud Messaging (FCM) into your React Native Android app.

## Prerequisites
- React Native project with Android support
- Firebase project created in Firebase Console
- Android Studio installed
- Node.js and npm/yarn installed

## Step 1: Firebase Console Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select existing project
3. Follow the setup wizard

### 1.2 Add Android App to Firebase Project
1. In Firebase Console, click "Add app" and select Android
2. Enter your package name: `com.assetmanagementapp`
3. Download the `google-services.json` file
4. Replace the template file in `android/app/google-services.json` with your actual file

### 1.3 Enable Cloud Messaging
1. In Firebase Console, go to "Cloud Messaging"
2. Enable the service if not already enabled

## Step 2: Project Configuration

### 2.1 Dependencies (Already Installed)
The following dependencies are already installed in your project:
- `@react-native-firebase/app`
- `@react-native-firebase/messaging`

### 2.2 Android Configuration
The following files have been configured:
- `android/build.gradle` - Added Google Services plugin
- `android/app/build.gradle` - Added Firebase dependencies and plugin
- `android/app/src/main/AndroidManifest.xml` - Added FCM service and permissions
- `android/app/src/main/java/com/assetmanagementapp/MyFirebaseMessagingService.java` - FCM service

## Step 3: Implementation Files

### 3.1 FCM Service (`services/FCMService.js`)
- Handles FCM token management
- Manages message handlers
- Provides topic subscription functionality
- Handles notification taps

### 3.2 Notification Handler (`components/NotificationHandler.js`)
- Wraps your app to handle notifications
- Manages foreground and background messages
- Handles notification taps

### 3.3 Test Component (`components/FCMTestComponent.js`)
- Provides UI to test FCM functionality
- Displays FCM token
- Allows topic subscription testing
- Provides debugging tools

## Step 4: Testing FCM Integration

### 4.1 Build and Run
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### 4.2 Test Token Generation
1. Run the app
2. Check console logs for FCM token
3. Use the FCMTestComponent to copy the token

### 4.3 Send Test Notification
1. Go to Firebase Console > Cloud Messaging
2. Click "Send your first message"
3. Enter notification title and text
4. Click "Send test message"
5. Enter the FCM token from your app
6. Send the message

## Step 5: Server Integration

### 5.1 Send Token to Server
Update the `sendTokenToServer` method in `FCMService.js`:

```javascript
async sendTokenToServer(token, userId) {
  try {
    const response = await fetch('YOUR_API_ENDPOINT/fcm-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_AUTH_TOKEN', // If needed
      },
      body: JSON.stringify({
        token,
        userId,
        platform: Platform.OS,
      }),
    });
    // Handle response
  } catch (error) {
    console.error('Error sending token to server:', error);
  }
}
```

### 5.2 Server-Side Implementation
Your server should:
1. Store FCM tokens associated with users
2. Send notifications using Firebase Admin SDK
3. Handle token refresh and cleanup

## Step 6: Advanced Features

### 6.1 Topic Subscriptions
```javascript
// Subscribe to topic
await FCMService.subscribeToTopic('maintenance-alerts');

// Unsubscribe from topic
await FCMService.unsubscribeFromTopic('maintenance-alerts');
```

### 6.2 Custom Notification Handling
Modify `MyFirebaseMessagingService.java` to handle custom notification actions:

```java
// Add custom actions to notification
NotificationCompat.Builder notificationBuilder =
    new NotificationCompat.Builder(this, CHANNEL_ID)
        .setSmallIcon(R.drawable.ic_launcher)
        .setContentTitle(title)
        .setContentText(messageBody)
        .setAutoCancel(true)
        .setSound(defaultSoundUri)
        .setContentIntent(pendingIntent)
        .addAction(R.drawable.ic_action, "View", pendingIntent)
        .addAction(R.drawable.ic_close, "Dismiss", dismissIntent);
```

### 6.3 Data Messages
Handle data-only messages in your React Native code:

```javascript
messaging().onMessage(async (remoteMessage) => {
  if (remoteMessage.data) {
    // Handle data message
    const { action, screen, params } = remoteMessage.data;
    // Navigate or perform action based on data
  }
});
```

## Step 7: Troubleshooting

### 7.1 Common Issues
1. **Token not generated**: Check Firebase configuration and permissions
2. **Notifications not received**: Verify FCM service is properly registered
3. **App crashes on notification**: Check Android manifest configuration

### 7.2 Debug Steps
1. Check console logs for FCM token
2. Verify `google-services.json` is in correct location
3. Ensure all dependencies are properly linked
4. Test with Firebase Console notifications first

### 7.3 Logs to Check
```bash
# Android logs
adb logcat | grep -i firebase
adb logcat | grep -i fcm
```

## Step 8: Production Considerations

### 8.1 Security
- Never expose FCM tokens in client-side code
- Implement proper authentication for token storage
- Use HTTPS for all server communications

### 8.2 Performance
- Implement token refresh handling
- Clean up unused tokens
- Use topic subscriptions for targeted messaging

### 8.3 Monitoring
- Monitor notification delivery rates
- Track user engagement with notifications
- Implement analytics for notification effectiveness

## Step 9: Testing Checklist

- [ ] FCM token is generated successfully
- [ ] Test notifications are received in foreground
- [ ] Test notifications are received in background
- [ ] Test notifications open app when tapped
- [ ] Topic subscriptions work correctly
- [ ] Token refresh is handled properly
- [ ] Server integration is working
- [ ] Custom notification actions work
- [ ] Data messages are handled correctly

## Support

For issues and questions:
1. Check Firebase documentation
2. Review React Native Firebase documentation
3. Check Android logs for errors
4. Verify all configuration files are correct

## Next Steps

1. Replace the template `google-services.json` with your actual Firebase configuration
2. Test the integration using the provided test component
3. Implement server-side notification sending
4. Add custom notification handling based on your app's needs
5. Test thoroughly on different Android versions and devices
