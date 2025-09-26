import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { API_CONFIG, testServerConnection, findWorkingServer } from '../config/api';

const ServerStatusChecker = () => {
  const { t } = useTranslation();
  const [serverStatus, setServerStatus] = useState({});
  const [isChecking, setIsChecking] = useState(false);
  const [workingServer, setWorkingServer] = useState(null);

  const checkAllServers = async () => {
    setIsChecking(true);
    const status = {};
    
    const servers = [
      { name: 'Primary Server', url: API_CONFIG.BASE_URL },
      { name: 'Android Emulator', url: 'http://10.0.2.2:4000' },
      { name: 'iOS Simulator', url: 'http://localhost:4000' },
      { name: 'Localhost', url: 'http://127.0.0.1:4000' },
    ];

    for (const server of servers) {
      try {
        const isWorking = await testServerConnection(server.url);
        status[server.name] = { url: server.url, status: isWorking ? 'Online' : 'Offline' };
      } catch (error) {
        status[server.name] = { url: server.url, status: 'Error', error: error.message };
      }
    }

    setServerStatus(status);
    setIsChecking(false);
  };

  const findWorkingServerHandler = async () => {
    setIsChecking(true);
    try {
      const server = await findWorkingServer();
      setWorkingServer(server);
      Alert.alert(t('common.success'), `Found working server: ${server}`);
    } catch (error) {
      Alert.alert(t('common.error'), 'No working server found. Please start your backend server.');
    }
    setIsChecking(false);
  };

  useEffect(() => {
    checkAllServers();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Server Status Checker</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={checkAllServers}
        disabled={isChecking}
      >
        <Text style={styles.buttonText}>
          {isChecking ? 'Checking...' : 'Refresh Server Status'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.findButton]} 
        onPress={findWorkingServerHandler}
        disabled={isChecking}
      >
        <Text style={styles.buttonText}>
          {isChecking ? 'Searching...' : 'Find Working Server'}
        </Text>
      </TouchableOpacity>

      {workingServer && (
        <View style={styles.workingServerContainer}>
          <Text style={styles.workingServerTitle}>Working Server Found:</Text>
          <Text style={styles.workingServerUrl}>{workingServer}</Text>
        </View>
      )}

      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Server Status:</Text>
        {Object.entries(serverStatus).map(([name, info]) => (
          <View key={name} style={styles.serverItem}>
            <Text style={styles.serverName}>{name}:</Text>
            <Text style={[
              styles.serverStatus,
              info.status === 'Online' ? styles.online : styles.offline
            ]}>
              {info.status}
            </Text>
            <Text style={styles.serverUrl}>{info.url}</Text>
          </View>
        ))}
      </View>

      <View style={styles.helpContainer}>
        <Text style={styles.helpTitle}>Troubleshooting Tips:</Text>
        <Text style={styles.helpText}>
          • Make sure your backend server is running on port 4000{'\n'}
          • Check if your device and computer are on the same network{'\n'}
          • For Android emulator, use 10.0.2.2:4000{'\n'}
          • For iOS simulator, use localhost:4000{'\n'}
          • For physical devices, use your computer's IP address{'\n'}
          • Ensure your firewall allows connections on port 4000
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
    color: '#003667',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FEC200',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  findButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: '#003667',
    fontSize: 16,
    fontWeight: 'bold',
  },
  workingServerContainer: {
    backgroundColor: '#d4edda',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  workingServerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#155724',
    marginBottom: 5,
  },
  workingServerUrl: {
    fontSize: 14,
    color: '#155724',
    fontFamily: 'monospace',
  },
  statusContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003667',
    marginBottom: 15,
  },
  serverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  serverName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 120,
  },
  serverStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 10,
  },
  online: {
    color: '#28a745',
  },
  offline: {
    color: '#dc3545',
  },
  serverUrl: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    flex: 1,
  },
  helpContainer: {
    backgroundColor: '#e7f3ff',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#004085',
    marginBottom: 10,
  },
  helpText: {
    fontSize: 14,
    color: '#004085',
    lineHeight: 20,
  },
});

export default ServerStatusChecker;
