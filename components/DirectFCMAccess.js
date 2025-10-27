import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const DirectFCMAccess = () => {
  const navigation = useNavigation();

  const navigateToFCMDebug = () => {
    try {
      navigation.navigate('FCMDebug');
    } catch (error) {
      Alert.alert('Navigation Error', `Cannot navigate to FCMDebug: ${error.message}`);
    }
  };

  const navigateToFCMTest = () => {
    try {
      navigation.navigate('FCMTest');
    } catch (error) {
      Alert.alert('Navigation Error', `Cannot navigate to FCMTest: ${error.message}`);
    }
  };

  const navigateToNotificationSettings = () => {
    try {
      navigation.navigate('NotificationSettings');
    } catch (error) {
      Alert.alert('Navigation Error', `Cannot navigate to NotificationSettings: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Direct FCM Access</Text>
      <Text style={styles.subtitle}>Use these buttons to access FCM screens directly</Text>
      
      <TouchableOpacity style={styles.button} onPress={navigateToFCMDebug}>
        <Text style={styles.buttonText}>🐛 FCM Debug</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={navigateToFCMTest}>
        <Text style={styles.buttonText}>🔔 FCM Test</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={navigateToNotificationSettings}>
        <Text style={styles.buttonText}>⚙️ Notification Settings</Text>
      </TouchableOpacity>
      
      <Text style={styles.instructions}>
        If these buttons work, the FCM screens are properly configured.
        If they don't work, check the navigation configuration.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructions: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontStyle: 'italic',
  },
});

export default DirectFCMAccess;
