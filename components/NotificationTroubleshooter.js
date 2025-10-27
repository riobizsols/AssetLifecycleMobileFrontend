import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Linking,
  Platform,
} from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import messaging from '@react-native-firebase/messaging';
import { useNotification } from '../context/NotificationContext';

const NotificationTroubleshooter = () => {
  const { sendTestNotification } = useNotification();
  const [permissionStatus, setPermissionStatus] = useState('checking');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [batteryOptimization, setBatteryOptimization] = useState('unknown');
  const [doNotDisturb, setDoNotDisturb] = useState('unknown');
  const [fcmToken, setFcmToken] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkPermissions();
    getFCMToken();
  }, []);

  const checkPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        const result = await check(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
        setPermissionStatus(result);
        setNotificationsEnabled(result === RESULTS.GRANTED);
      } else {
        const authStatus = await messaging().hasPermission();
        setPermissionStatus(authStatus ? 'granted' : 'denied');
        setNotificationsEnabled(authStatus);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      setPermissionStatus('error');
    }
  };

  const requestPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        const result = await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
        setPermissionStatus(result);
        setNotificationsEnabled(result === RESULTS.GRANTED);
      } else {
        const authStatus = await messaging().requestPermission();
        setPermissionStatus(authStatus ? 'granted' : 'denied');
        setNotificationsEnabled(authStatus);
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request notification permissions');
    }
  };

  const getFCMToken = async () => {
    try {
      const token = await messaging().getToken();
      setFcmToken(token);
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
  };

  const testNotificationDelivery = async () => {
    setLoading(true);
    const results = [];

    try {
      // Test 1: Check if FCM token exists
      results.push({
        test: 'FCM Token Check',
        status: fcmToken ? 'PASS' : 'FAIL',
        message: fcmToken ? 'FCM token exists' : 'No FCM token found'
      });

      // Test 2: Check notification permissions
      results.push({
        test: 'Notification Permissions',
        status: notificationsEnabled ? 'PASS' : 'FAIL',
        message: notificationsEnabled ? 'Permissions granted' : 'Permissions denied'
      });

      // Test 3: Send test notification
      try {
        const result = await sendTestNotification(
          'Troubleshoot Test',
          'This is a test notification for troubleshooting',
          { type: 'troubleshoot_test' }
        );
        results.push({
          test: 'Send Test Notification',
          status: 'PASS',
          message: `Notification sent successfully. Success: ${result.data.successCount}, Failed: ${result.data.failureCount}`
        });
      } catch (error) {
        results.push({
          test: 'Send Test Notification',
          status: 'FAIL',
          message: `Failed to send notification: ${error.message}`
        });
      }

      // Test 4: Check if app is in foreground
      results.push({
        test: 'App State Check',
        status: 'INFO',
        message: 'App is currently in foreground. Close app completely to see status bar notifications.'
      });

      setTestResults(results);
    } catch (error) {
      results.push({
        test: 'General Error',
        status: 'FAIL',
        message: `Error during testing: ${error.message}`
      });
      setTestResults(results);
    } finally {
      setLoading(false);
    }
  };

  const openNotificationSettings = () => {
    if (Platform.OS === 'android') {
      Linking.openSettings();
    } else {
      Linking.openURL('app-settings:');
    }
  };

  const openBatteryOptimization = () => {
    if (Platform.OS === 'android') {
      Linking.openURL('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASS': return '#4CAF50';
      case 'FAIL': return '#F44336';
      case 'INFO': return '#2196F3';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PASS': return '✓';
      case 'FAIL': return '✗';
      case 'INFO': return 'ℹ';
      default: return '?';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Notification Troubleshooter</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Permission Status</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Notification Permissions:</Text>
          <Text style={[styles.statusText, { color: getStatusColor(permissionStatus) }]}>
            {permissionStatus === 'granted' ? '✓ Granted' : 
             permissionStatus === 'denied' ? '✗ Denied' : 
             permissionStatus === 'checking' ? '⏳ Checking...' : '❌ Error'}
          </Text>
        </View>
        
        {!notificationsEnabled && (
          <TouchableOpacity style={styles.button} onPress={requestPermissions}>
            <Text style={styles.buttonText}>Request Notification Permissions</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FCM Token</Text>
        <Text style={styles.tokenText}>
          {fcmToken ? `${fcmToken.substring(0, 50)}...` : 'No token available'}
        </Text>
        {fcmToken && (
          <TouchableOpacity style={styles.copyButton} onPress={() => {
            // Copy to clipboard functionality would go here
            Alert.alert('Token Copied', 'FCM token copied to clipboard');
          }}>
            <Text style={styles.copyButtonText}>Copy Token</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Run Diagnostics</Text>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={testNotificationDelivery}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.buttonText}>Run Full Diagnostic</Text>
          )}
        </TouchableOpacity>
      </View>

      {testResults.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          {testResults.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultIcon}>{getStatusIcon(result.status)}</Text>
                <Text style={styles.resultTest}>{result.test}</Text>
                <Text style={[styles.resultStatus, { color: getStatusColor(result.status) }]}>
                  {result.status}
                </Text>
              </View>
              <Text style={styles.resultMessage}>{result.message}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Fixes</Text>
        
        <TouchableOpacity style={styles.fixButton} onPress={openNotificationSettings}>
          <Text style={styles.fixButtonText}>Open App Notification Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.fixButton} onPress={openBatteryOptimization}>
          <Text style={styles.fixButtonText}>Open Battery Optimization Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Troubleshooting Steps</Text>
        <Text style={styles.instructionText}>
          1. Ensure notification permissions are granted{'\n'}
          2. Disable Do Not Disturb mode{'\n'}
          3. Disable battery optimization for this app{'\n'}
          4. Close the app completely (not just minimize){'\n'}
          5. Send test notification and check status bar{'\n'}
          6. If still not working, try restarting the device
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Send Test Notification</Text>
        <TouchableOpacity 
          style={[styles.button, styles.testButton]} 
          onPress={async () => {
            try {
              await sendTestNotification(
                'Status Bar Test',
                'Close the app now to see this in status bar',
                { type: 'status_bar_test' }
              );
              Alert.alert(
                'Test Sent',
                'Now close the app completely and check your status bar for the notification!'
              );
            } catch (error) {
              Alert.alert('Error', `Failed to send test: ${error.message}`);
            }
          }}
        >
          <Text style={styles.buttonText}>Send Status Bar Test</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 16,
    color: '#333',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tokenText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  testButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  copyButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#333',
    fontSize: 14,
  },
  resultItem: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  resultIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  resultTest: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  resultStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultMessage: {
    fontSize: 14,
    color: '#666',
    marginLeft: 26,
  },
  fixButton: {
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  fixButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default NotificationTroubleshooter;
