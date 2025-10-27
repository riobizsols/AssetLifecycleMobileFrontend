import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNotification } from '../context/NotificationContext';

const StatusBarNotificationTester = () => {
  const { sendTestNotification } = useNotification();
  const [testTitle, setTestTitle] = useState('Status Bar Test');
  const [testBody, setTestBody] = useState('This notification should appear in your status bar');
  const [loading, setLoading] = useState(false);

  const handleSendNotification = async () => {
    try {
      setLoading(true);
      const result = await sendTestNotification(testTitle, testBody, {
        type: 'status_bar_test',
        timestamp: new Date().toISOString(),
      });
      
      Alert.alert(
        'Notification Sent!',
        `Check your status bar for the notification!\n\nTitle: "${testTitle}"\nMessage: "${testBody}"\n\nResult: Success: ${result.data.successCount}, Failed: ${result.data.failureCount}\n\nNote: Close the app to see status bar notification.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', `Failed to send notification: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendBackgroundNotification = async () => {
    try {
      setLoading(true);
      const result = await sendTestNotification(
        'Background Test',
        'Close the app now to see this notification in status bar',
        {
          type: 'background_test',
          timestamp: new Date().toISOString(),
        }
      );
      
      Alert.alert(
        'Background Notification Sent!',
        'Now close the app completely (not just minimize) and check your status bar for the notification!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', `Failed to send notification: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Status Bar Notification Tester</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Status Bar Notifications</Text>
        <Text style={styles.instructionText}>
          This component helps you test notifications in the status bar.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Notification</Text>
        <TextInput
          style={styles.input}
          placeholder="Notification Title"
          value={testTitle}
          onChangeText={setTestTitle}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Notification Message"
          value={testBody}
          onChangeText={setTestBody}
          multiline
          numberOfLines={3}
        />
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleSendNotification}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.buttonText}>Send Test Notification</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Background Test</Text>
        <Text style={styles.instructionText}>
          This will send a notification that should appear in status bar when app is closed.
        </Text>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleSendBackgroundNotification}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Send Background Notification
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Testing Instructions</Text>
        <Text style={styles.instructionText}>
          1. Send a test notification{'\n'}
          2. Close the app completely (not just minimize){'\n'}
          3. Check your status bar for the notification{'\n'}
          4. Tap the notification to open the app{'\n'}
          5. Verify the app opens correctly
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Troubleshooting</Text>
        <Text style={styles.instructionText}>
          • If no notification appears, check notification permissions{'\n'}
          • Make sure Do Not Disturb is disabled{'\n'}
          • Check if battery optimization is blocking notifications{'\n'}
          • Try sending from Firebase Console as alternative
        </Text>
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
    marginBottom: 10,
    color: '#333',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
});

export default StatusBarNotificationTester;
