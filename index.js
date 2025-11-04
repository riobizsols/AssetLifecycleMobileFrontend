import './expo-polyfill';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';

// Register background handler - MUST be called before AppRegistry.registerComponent
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📨 Message handled in the background!', remoteMessage);
  // Handle background message here
});

AppRegistry.registerComponent(appName, () => App);