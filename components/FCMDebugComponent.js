import React, { useState, useEffect } from 'react';
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
import FCMService from '../services/FCMService';
import FCMApiClient from '../services/FCMApiClient';
import { API_CONFIG } from '../config/api';

const FCMDebugComponent = () => {
  const [fcmToken, setFcmToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    initializeDebug();
  }, []);

  const initializeDebug = async () => {
    try {
      const token = await FCMService.getFCMToken();
      setFcmToken(token);
      setApiUrl(FCMApiClient.baseURL);
    } catch (error) {
      console.error('Error initializing debug:', error);
    }
  };

  const testApiConnection = async () => {
    try {
      setLoading(true);
      setTestResult(null);

      // Test basic API connection
      const response = await fetch(`${FCMApiClient.baseURL}/health`, {
        method: 'GET',
        headers: await FCMApiClient.getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult({
          success: true,
          message: 'API connection successful',
          data: data,
        });
      } else {
        setTestResult({
          success: false,
          message: `API connection failed: ${response.status}`,
          status: response.status,
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `API connection error: ${error.message}`,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const testTokenRegistration = async () => {
    try {
      setLoading(true);
      setTestResult(null);

      if (!fcmToken) {
        throw new Error('No FCM token available');
      }

      const result = await FCMService.registerTokenWithServer();
      setTestResult({
        success: true,
        message: 'Token registration successful',
        data: result,
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Token registration failed: ${error.message}`,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const testDirectApiCall = async () => {
    try {
      setLoading(true);
      setTestResult(null);

      if (!fcmToken) {
        throw new Error('No FCM token available');
      }

      // Test direct API call
      const result = await FCMApiClient.registerToken(fcmToken);
      setTestResult({
        success: true,
        message: 'Direct API call successful',
        data: result,
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Direct API call failed: ${error.message}`,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const testHeaders = async () => {
    try {
      setLoading(true);
      setTestResult(null);

      const headers = await FCMApiClient.getHeaders();
      setTestResult({
        success: true,
        message: 'Headers retrieved successfully',
        data: headers,
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Header retrieval failed: ${error.message}`,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const clearTestResult = () => {
    setTestResult(null);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>FCM Debug Component</Text>
      
      {/* API Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Configuration</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Base URL:</Text>
          <Text style={styles.infoValue}>{apiUrl}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>API Config Base:</Text>
          <Text style={styles.infoValue}>{API_CONFIG.BASE_URL}</Text>
        </View>
      </View>

      {/* FCM Token */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FCM Token</Text>
        <Text style={styles.tokenText}>
          {fcmToken ? fcmToken.substring(0, 50) + '...' : 'No token available'}
        </Text>
        <TouchableOpacity style={styles.button} onPress={initializeDebug}>
          <Text style={styles.buttonText}>Refresh Token</Text>
        </TouchableOpacity>
      </View>

      {/* Test Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug Tests</Text>
        
        <TouchableOpacity 
          style={[styles.button, styles.testButton]} 
          onPress={testApiConnection}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.buttonText}>Test API Connection</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.testButton]} 
          onPress={testHeaders}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.buttonText}>Test Headers</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.testButton]} 
          onPress={testDirectApiCall}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.buttonText}>Test Direct API Call</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.testButton]} 
          onPress={testTokenRegistration}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.buttonText}>Test Token Registration</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Test Results */}
      {testResult && (
        <View style={styles.section}>
          <View style={styles.resultHeader}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            <TouchableOpacity onPress={clearTestResult}>
              <Text style={styles.clearButton}>Clear</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[
            styles.resultContainer,
            testResult.success ? styles.successResult : styles.errorResult
          ]}>
            <Text style={styles.resultTitle}>
              {testResult.success ? '✅ Success' : '❌ Error'}
            </Text>
            <Text style={styles.resultMessage}>{testResult.message}</Text>
            
            {testResult.data && (
              <Text style={styles.resultData}>
                Data: {JSON.stringify(testResult.data, null, 2)}
              </Text>
            )}
            
            {testResult.error && (
              <Text style={styles.resultError}>
                Error: {testResult.error}
              </Text>
            )}
            
            {testResult.status && (
              <Text style={styles.resultStatus}>
                Status: {testResult.status}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug Instructions</Text>
        <Text style={styles.instructionText}>
          1. Check API Configuration - Verify base URL is correct{'\n'}
          2. Test API Connection - Ensure backend is running{'\n'}
          3. Test Headers - Verify authentication headers{'\n'}
          4. Test Direct API Call - Test FCM registration endpoint{'\n'}
          5. Test Token Registration - Full FCM service test{'\n'}
          {'\n'}
          If any test fails, check:{'\n'}
          - Backend server is running{'\n'}
          - API endpoints are correct{'\n'}
          - Authentication token is valid{'\n'}
          - Network connectivity
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
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  tokenText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clearButton: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultContainer: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  successResult: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
  },
  errorResult: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  resultMessage: {
    fontSize: 14,
    marginBottom: 5,
  },
  resultData: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginTop: 5,
  },
  resultError: {
    fontSize: 12,
    color: '#dc3545',
    marginTop: 5,
  },
  resultStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default FCMDebugComponent;
