import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Clipboard,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import FCMService from '../services/FCMService';
import { useNotification } from '../context/NotificationContext';
import CustomAlert from './CustomAlert';

const FCMTestComponent = () => {
  const {
    fcmToken,
    isRegistered,
    preferences,
    deviceTokens,
    notificationHistory,
    preferencesLoading,
    deviceTokensLoading,
    historyLoading,
    loadPreferences,
    loadDeviceTokens,
    loadNotificationHistory,
    sendTestNotification,
    registerToken,
    unregisterToken,
    updatePreference,
    getAllNotificationTypes,
  } = useNotification();

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [testTitle, setTestTitle] = useState('Test Notification');
  const [testBody, setTestBody] = useState('This is a test notification');
  const [selectedNotificationType, setSelectedNotificationType] = useState('test_notification');
  const [loading, setLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
    confirmText: 'OK',
    showCancel: false,
  });

  useEffect(() => {
    loadPreferences();
    loadDeviceTokens();
    loadNotificationHistory();
  }, []);

  const copyToken = () => {
    if (fcmToken) {
      Clipboard.setString(fcmToken);
      Alert.alert('Success', 'FCM Token copied to clipboard!');
    }
  };

  const subscribeToTestTopic = async () => {
    try {
      await FCMService.subscribeToTopic('test-topic');
      setIsSubscribed(true);
      Alert.alert('Success', 'Subscribed to test-topic');
    } catch (error) {
      Alert.alert('Error', 'Failed to subscribe to topic');
    }
  };

  const unsubscribeFromTestTopic = async () => {
    try {
      await FCMService.unsubscribeFromTopic('test-topic');
      setIsSubscribed(false);
      Alert.alert('Success', 'Unsubscribed from test-topic');
    } catch (error) {
      Alert.alert('Error', 'Failed to unsubscribe from topic');
    }
  };

  const testLocalNotification = () => {
    Alert.alert(
      'Test Notification',
      'This is a test notification to verify FCM is working',
      [{ text: 'OK' }]
    );
  };

  const handleRegisterToken = async () => {
    try {
      setLoading(true);
      await registerToken();
      Alert.alert('Success', 'Token registered with server');
    } catch (error) {
      Alert.alert('Error', 'Failed to register token');
    } finally {
      setLoading(false);
    }
  };

  const handleUnregisterToken = async () => {
    try {
      setLoading(true);
      await unregisterToken();
      Alert.alert('Success', 'Token unregistered from server');
    } catch (error) {
      Alert.alert('Error', 'Failed to unregister token');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestNotification = async () => {
    try {
      setLoading(true);
      const result = await sendTestNotification(testTitle, testBody, {
        type: 'test',
        notificationType: selectedNotificationType,
        timestamp: new Date().toISOString(),
      });
      
      // Use custom alert for better styling
      setAlertConfig({
        visible: true,
        title: 'Test Notification Sent',
        message: `Title: "${testTitle}"\nMessage: "${testBody}"\n\nResult: Success: ${result.data.successCount}, Failed: ${result.data.failureCount}`,
        type: 'success',
        onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false })),
        confirmText: 'OK',
        showCancel: false,
      });
    } catch (error) {
      setAlertConfig({
        visible: true,
        title: 'Test Notification Failed',
        message: `Title: "${testTitle}"\nMessage: "${testBody}"\n\nError: ${error.message}`,
        type: 'error',
        onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false })),
        confirmText: 'OK',
        showCancel: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPreferences(),
        loadDeviceTokens(),
        loadNotificationHistory(),
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePreference = async (notificationType, preferences) => {
    try {
      await updatePreference(notificationType, preferences);
      Alert.alert('Success', 'Preference updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update preference');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>FCM Test Component</Text>
      
      {/* FCM Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FCM Status</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Token:</Text>
          <Text style={styles.statusValue}>
            {fcmToken ? `${fcmToken.substring(0, 30)}...` : 'Not available'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Registered:</Text>
          <Text style={[styles.statusValue, { color: isRegistered ? '#34C759' : '#FF3B30' }]}>
            {isRegistered ? 'Yes' : 'No'}
          </Text>
        </View>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={copyToken}>
            <Text style={styles.buttonText}>Copy Token</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, isRegistered ? styles.unregisterButton : styles.registerButton]} 
            onPress={isRegistered ? handleUnregisterToken : handleRegisterToken}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.buttonText}>
                {isRegistered ? 'Unregister' : 'Register'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Test Notification */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Notification</Text>
        <TextInput
          style={styles.input}
          placeholder="Notification Title"
          value={testTitle}
          onChangeText={setTestTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Notification Body"
          value={testBody}
          onChangeText={setTestBody}
        />
        <TouchableOpacity 
          style={[styles.button, styles.testButton]} 
          onPress={handleSendTestNotification}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.buttonText}>Send Test Notification</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Topic Subscription */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Topic Subscription</Text>
        <TouchableOpacity 
          style={[styles.button, isSubscribed ? styles.unsubscribeButton : styles.subscribeButton]} 
          onPress={isSubscribed ? unsubscribeFromTestTopic : subscribeToTestTopic}
        >
          <Text style={styles.buttonText}>
            {isSubscribed ? 'Unsubscribe from test-topic' : 'Subscribe to test-topic'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notification Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        {getAllNotificationTypes().map(({ type, preference }) => (
          <View key={type} style={styles.preferenceRow}>
            <Text style={styles.preferenceLabel}>{type}</Text>
            <View style={styles.preferenceControls}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  preference.isEnabled ? styles.toggleButtonActive : styles.toggleButtonInactive
                ]}
                onPress={() => handleUpdatePreference(type, { isEnabled: !preference.isEnabled })}
              >
                <Text style={styles.toggleButtonText}>
                  {preference.isEnabled ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Device Tokens */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Tokens ({deviceTokens.length})</Text>
        {deviceTokensLoading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          deviceTokens.slice(0, 3).map((token, index) => (
            <Text key={index} style={styles.tokenText}>
              {token.tokenId?.substring(0, 20)}... ({token.platform})
            </Text>
          ))
        )}
        <TouchableOpacity style={styles.button} onPress={() => loadDeviceTokens()}>
          <Text style={styles.buttonText}>Refresh Tokens</Text>
        </TouchableOpacity>
      </View>

      {/* Notification History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Notification History ({Array.isArray(notificationHistory) ? notificationHistory.length : 0})
        </Text>
        {historyLoading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          Array.isArray(notificationHistory) && notificationHistory.length > 0 ? (
            notificationHistory.slice(0, 3).map((notification, index) => (
              <View key={index} style={styles.historyItem}>
                <Text style={styles.historyTitle}>{notification.title || 'No Title'}</Text>
                <Text style={styles.historyBody}>{notification.body || 'No Body'}</Text>
                <Text style={styles.historyDate}>
                  {notification.timestamp ? new Date(notification.timestamp).toLocaleString() : 'No Date'}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>
              No notification history available. This endpoint is not implemented on the backend yet.
            </Text>
          )
        )}
        <TouchableOpacity style={styles.button} onPress={() => loadNotificationHistory()}>
          <Text style={styles.buttonText}>Refresh History</Text>
        </TouchableOpacity>
      </View>

      {/* Refresh All Data */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <TouchableOpacity 
          style={[styles.button, styles.refreshButton]} 
          onPress={handleRefreshData}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.buttonText}>Refresh All Data</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.instructionText}>
          1. Register your FCM token with the server{'\n'}
          2. Configure notification preferences{'\n'}
          3. Send test notifications to verify setup{'\n'}
          4. Check device tokens and notification history{'\n'}
          5. Use Firebase Console for additional testing
        </Text>
      </View>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
        confirmText={alertConfig.confirmText}
        showCancel={alertConfig.showCancel}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
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
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    alignItems: 'center',
    flex: 1,
  },
  registerButton: {
    backgroundColor: '#34C759',
  },
  unregisterButton: {
    backgroundColor: '#FF3B30',
  },
  subscribeButton: {
    backgroundColor: '#34C759',
  },
  unsubscribeButton: {
    backgroundColor: '#FF3B30',
  },
  testButton: {
    backgroundColor: '#FF9500',
  },
  refreshButton: {
    backgroundColor: '#5856D6',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: 'white',
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 8,
  },
  preferenceLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  preferenceControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 50,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#34C759',
  },
  toggleButtonInactive: {
    backgroundColor: '#FF3B30',
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tokenText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  historyItem: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    marginBottom: 8,
    borderRadius: 6,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  historyBody: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  historyDate: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
});

export default FCMTestComponent;
