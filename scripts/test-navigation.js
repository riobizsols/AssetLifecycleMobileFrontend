#!/usr/bin/env node

/**
 * Navigation Testing Script
 * Test if FCM Debug screen is accessible
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🧭 Navigation Testing Script');
console.log('==========================\n');

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

// Test 1: Check Mock Navigation Data
log('\n📋 Testing Mock Navigation Data...', 'blue');
try {
  const mockData = require('../utils/mockNavigationData.js');
  const navigationData = mockData.getMockNavigationData();
  
  log(`✅ Mock data loaded successfully`, 'green');
  log(`   User ID: ${navigationData.user_id}`, 'yellow');
  log(`   Items count: ${navigationData.data.length}`, 'yellow');
  
  // Check for FCM items
  const fcmItems = navigationData.data.filter(item => 
    item.app_id.includes('FCM') || item.app_id.includes('NOTIFICATION')
  );
  
  if (fcmItems.length > 0) {
    log(`✅ FCM items found: ${fcmItems.length}`, 'green');
    fcmItems.forEach(item => {
      log(`   - ${item.app_id}: ${item.label}`, 'yellow');
    });
  } else {
    log(`❌ No FCM items found in mock data`, 'red');
  }
} catch (error) {
  log(`❌ Error loading mock data: ${error.message}`, 'red');
}

// Test 2: Check Navigation Service
log('\n🔧 Testing Navigation Service...', 'blue');
try {
  const navigationService = require('../services/navigationService.js');
  
  // Test screen mapping
  const fcmDebugScreen = navigationService.getScreenName('FCMDEBUG');
  const fcmTestScreen = navigationService.getScreenName('FCMTEST');
  const notificationScreen = navigationService.getScreenName('NOTIFICATIONSETTINGS');
  
  log(`✅ Screen mappings:`, 'green');
  log(`   FCMDEBUG -> ${fcmDebugScreen}`, 'yellow');
  log(`   FCMTEST -> ${fcmTestScreen}`, 'yellow');
  log(`   NOTIFICATIONSETTINGS -> ${notificationScreen}`, 'yellow');
  
  // Test icon mapping
  const fcmDebugIcon = navigationService.getNavigationIcon('FCMDEBUG');
  const fcmTestIcon = navigationService.getNavigationIcon('FCMTEST');
  const notificationIcon = navigationService.getNavigationIcon('NOTIFICATIONSETTINGS');
  
  log(`✅ Icon mappings:`, 'green');
  log(`   FCMDEBUG -> ${fcmDebugIcon}`, 'yellow');
  log(`   FCMTEST -> ${fcmTestIcon}`, 'yellow');
  log(`   NOTIFICATIONSETTINGS -> ${notificationIcon}`, 'yellow');
  
} catch (error) {
  log(`❌ Error testing navigation service: ${error.message}`, 'red');
}

// Test 3: Check App.js Configuration
log('\n📱 Testing App.js Configuration...', 'blue');
try {
  const appJs = fs.readFileSync('App.js', 'utf8');
  
  const fcmScreens = [
    'FCMDebug',
    'FCMTest', 
    'NotificationSettings'
  ];
  
  fcmScreens.forEach(screen => {
    if (appJs.includes(screen)) {
      log(`✅ ${screen} screen configured in App.js`, 'green');
    } else {
      log(`❌ ${screen} screen missing from App.js`, 'red');
    }
  });
} catch (error) {
  log(`❌ Error checking App.js: ${error.message}`, 'red');
}

// Test 4: Check Component Files
log('\n🧩 Testing Component Files...', 'blue');
const componentFiles = [
  'components/FCMDebugComponent.js',
  'components/FCMTestComponent.js',
  'screens/NotificationSettingsScreen.js'
];

componentFiles.forEach(file => {
  if (fs.existsSync(file)) {
    log(`✅ ${file} exists`, 'green');
  } else {
    log(`❌ ${file} missing`, 'red');
  }
});

// Test 5: Check Mock Data Usage
log('\n🔄 Testing Mock Data Usage...', 'blue');
try {
  const mockData = require('../utils/mockNavigationData.js');
  const shouldUseMock = mockData.shouldUseMockData();
  
  if (shouldUseMock) {
    log(`✅ Mock data is enabled`, 'green');
    log(`   FCM Debug screen should appear in navigation`, 'yellow');
  } else {
    log(`❌ Mock data is disabled`, 'red');
    log(`   FCM Debug screen will not appear`, 'yellow');
  }
} catch (error) {
  log(`❌ Error checking mock data usage: ${error.message}`, 'red');
}

// Summary
log('\n📋 Navigation Testing Summary', 'bold');
log('============================', 'bold');
log('\nTo access FCM Debug screen:', 'yellow');
log('1. Open your React Native app', 'yellow');
log('2. Login with your credentials', 'yellow');
log('3. Look for FCM Debug in the home screen menu', 'yellow');
log('4. Tap on FCM Debug to open the debug screen', 'yellow');

log('\nIf FCM Debug is not visible:', 'yellow');
log('1. Check console logs for navigation loading', 'yellow');
log('2. Verify mock data is enabled', 'yellow');
log('3. Restart the app completely', 'yellow');
log('4. Check if you are logged in', 'yellow');

log('\n🎯 Navigation Testing Complete!', 'green');
