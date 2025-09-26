// Test utility to verify Maintenance Supervisor navigation configuration
import { navigationService } from '../services/navigationService';
import { getMockNavigationData } from './mockNavigationData';

export const testMaintenanceSupervisorNavigation = () => {
  console.log('🧪 Testing Maintenance Supervisor Navigation Configuration...\n');

  // Test 1: Check if app ID is mapped correctly
  const screenName = navigationService.getScreenName('MAINTENANCE SUPERVISER');
  console.log('✅ Screen Name Mapping:');
  console.log('   App ID: "MAINTENANCE SUPERVISER"');
  console.log('   Screen: "' + screenName + '"');
  console.log('   Expected: "MaintenanceDashboard"');
  console.log('   Status: ' + (screenName === 'MaintenanceDashboard' ? 'PASS' : 'FAIL') + '\n');

  // Test 2: Check if label is mapped correctly
  const label = navigationService.getNavigationLabel('MAINTENANCE SUPERVISER');
  console.log('✅ Label Mapping:');
  console.log('   App ID: "MAINTENANCE SUPERVISER"');
  console.log('   Label: "' + label + '"');
  console.log('   Expected: "Maintenance Supervisor"');
  console.log('   Status: ' + (label === 'Maintenance Supervisor' ? 'PASS' : 'FAIL') + '\n');

  // Test 3: Check if icon is mapped correctly
  const icon = navigationService.getNavigationIcon('MAINTENANCE SUPERVISER');
  console.log('✅ Icon Mapping:');
  console.log('   App ID: "MAINTENANCE SUPERVISER"');
  console.log('   Icon: "' + icon + '"');
  console.log('   Expected: "wrench"');
  console.log('   Status: ' + (icon === 'wrench' ? 'PASS' : 'FAIL') + '\n');

  // Test 4: Check mock data
  const mockData = getMockNavigationData();
  const maintenanceItem = mockData.data.find(item => item.app_id === 'MAINTENANCE SUPERVISER');
  console.log('✅ Mock Data Configuration:');
  if (maintenanceItem) {
    console.log('   App ID: "' + maintenanceItem.app_id + '"');
    console.log('   Label: "' + maintenanceItem.label + '"');
    console.log('   Sequence: ' + maintenanceItem.sequence);
    console.log('   Access Level: "' + maintenanceItem.access_level + '"');
    console.log('   Status: ' + (maintenanceItem.int_status === 1 ? 'Active' : 'Inactive'));
    console.log('   Status: PASS\n');
  } else {
    console.log('   Status: FAIL - Maintenance Supervisor not found in mock data\n');
  }

  // Test 5: Check access control
  const hasAccess = navigationService.hasAccess(mockData, 'MAINTENANCE SUPERVISER', 'A');
  console.log('✅ Access Control:');
  console.log('   App ID: "MAINTENANCE SUPERVISER"');
  console.log('   Required Access: "A" (Admin)');
  console.log('   Has Access: ' + (hasAccess ? 'Yes' : 'No'));
  console.log('   Status: ' + (hasAccess ? 'PASS' : 'FAIL') + '\n');

  // Test 6: Check sorted navigation
  const sortedNavigation = navigationService.getSortedNavigation(mockData);
  const maintenanceInSorted = sortedNavigation.find(item => item.app_id === 'MAINTENANCE SUPERVISER');
  console.log('✅ Sorted Navigation:');
  console.log('   Total Items: ' + sortedNavigation.length);
  console.log('   Maintenance Supervisor Found: ' + (maintenanceInSorted ? 'Yes' : 'No'));
  console.log('   Status: ' + (maintenanceInSorted ? 'PASS' : 'FAIL') + '\n');

  console.log('🎯 Navigation Configuration Test Complete!');
  console.log('📱 The Maintenance Supervisor should now appear in the navigation menu.');
  console.log('🔧 App ID: "MAINTENANCE SUPERVISER"');
  console.log('🏷️  Label: "Maintenance Supervisor"');
  console.log('🎨 Icon: "wrench"');
  console.log('📺 Screen: "MaintenanceDashboard"');
};

// Run the test if this file is executed directly
if (require.main === module) {
  testMaintenanceSupervisorNavigation();
}
