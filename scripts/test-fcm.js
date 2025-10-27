#!/usr/bin/env node

/**
 * FCM Testing Script
 * Comprehensive testing for Firebase Cloud Messaging functionality
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 FCM Testing Script');
console.log('==================\n');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Test 1: Check FCM Dependencies
log('\n📦 Testing FCM Dependencies...', 'blue');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const fcmDeps = [
    '@react-native-firebase/app',
    '@react-native-firebase/messaging'
  ];
  
  fcmDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      log(`✅ ${dep}: ${packageJson.dependencies[dep]}`, 'green');
    } else {
      log(`❌ ${dep}: Not found`, 'red');
    }
  });
} catch (error) {
  log(`❌ Error reading package.json: ${error.message}`, 'red');
}

// Test 2: Check Android Configuration
log('\n🤖 Testing Android Configuration...', 'blue');
try {
  // Check google-services.json
  const googleServicesPath = 'android/app/google-services.json';
  if (fs.existsSync(googleServicesPath)) {
    const googleServices = JSON.parse(fs.readFileSync(googleServicesPath, 'utf8'));
    log(`✅ google-services.json found`, 'green');
    log(`   Project ID: ${googleServices.project_info?.project_id || 'Not found'}`, 'yellow');
    log(`   Project Number: ${googleServices.project_info?.project_number || 'Not found'}`, 'yellow');
  } else {
    log(`❌ google-services.json not found`, 'red');
  }

  // Check AndroidManifest.xml
  const manifestPath = 'android/app/src/main/AndroidManifest.xml';
  if (fs.existsSync(manifestPath)) {
    const manifest = fs.readFileSync(manifestPath, 'utf8');
    if (manifest.includes('POST_NOTIFICATIONS')) {
      log(`✅ POST_NOTIFICATIONS permission found`, 'green');
    } else {
      log(`❌ POST_NOTIFICATIONS permission missing`, 'red');
    }
    
    if (manifest.includes('MyFirebaseMessagingService')) {
      log(`✅ MyFirebaseMessagingService declared`, 'green');
    } else {
      log(`❌ MyFirebaseMessagingService not declared`, 'red');
    }
  } else {
    log(`❌ AndroidManifest.xml not found`, 'red');
  }
} catch (error) {
  log(`❌ Error checking Android config: ${error.message}`, 'red');
}

// Test 3: Check FCM Service Files
log('\n🔧 Testing FCM Service Files...', 'blue');
const fcmFiles = [
  'services/FCMService.js',
  'services/FCMApiClient.js',
  'components/NotificationHandler.js',
  'components/FCMTestComponent.js',
  'components/FCMDebugComponent.js',
  'context/NotificationContext.js',
  'screens/NotificationSettingsScreen.js'
];

fcmFiles.forEach(file => {
  if (fs.existsSync(file)) {
    log(`✅ ${file}`, 'green');
  } else {
    log(`❌ ${file} missing`, 'red');
  }
});

// Test 4: Check API Configuration
log('\n🌐 Testing API Configuration...', 'blue');
try {
  const apiConfig = fs.readFileSync('config/api.js', 'utf8');
  if (apiConfig.includes('BASE_URL')) {
    log(`✅ API configuration found`, 'green');
  } else {
    log(`❌ API configuration missing`, 'red');
  }
} catch (error) {
  log(`❌ Error reading API config: ${error.message}`, 'red');
}

// Test 5: Check Navigation Configuration
log('\n🧭 Testing Navigation Configuration...', 'blue');
try {
  const appJs = fs.readFileSync('App.js', 'utf8');
  const fcmScreens = [
    'FCMTest',
    'FCMDebug',
    'NotificationSettings'
  ];
  
  fcmScreens.forEach(screen => {
    if (appJs.includes(screen)) {
      log(`✅ ${screen} screen configured`, 'green');
    } else {
      log(`❌ ${screen} screen missing`, 'red');
    }
  });
} catch (error) {
  log(`❌ Error checking navigation: ${error.message}`, 'red');
}

// Test 6: Check Backend Server
log('\n🖥️ Testing Backend Server...', 'blue');
try {
  const { execSync } = require('child_process');
  const result = execSync('curl -s -o /dev/null -w "%{http_code}" http://192.168.29.150:4000/api/health', { encoding: 'utf8' });
  if (result.trim() === '401' || result.trim() === '200') {
    log(`✅ Backend server is running (HTTP ${result.trim()})`, 'green');
  } else {
    log(`❌ Backend server not responding (HTTP ${result.trim()})`, 'red');
  }
} catch (error) {
  log(`❌ Backend server not reachable: ${error.message}`, 'red');
}

// Test 7: Check React Native App Status
log('\n📱 Testing React Native App...', 'blue');
try {
  const result = execSync('adb devices', { encoding: 'utf8' });
  if (result.includes('device')) {
    log(`✅ Android device/emulator connected`, 'green');
  } else {
    log(`❌ No Android device/emulator connected`, 'red');
  }
} catch (error) {
  log(`❌ Error checking devices: ${error.message}`, 'red');
}

// Summary
log('\n📋 FCM Testing Summary', 'bold');
log('====================', 'bold');
log('\nTo test FCM functionality:', 'yellow');
log('1. Open your React Native app', 'yellow');
log('2. Navigate to FCMDebug screen', 'yellow');
log('3. Run all debug tests', 'yellow');
log('4. Check console logs for results', 'yellow');
log('\nFor manual testing:', 'yellow');
log('1. Navigate to FCMTest screen', 'yellow');
log('2. Register FCM token', 'yellow');
log('3. Send test notification', 'yellow');
log('4. Check notification settings', 'yellow');

log('\n🎯 FCM Testing Complete!', 'green');
