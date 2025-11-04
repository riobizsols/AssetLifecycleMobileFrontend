import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import FCMService from '../services/FCMService';
import { useNotification } from '../context/NotificationContext';

const NotificationHandler = ({ children }) => {
  const { incrementUnreadCount } = useNotification();
  const [fcmToken, setFcmToken] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initializeFCM();
  }, []);

  const initializeFCM = async () => {
    try {
      await FCMService.initialize();
      const token = await FCMService.getFCMToken();
      setFcmToken(token);
      setInitialized(true);
      
      // You can send the token to your server here
      // await FCMService.sendTokenToServer(token, 'USER_ID');
      
    } catch (error) {
      console.error('FCM initialization error:', error);
    }
  };

  // Handle token refresh
  useEffect(() => {
    const unsubscribe = messaging().onTokenRefresh(async (token) => {
      console.log('FCM token refreshed:', token);
      setFcmToken(token);
      // Send new token to server
      // await FCMService.sendTokenToServer(token, 'USER_ID');
    });

    return unsubscribe;
  }, []);

  // Handle foreground messages
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message received:', remoteMessage);
      
      // Don't show popup alert in foreground - increment unread count instead
      // The notification badge will show a red dot
      if (remoteMessage.notification) {
        console.log('📨 Foreground notification:', {
          title: remoteMessage.notification.title,
          body: remoteMessage.notification.body,
        });
        // Increment unread count to show red dot badge
        incrementUnreadCount();
      }
    });

    return unsubscribe;
  }, [incrementUnreadCount]);

  // Handle notification tap when app is in background
  useEffect(() => {
    const unsubscribe = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app from background:', remoteMessage);
      handleNotificationTap(remoteMessage);
      // Don't increment count - user is opening notification directly
    });

    return unsubscribe;
  }, []);

  // Handle notification tap when app is completely quit
  useEffect(() => {
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Notification opened app from quit state:', remoteMessage);
          handleNotificationTap(remoteMessage);
        }
      });
  }, []);

  const handleNotificationTap = (remoteMessage) => {
    const { data } = remoteMessage;
    
    if (data) {
      console.log('Notification data:', data);
      
      // Handle navigation based on notification data
      // Example: Navigate to specific screen
      // if (data.screen) {
      //   navigationService.navigate(data.screen, data.params);
      // }
    }
  };

  // Subscribe to topics (example)
  const subscribeToTopic = async (topic) => {
    try {
      await FCMService.subscribeToTopic(topic);
    } catch (error) {
      console.error('Error subscribing to topic:', error);
    }
  };

  // Unsubscribe from topics (example)
  const unsubscribeFromTopic = async (topic) => {
    try {
      await FCMService.unsubscribeFromTopic(topic);
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
    }
  };

  return (
    <View style={styles.container}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default NotificationHandler;
