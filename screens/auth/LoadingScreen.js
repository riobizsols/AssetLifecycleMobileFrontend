import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { authUtils } from '../../utils/auth';
import { useNavigation } from '../../context/NavigationContext';

const LoadingScreen = ({ navigation }) => {
  const { loadUserNavigation } = useNavigation();
  
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Add a small delay to show the loading screen
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const isAuthenticated = await authUtils.isAuthenticated();
      
      if (isAuthenticated) {
        // User is authenticated, load navigation data and navigate to home screen
        try {
          await loadUserNavigation();
        } catch (error) {
          console.error('Error loading user navigation:', error);
          // Continue with navigation even if loading fails
        }
        navigation.replace('Home');
      } else {
        // User is not authenticated, navigate to login
        navigation.replace('Login');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // On error, navigate to login as fallback
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Text style={styles.logoText}>Asset</Text>
        <Text style={styles.logoSubText}>Management</Text>
        <ActivityIndicator 
          size="large" 
          color="#003667" 
          style={styles.loader}
        />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#003667',
    letterSpacing: 2,
  },
  logoSubText: {
    fontSize: 18,
    color: '#003667',
    fontWeight: '600',
    marginTop: -5,
    marginBottom: 40,
  },
  loader: {
    marginVertical: 20,
  },
  loadingText: {
    color: '#7A7A7A',
    fontSize: 16,
  },
});

export default LoadingScreen; 