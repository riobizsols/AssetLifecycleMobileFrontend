import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNotification, NOTIFICATION_TYPES } from '../context/NotificationContext';

const NotificationSettingsScreen = () => {
  const {
    preferences,
    preferencesLoading,
    preferencesError,
    settingsLoading,
    settingsError,
    testNotificationLoading,
    fcmToken,
    isRegistered,
    loadPreferences,
    updatePreference,
    updateMultiplePreferences,
    sendTestNotification,
    registerToken,
    unregisterToken,
    isNotificationEnabled,
    getAllNotificationTypes,
  } = useNotification();

  const [refreshing, setRefreshing] = useState(false);
  const [testTitle, setTestTitle] = useState('Test Notification');
  const [testBody, setTestBody] = useState('This is a test notification from the app');

  useEffect(() => {
    loadPreferences();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPreferences();
    setRefreshing(false);
  };

  const handlePreferenceChange = async (notificationType, field, value) => {
    try {
      const currentPreference = preferences[notificationType] || {
        isEnabled: true,
        emailEnabled: true,
        pushEnabled: true,
      };

      const updatedPreference = {
        ...currentPreference,
        [field]: value,
      };

      await updatePreference(notificationType, updatedPreference);
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification preference');
    }
  };

  const handleToggleAll = async (enabled) => {
    try {
      const preferencesArray = Object.values(NOTIFICATION_TYPES).map(type => ({
        notificationType: type,
        preferences: {
          isEnabled: enabled,
          emailEnabled: enabled,
          pushEnabled: enabled,
        },
      }));

      await updateMultiplePreferences(preferencesArray);
    } catch (error) {
      Alert.alert('Error', 'Failed to update all preferences');
    }
  };

  const handleTestNotification = async () => {
    try {
      const result = await sendTestNotification(testTitle, testBody, {
        type: 'test',
        timestamp: new Date().toISOString(),
      });
      
      Alert.alert(
        'Test Notification Sent',
        `Title: "${testTitle}"\nMessage: "${testBody}"\n\nResult: Success: ${result.data.successCount}, Failed: ${result.data.failureCount}`
      );
    } catch (error) {
      Alert.alert(
        'Test Notification Failed',
        `Title: "${testTitle}"\nMessage: "${testBody}"\n\nError: ${error.message}`
      );
    }
  };

  const handleRegisterToken = async () => {
    try {
      await registerToken();
      Alert.alert('Success', 'Token registered successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to register token');
    }
  };

  const handleUnregisterToken = async () => {
    try {
      await unregisterToken();
      Alert.alert('Success', 'Token unregistered successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to unregister token');
    }
  };

  const getNotificationTypeLabel = (type) => {
    const labels = {
      [NOTIFICATION_TYPES.ASSET_CREATED]: 'Asset Created',
      [NOTIFICATION_TYPES.ASSET_UPDATED]: 'Asset Updated',
      [NOTIFICATION_TYPES.ASSET_DELETED]: 'Asset Deleted',
      [NOTIFICATION_TYPES.MAINTENANCE_DUE]: 'Maintenance Due',
      [NOTIFICATION_TYPES.MAINTENANCE_COMPLETED]: 'Maintenance Completed',
      [NOTIFICATION_TYPES.WORKFLOW_APPROVAL]: 'Workflow Approval',
      [NOTIFICATION_TYPES.WORKFLOW_ESCALATED]: 'Workflow Escalated',
      [NOTIFICATION_TYPES.BREAKDOWN_REPORTED]: 'Breakdown Reported',
      [NOTIFICATION_TYPES.USER_ASSIGNED]: 'User Assigned',
      [NOTIFICATION_TYPES.TEST_NOTIFICATION]: 'Test Notifications',
    };
    return labels[type] || type;
  };

  const getNotificationTypeDescription = (type) => {
    const descriptions = {
      [NOTIFICATION_TYPES.ASSET_CREATED]: 'Get notified when new assets are created',
      [NOTIFICATION_TYPES.ASSET_UPDATED]: 'Get notified when asset information is updated',
      [NOTIFICATION_TYPES.ASSET_DELETED]: 'Get notified when assets are deleted',
      [NOTIFICATION_TYPES.MAINTENANCE_DUE]: 'Get notified when maintenance is due',
      [NOTIFICATION_TYPES.MAINTENANCE_COMPLETED]: 'Get notified when maintenance is completed',
      [NOTIFICATION_TYPES.WORKFLOW_APPROVAL]: 'Get notified when workflow approval is required',
      [NOTIFICATION_TYPES.WORKFLOW_ESCALATED]: 'Get notified when workflows are escalated',
      [NOTIFICATION_TYPES.BREAKDOWN_REPORTED]: 'Get notified when breakdowns are reported',
      [NOTIFICATION_TYPES.USER_ASSIGNED]: 'Get notified when users are assigned to assets',
      [NOTIFICATION_TYPES.TEST_NOTIFICATION]: 'Receive test notifications for debugging',
    };
    return descriptions[type] || '';
  };

  const renderPreferenceItem = (notificationType) => {
    const preference = preferences[notificationType] || {
      isEnabled: true,
      emailEnabled: true,
      pushEnabled: true,
    };

    return (
      <View key={notificationType} style={styles.preferenceItem}>
        <View style={styles.preferenceHeader}>
          <Text style={styles.preferenceTitle}>
            {getNotificationTypeLabel(notificationType)}
          </Text>
          <Switch
            value={preference.isEnabled}
            onValueChange={(value) => handlePreferenceChange(notificationType, 'isEnabled', value)}
            disabled={settingsLoading}
          />
        </View>
        
        <Text style={styles.preferenceDescription}>
          {getNotificationTypeDescription(notificationType)}
        </Text>
        
        {preference.isEnabled && (
          <View style={styles.preferenceOptions}>
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Push Notifications</Text>
              <Switch
                value={preference.pushEnabled}
                onValueChange={(value) => handlePreferenceChange(notificationType, 'pushEnabled', value)}
                disabled={settingsLoading}
              />
            </View>
            
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Email Notifications</Text>
              <Switch
                value={preference.emailEnabled}
                onValueChange={(value) => handlePreferenceChange(notificationType, 'emailEnabled', value)}
                disabled={settingsLoading}
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  if (preferencesLoading && Object.keys(preferences).length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading notification preferences...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <Text style={styles.title}>Notification Settings</Text>
      
      {/* FCM Status */}
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>FCM Status</Text>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Token Registered:</Text>
          <Text style={[styles.statusValue, { color: isRegistered ? '#34C759' : '#FF3B30' }]}>
            {isRegistered ? 'Yes' : 'No'}
          </Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>FCM Token:</Text>
          <Text style={styles.statusValue}>
            {fcmToken ? `${fcmToken.substring(0, 20)}...` : 'Not available'}
          </Text>
        </View>
        
        <View style={styles.statusActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.registerButton]}
            onPress={handleRegisterToken}
            disabled={settingsLoading || isRegistered}
          >
            <Text style={styles.actionButtonText}>Register Token</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.unregisterButton]}
            onPress={handleUnregisterToken}
            disabled={settingsLoading || !isRegistered}
          >
            <Text style={styles.actionButtonText}>Unregister Token</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Global Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Global Controls</Text>
        <View style={styles.globalControls}>
          <TouchableOpacity
            style={[styles.globalButton, styles.enableAllButton]}
            onPress={() => handleToggleAll(true)}
            disabled={settingsLoading}
          >
            <Text style={styles.globalButtonText}>Enable All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.globalButton, styles.disableAllButton]}
            onPress={() => handleToggleAll(false)}
            disabled={settingsLoading}
          >
            <Text style={styles.globalButtonText}>Disable All</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        {Object.values(NOTIFICATION_TYPES).map(renderPreferenceItem)}
      </View>

      {/* Test Notification */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Notification</Text>
        <View style={styles.testSection}>
          <Text style={styles.testLabel}>Send a test notification to verify FCM is working:</Text>
          
          <TouchableOpacity
            style={[styles.testButton, testNotificationLoading && styles.testButtonDisabled]}
            onPress={handleTestNotification}
            disabled={testNotificationLoading}
          >
            {testNotificationLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.testButtonText}>Send Test Notification</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Error Messages */}
      {preferencesError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading preferences: {preferencesError}</Text>
        </View>
      )}
      
      {settingsError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error updating settings: {settingsError}</Text>
        </View>
      )}

      {/* Loading Indicator */}
      {settingsLoading && (
        <View style={styles.loadingIndicator}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Updating preferences...</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  statusSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  registerButton: {
    backgroundColor: '#34C759',
  },
  unregisterButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  globalControls: {
    flexDirection: 'row',
    gap: 12,
  },
  globalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  enableAllButton: {
    backgroundColor: '#34C759',
  },
  disableAllButton: {
    backgroundColor: '#FF3B30',
  },
  globalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  preferenceItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  preferenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  preferenceOptions: {
    marginLeft: 16,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 14,
    color: '#666',
  },
  testSection: {
    alignItems: 'center',
  },
  testLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  testButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  testButtonDisabled: {
    backgroundColor: '#ccc',
  },
  testButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
});

export default NotificationSettingsScreen;
